import { useState, useEffect, useRef } from "react";
import { novaPoshtaAPI, type NovaPoshtaCity, type NovaPoshtaWarehouse } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovaPoshtaDeliveryProps {
  cityRef: string | null;
  warehouseRef: string | null;
  deliveryType: 'PostOffice' | 'Postomat';
  onCityChange: (city: NovaPoshtaCity | null) => void;
  onWarehouseChange: (warehouse: NovaPoshtaWarehouse | null) => void;
  onDeliveryTypeChange: (type: 'PostOffice' | 'Postomat') => void;
}

export const NovaPoshtaDelivery = ({
  cityRef,
  warehouseRef,
  deliveryType,
  onCityChange,
  onWarehouseChange,
  onDeliveryTypeChange,
}: NovaPoshtaDeliveryProps) => {
  const [popularCities, setPopularCities] = useState<NovaPoshtaCity[]>([]);
  const [searchCities, setSearchCities] = useState<NovaPoshtaCity[]>([]);
  const [warehouses, setWarehouses] = useState<NovaPoshtaWarehouse[]>([]);
  const [selectedCity, setSelectedCity] = useState<NovaPoshtaCity | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<NovaPoshtaWarehouse | null>(null);
  
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const [isWarehouseSearchOpen, setIsWarehouseSearchOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState("");

  const citySearchRef = useRef<HTMLDivElement>(null);
  const warehouseSearchRef = useRef<HTMLDivElement>(null);

  // Загрузка популярных городов
  useEffect(() => {
    novaPoshtaAPI.getPopularCities().then(setPopularCities).catch(console.error);
  }, []);

  // Загрузка выбранного города при монтировании
  useEffect(() => {
    if (cityRef) {
      novaPoshtaAPI.getCity(cityRef)
        .then(city => {
          setSelectedCity(city);
          onCityChange(city);
        })
        .catch(console.error);
    }
  }, []);

  // Загрузка выбранного отделения при монтировании
  useEffect(() => {
    if (warehouseRef && selectedCity) {
      novaPoshtaAPI.getWarehouse(warehouseRef)
        .then(warehouse => {
          setSelectedWarehouse(warehouse);
          onWarehouseChange(warehouse);
        })
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseRef, selectedCity]);

  // Поиск городов
  useEffect(() => {
    if (citySearchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        novaPoshtaAPI.searchCities(citySearchQuery)
          .then(setSearchCities)
          .catch(console.error);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchCities([]);
    }
  }, [citySearchQuery]);

  // Загрузка отделений при выборе города или изменении типа доставки
  useEffect(() => {
    if (selectedCity) {
      console.log('🔄 [NovaPoshtaDelivery] Loading warehouses for city:', {
        cityRef: selectedCity.ref,
        cityName: selectedCity.description_ua,
        deliveryType
      });
      
      setIsCitySearchOpen(false);
      setCitySearchQuery("");
      setSearchCities([]);
      
      // Сбрасываем выбранное отделение при изменении типа доставки
      if (selectedWarehouse) {
        setSelectedWarehouse(null);
        onWarehouseChange(null);
      }
      
      novaPoshtaAPI.getWarehouses(selectedCity.ref, deliveryType)
        .then((warehouses) => {
          console.log(`✅ [NovaPoshtaDelivery] Loaded ${warehouses.length} warehouses for city ${selectedCity.ref}`);
          if (warehouses.length > 0) {
            console.log('📦 [NovaPoshtaDelivery] Sample warehouse:', warehouses[0]);
          }
          setWarehouses(warehouses);
        })
        .catch((error) => {
          console.error('❌ [NovaPoshtaDelivery] Error loading warehouses:', error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, deliveryType]);

  // Закрытие поиска при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (citySearchRef.current && !citySearchRef.current.contains(event.target as Node)) {
        setIsCitySearchOpen(false);
      }
      if (warehouseSearchRef.current && !warehouseSearchRef.current.contains(event.target as Node)) {
        setIsWarehouseSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (city: NovaPoshtaCity) => {
    setSelectedCity(city);
    setSelectedWarehouse(null);
    onCityChange(city);
    onWarehouseChange(null);
    setIsCitySearchOpen(false);
    setCitySearchQuery("");
  };

  const handleWarehouseSelect = (warehouse: NovaPoshtaWarehouse) => {
    setSelectedWarehouse(warehouse);
    onWarehouseChange(warehouse);
    setIsWarehouseSearchOpen(false);
    setWarehouseSearchQuery("");
  };

  const displayedCities = citySearchQuery.length >= 2 ? searchCities : popularCities;

  return (
    <div className="space-y-4">
      {/* Тип доставки */}
      <div className="space-y-3">
        <Label>Тип доставки</Label>
        <RadioGroup
          value={deliveryType}
          onValueChange={(value) => onDeliveryTypeChange(value as 'PostOffice' | 'Postomat')}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="PostOffice" id="postoffice" />
            <span>У відділення</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="Postomat" id="postomat" />
            <span>У поштомат</span>
          </label>
        </RadioGroup>
      </div>

      {/* Выбор города */}
      <div className="space-y-2" ref={citySearchRef}>
        <Label htmlFor="city">Населений пункт *</Label>
        <div className="relative">
          <div
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm cursor-pointer",
              "hover:border-primary transition-colors",
              selectedCity && "border-primary"
            )}
            onClick={() => {
              setIsCitySearchOpen(!isCitySearchOpen);
              if (!isCitySearchOpen) {
                setCitySearchQuery("");
              }
            }}
          >
            <span className={selectedCity ? "text-foreground" : "text-muted-foreground"}>
              {selectedCity ? selectedCity.full_description_ua : "Виберіть населений пункт"}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isCitySearchOpen && "rotate-180")} />
          </div>

          {isCitySearchOpen && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-xl shadow-lg max-h-96 overflow-hidden">
              {/* Поле поиска */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Почніть вводити назву населеного пункту від 3-х букв"
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {/* Список городов */}
              <div className="max-h-80 overflow-y-auto">
                {displayedCities.length > 0 ? (
                  <div className="p-2">
                    {displayedCities.map((city) => (
                      <div
                        key={city.ref}
                        onClick={() => handleCitySelect(city)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                          selectedCity?.ref === city.ref && "bg-accent"
                        )}
                      >
                        {selectedCity?.ref === city.ref && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        <span className="flex-1">{city.full_description_ua}</span>
                      </div>
                    ))}
                  </div>
                ) : citySearchQuery.length >= 2 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Нічого не знайдено
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Почніть вводити назву міста
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Популярные города (когда поле закрыто и город не выбран) */}
        {!isCitySearchOpen && !selectedCity && popularCities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {popularCities.slice(0, 5).map((city) => (
              <button
                key={city.ref}
                type="button"
                onClick={() => handleCitySelect(city)}
                className="px-3 py-1.5 text-sm border rounded-lg hover:border-primary hover:bg-accent transition-colors"
              >
                {city.description_ua}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Выбор отделения */}
      {selectedCity && (
        <div className="space-y-2" ref={warehouseSearchRef}>
          <Label htmlFor="warehouse">
            {deliveryType === 'PostOffice' ? 'Відділення *' : 'Поштомат *'}
          </Label>
          <div className="relative">
            <div
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm cursor-pointer",
                "hover:border-primary transition-colors",
                selectedWarehouse && "border-primary"
              )}
              onClick={() => {
                const willOpen = !isWarehouseSearchOpen;
                setIsWarehouseSearchOpen(willOpen);
                if (willOpen) {
                  // При открытии списка загружаем отделения, если они еще не загружены или поиск пустой
                  setWarehouseSearchQuery("");
                  console.log('📂 [NovaPoshtaDelivery] Opening warehouse dropdown:', {
                    cityRef: selectedCity?.ref,
                    currentWarehousesCount: warehouses.length,
                    deliveryType
                  });
                  
                  if (selectedCity && (warehouses.length === 0 || warehouseSearchQuery)) {
                    console.log('🔄 [NovaPoshtaDelivery] Loading warehouses on dropdown open');
                    novaPoshtaAPI.getWarehouses(selectedCity.ref, deliveryType)
                      .then((warehouses) => {
                        console.log(`✅ [NovaPoshtaDelivery] Loaded ${warehouses.length} warehouses on open`);
                        setWarehouses(warehouses);
                      })
                      .catch((error) => {
                        console.error('❌ [NovaPoshtaDelivery] Error loading warehouses on open:', error);
                      });
                  } else {
                    console.log('ℹ️  [NovaPoshtaDelivery] Warehouses already loaded, skipping');
                  }
                }
              }}
            >
              <span className={selectedWarehouse ? "text-foreground" : "text-muted-foreground"}>
                {selectedWarehouse ? selectedWarehouse.description_ua : "Виберіть відділення"}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isWarehouseSearchOpen && "rotate-180")} />
            </div>

            {isWarehouseSearchOpen && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-xl shadow-lg max-h-96 overflow-hidden">
                {/* Поле поиска */}
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Введіть номер або адресу відділення"
                      value={warehouseSearchQuery}
                      onChange={(e) => {
                        const searchValue = e.target.value.trim();
                        setWarehouseSearchQuery(e.target.value);
                        console.log('🔍 [NovaPoshtaDelivery] Warehouse search:', {
                          query: searchValue,
                          cityRef: selectedCity?.ref,
                          deliveryType
                        });
                        
                        // Поиск в реальном времени
                        if (selectedCity) {
                          novaPoshtaAPI.getWarehouses(selectedCity.ref, deliveryType, searchValue || undefined)
                            .then((warehouses) => {
                              console.log(`✅ [NovaPoshtaDelivery] Search found ${warehouses.length} warehouses`);
                              setWarehouses(warehouses);
                            })
                            .catch((error) => {
                              console.error('❌ [NovaPoshtaDelivery] Search error:', error);
                            });
                        }
                      }}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Список отделений */}
                <div className="max-h-80 overflow-y-auto">
                  {warehouses.length > 0 ? (
                    <div className="p-2">
                      {warehouses.map((warehouse) => (
                        <div
                          key={warehouse.ref}
                          onClick={() => handleWarehouseSelect(warehouse)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                            selectedWarehouse?.ref === warehouse.ref && "bg-accent"
                          )}
                        >
                          {selectedWarehouse?.ref === warehouse.ref && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                          <span className="flex-1 text-sm">{warehouse.description_ua}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Нічого не знайдено
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

