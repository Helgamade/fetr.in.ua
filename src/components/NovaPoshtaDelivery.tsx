import { useState, useEffect, useRef } from "react";
import { novaPoshtaAPI, type NovaPoshtaCity, type NovaPoshtaWarehouse } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovaPoshtaDeliveryProps {
  cityRef: string | null;
  warehouseRef: string | null;
  deliveryType: 'PostOffice' | 'Postomat';
  isExpanded?: boolean;
  onCityChange: (city: NovaPoshtaCity | null) => void;
  onWarehouseChange: (warehouse: NovaPoshtaWarehouse | null) => void;
  onDeliveryTypeChange: (type: 'PostOffice' | 'Postomat') => void;
  onContinue?: () => void;
}

export const NovaPoshtaDelivery = ({
  cityRef,
  warehouseRef,
  deliveryType,
  isExpanded = true,
  onCityChange,
  onWarehouseChange,
  onDeliveryTypeChange,
  onContinue,
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

  // Загрузка популярных городов
  useEffect(() => {
    novaPoshtaAPI.getPopularCities().then(setPopularCities).catch(console.error);
  }, []);

  // Загрузка выбранного города при монтировании или изменении cityRef
  useEffect(() => {
    if (cityRef) {
      novaPoshtaAPI.getCity(cityRef)
        .then(city => {
          setSelectedCity(city);
          // Не вызываем onCityChange здесь, чтобы не перезаписывать данные из props
        })
        .catch(console.error);
    } else {
      setSelectedCity(null);
    }
  }, [cityRef]);

  // Загрузка выбранного отделения при монтировании или изменении warehouseRef
  useEffect(() => {
    if (warehouseRef && selectedCity) {
      novaPoshtaAPI.getWarehouse(warehouseRef)
        .then(warehouse => {
          setSelectedWarehouse(warehouse);
          // Не вызываем onWarehouseChange здесь, чтобы не перезаписывать данные из props
        })
        .catch(console.error);
    } else {
      setSelectedWarehouse(null);
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
      
      // Закрываем список отделений при изменении типа доставки
      setIsWarehouseSearchOpen(false);
      setWarehouseSearchQuery("");
      
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

  // Загрузка отделений при открытии списка отделений
  useEffect(() => {
    if (isWarehouseSearchOpen && selectedCity) {
      if (warehouses.length === 0 || warehouseSearchQuery) {
        console.log('🔄 [NovaPoshtaDelivery] Loading warehouses on dropdown open');
        novaPoshtaAPI.getWarehouses(selectedCity.ref, deliveryType, warehouseSearchQuery || undefined)
          .then((warehouses) => {
            console.log(`✅ [NovaPoshtaDelivery] Loaded ${warehouses.length} warehouses on open`);
            setWarehouses(warehouses);
          })
          .catch((error) => {
            console.error('❌ [NovaPoshtaDelivery] Error loading warehouses on open:', error);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWarehouseSearchOpen]);

  // Поиск отделений
  useEffect(() => {
    if (isWarehouseSearchOpen && selectedCity && warehouseSearchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        novaPoshtaAPI.getWarehouses(selectedCity.ref, deliveryType, warehouseSearchQuery)
          .then((warehouses) => {
            console.log(`✅ [NovaPoshtaDelivery] Search found ${warehouses.length} warehouses`);
            setWarehouses(warehouses);
          })
          .catch((error) => {
            console.error('❌ [NovaPoshtaDelivery] Search error:', error);
          });
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseSearchQuery, isWarehouseSearchOpen]);

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
    <div className="space-y-4 pl-2">
      {/* Тип доставки */}
      <div className="space-y-3">
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
      <fieldset className="space-y-2">
        <legend className="flex items-center gap-1 text-sm font-medium">
          <span>Населений пункт</span>
          <span className="text-red-500">*</span>
        </legend>
        
        <div className="space-y-2">
          <div
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm cursor-pointer",
              "hover:border-primary transition-colors",
              !selectedCity && "opacity-60"
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
            <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", isCitySearchOpen && "rotate-180")} />
          </div>

          {/* Раскрывающийся модуль с городами */}
          {isCitySearchOpen && (
            <div className="border rounded-xl bg-background overflow-hidden">
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
                        onClick={(e) => e.stopPropagation()}
                      />
                </div>
              </div>

              {/* Популярные города (когда поиск пустой) */}
              {citySearchQuery.length < 2 && popularCities.length > 0 && (
                <div className="p-3 border-b">
                  <div className="flex flex-wrap gap-2">
                    {popularCities.slice(0, 5).map((city) => (
                      <button
                        key={city.ref}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCitySelect(city);
                        }}
                        className="px-3 py-1.5 text-sm border rounded-lg"
                      >
                        {city.description_ua}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Список городов */}
              <div className="max-h-80 overflow-y-auto">
                {displayedCities.length > 0 ? (
                  <div className="p-2">
                    {displayedCities.map((city) => (
                      <button
                        key={city.ref}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCitySelect(city);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-left",
                          selectedCity?.ref === city.ref && "text-primary font-medium"
                        )}
                      >
                        {selectedCity?.ref === city.ref && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        <span className={cn("flex-1", selectedCity?.ref === city.ref && "text-primary")}>{city.full_description_ua}</span>
                      </button>
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
      </fieldset>

      {/* Выбор отделения */}
      {selectedCity && (
        <fieldset className="space-y-2">
          <legend className="flex items-center gap-1 text-sm font-medium">
            <span>{deliveryType === 'PostOffice' ? 'Відділення' : 'Поштомат'}</span>
            <span className="text-red-500">*</span>
          </legend>
          
          <div className="space-y-2">
            <div
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm cursor-pointer",
                "hover:border-primary transition-colors",
                !selectedCity && "opacity-60"
              )}
              onClick={() => {
                setIsWarehouseSearchOpen(!isWarehouseSearchOpen);
                if (!isWarehouseSearchOpen) {
                  setWarehouseSearchQuery("");
                }
              }}
            >
              <span className={selectedWarehouse ? "text-foreground" : "text-muted-foreground"}>
                {selectedWarehouse ? selectedWarehouse.description_ua : "Виберіть відділення"}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", isWarehouseSearchOpen && "rotate-180")} />
            </div>

            {/* Раскрывающийся модуль с отделениями */}
            {isWarehouseSearchOpen && (
              <div className="border rounded-xl bg-background overflow-hidden">
                {/* Поле поиска */}
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Виберіть відділення"
                      value={warehouseSearchQuery}
                      onChange={(e) => setWarehouseSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Список отделений */}
                <div className="max-h-80 overflow-y-auto">
                  {warehouses.length > 0 ? (
                    <ul className="p-2 space-y-1">
                      {warehouses.map((warehouse) => (
                        <li key={warehouse.ref}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWarehouseSelect(warehouse);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-left",
                              selectedWarehouse?.ref === warehouse.ref && "text-primary font-medium"
                            )}
                          >
                            {selectedWarehouse?.ref === warehouse.ref && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                            <span className={cn("flex-1 text-sm", selectedWarehouse?.ref === warehouse.ref && "text-primary")}>{warehouse.description_ua}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {warehouseSearchQuery.length >= 2 ? "Нічого не знайдено" : "Завантаження..."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </fieldset>
      )}

      {/* Кнопка Продовжити */}
      {isExpanded && onContinue && (
        <div className="pt-4">
          <Button
            type="button"
            onClick={onContinue}
            disabled={!selectedCity || !selectedWarehouse}
            variant="outline"
            className="w-full rounded-xl border h-10 hover:border hover:bg-transparent hover:text-primary disabled:hover:text-primary disabled:opacity-50"
          >
            Продовжити
          </Button>
        </div>
      )}
    </div>
  );
};
