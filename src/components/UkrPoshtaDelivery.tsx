import { useState, useEffect, useRef } from "react";
import { ukrposhtaAPI, type UkrposhtaCity, type UkrposhtaBranch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UkrPoshtaDeliveryProps {
  cityId: string | null;
  branchId: string | null;
  // Сохраненные данные для мгновенного отображения (из localStorage)
  savedCityName?: string | null;
  savedCityRegion?: string | null;
  savedBranchName?: string | null;
  savedBranchAddress?: string | null;
  savedBranchPostalCode?: string | null;
  isExpanded?: boolean;
  onCityChange: (city: UkrposhtaCity | null) => void;
  onBranchChange: (branch: UkrposhtaBranch | null) => void;
  onContinue?: () => void;
}

export const UkrPoshtaDelivery = ({
  cityId,
  branchId,
  savedCityName,
  savedCityRegion,
  savedBranchName,
  savedBranchAddress,
  savedBranchPostalCode,
  isExpanded = true,
  onCityChange,
  onBranchChange,
  onContinue,
}: UkrPoshtaDeliveryProps) => {
  const [popularCities, setPopularCities] = useState<UkrposhtaCity[]>([]);
  const [searchCities, setSearchCities] = useState<UkrposhtaCity[]>([]);
  const [branches, setBranches] = useState<UkrposhtaBranch[]>([]);
  const [selectedCity, setSelectedCity] = useState<UkrposhtaCity | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<UkrposhtaBranch | null>(null);
  
  // Инициализация из сохраненных данных для мгновенного отображения
  useEffect(() => {
    if (cityId && savedCityName && !selectedCity) {
      // ВАЖНО: savedCityName может содержать полное название "Город (Область)" или "Город (*)"
      // Извлекаем название города и область
      let cityName = savedCityName;
      let region = savedCityRegion || '';
      
      // Если savedCityName уже содержит область в скобках, извлекаем их
      const match = savedCityName.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        cityName = match[1].trim();
        const regionFromName = match[2].trim();
        // Если это "*", значит области нет
        if (regionFromName === '*') {
          region = '';
        } else {
          region = regionFromName;
        }
      }
      
      // Создаем объект города из сохраненных данных для мгновенного отображения
      const cityFromSaved: UkrposhtaCity = {
        id: cityId,
        name: cityName,
        postalCode: '',
        region: region,
        cityId: cityId,
      };
      setSelectedCity(cityFromSaved);
      console.log(`⚡ [UkrPoshtaDelivery] Instant city display from saved data:`, cityFromSaved);
    }
  }, [cityId, savedCityName, savedCityRegion, selectedCity]);
  
  useEffect(() => {
    if (branchId && savedBranchName && !selectedBranch && selectedCity) {
      // Создаем объект отделения из сохраненных данных для мгновенного отображения
      const branchFromSaved: UkrposhtaBranch = {
        id: branchId,
        name: savedBranchName,
        address: savedBranchAddress || '',
        postalCode: savedBranchPostalCode || '',
        cityId: selectedCity.id,
      };
      setSelectedBranch(branchFromSaved);
      console.log(`⚡ [UkrPoshtaDelivery] Instant branch display from saved data:`, branchFromSaved);
    }
  }, [branchId, savedBranchName, savedBranchAddress, savedBranchPostalCode, selectedBranch, selectedCity]);
  
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const [isBranchSearchOpen, setIsBranchSearchOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [branchSearchQuery, setBranchSearchQuery] = useState("");

  // Загрузка популярных городов
  useEffect(() => {
    ukrposhtaAPI.getPopularCities().then(setPopularCities).catch(console.error);
  }, []);

  // Загрузка выбранного города при монтировании или изменении cityId
  // По аналогии с NovaPoshtaDelivery - загружаем по ID через API
  useEffect(() => {
    if (cityId) {
      // ВАЛИДАЦИЯ: Проверяем, что cityId является валидным числовым CITY_ID
      // Если это строка (например, "kyiv" из старых данных), не пытаемся загрузить
      const cityIdNum = parseInt(cityId.toString(), 10);
      if (isNaN(cityIdNum) || cityIdNum <= 0) {
        console.warn(`⚠️ [UkrPoshtaDelivery] Invalid cityId (not a numeric CITY_ID): ${cityId}. Skipping API call.`);
        setSelectedCity(null);
        return;
      }
      
      console.log(`🔍 [UkrPoshtaDelivery] Loading city by ID: ${cityId}`);
      ukrposhtaAPI.getCity(cityId)
        .then(city => {
          console.log(`✅ [UkrPoshtaDelivery] Loaded city:`, city);
          setSelectedCity(city);
          // Не вызываем onCityChange здесь, чтобы не перезаписывать данные из props
        })
        .catch((error) => {
          // Не показываем ошибку как критическую, если это просто "City not found"
          // Это нормально, если город был удален из API или ID изменился
          if (error.message && error.message.includes('City not found')) {
            console.warn(`⚠️ [UkrPoshtaDelivery] City with ID ${cityId} not found in API. This may be normal if the city was removed or ID changed.`);
          } else {
            console.error(`❌ [UkrPoshtaDelivery] Error loading city ${cityId}:`, error);
          }
          // Если не удалось загрузить город по ID, сбрасываем выбранный город
          setSelectedCity(null);
        });
    } else {
      setSelectedCity(null);
    }
  }, [cityId]);

  // Загрузка выбранного отделения при монтировании или изменении branchId
  // По аналогии с NovaPoshtaDelivery - загружаем по ID через API
  // ВАЖНО: для получения отделения нужен cityId (CITY_ID)
  useEffect(() => {
    if (branchId && selectedCity) {
      const cityIdForBranch = selectedCity.cityId || selectedCity.id;
      ukrposhtaAPI.getBranch(branchId, cityIdForBranch)
        .then(branch => {
          setSelectedBranch(branch);
          // Не вызываем onBranchChange здесь, чтобы не перезаписывать данные из props
        })
        .catch(console.error);
    } else {
      setSelectedBranch(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, selectedCity]);

  // Поиск городов
  useEffect(() => {
    if (citySearchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        console.log('🔍 [UkrPoshtaDelivery] Searching cities for:', citySearchQuery);
        ukrposhtaAPI.searchCities(citySearchQuery)
          .then((cities) => {
            console.log(`✅ [UkrPoshtaDelivery] Found ${cities.length} cities:`, cities);
            setSearchCities(cities);
          })
          .catch((error) => {
            console.error('❌ [UkrPoshtaDelivery] Error searching cities:', error);
            setSearchCities([]);
          });
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchCities([]);
    }
  }, [citySearchQuery]);

  // Загрузка отделений при выборе города
  // Согласно документации адресного классификатора, для получения отделений нужен CITY_ID
  useEffect(() => {
    if (selectedCity) {
      // КРИТИЧНО: Для получения отделений нужен числовой CITY_ID
      // Если cityId отсутствует или не является числом, нужно сначала получить CITY_ID через API
      const cityIdForBranches = selectedCity.cityId;
      
      // Проверяем, что cityId является числом
      const cityIdNum = cityIdForBranches ? parseInt(cityIdForBranches.toString(), 10) : null;
      
      if (!cityIdNum || isNaN(cityIdNum)) {
        console.warn('⚠️ [UkrPoshtaDelivery] City does not have valid CITY_ID, trying to get it from API:', {
          cityName: selectedCity.name,
          cityId: cityIdForBranches,
          id: selectedCity.id,
        });
        
        // Если это популярный город без CITY_ID, пытаемся найти его через API
        if (selectedCity.name) {
          ukrposhtaAPI.searchCities(selectedCity.name)
            .then((cities) => {
              const foundCity = cities.find(c => 
                c.name.toLowerCase() === selectedCity.name.toLowerCase() && 
                c.cityId && 
                !isNaN(parseInt(c.cityId.toString(), 10))
              );
              
              if (foundCity && foundCity.cityId) {
                console.log('✅ [UkrPoshtaDelivery] Found CITY_ID for city:', foundCity);
                // Обновляем выбранный город с правильным cityId
                const updatedCity = { ...selectedCity, cityId: foundCity.cityId };
                setSelectedCity(updatedCity);
                onCityChange(updatedCity);
                // Загружаем отделения с правильным CITY_ID
                ukrposhtaAPI.getBranches(foundCity.cityId)
                  .then((branches) => {
                    console.log(`✅ [UkrPoshtaDelivery] Loaded ${branches.length} branches for city ${foundCity.cityId}`);
                    setBranches(branches);
                  })
                  .catch((error) => {
                    console.error('❌ [UkrPoshtaDelivery] Error loading branches:', error);
                    setBranches([]);
                  });
              } else {
                console.error('❌ [UkrPoshtaDelivery] Could not find CITY_ID for city:', selectedCity.name);
                setBranches([]);
              }
            })
            .catch((error) => {
              console.error('❌ [UkrPoshtaDelivery] Error searching for city:', error);
              setBranches([]);
            });
        } else {
          setBranches([]);
        }
        return;
      }
      
      console.log('🔄 [UkrPoshtaDelivery] Loading branches for city:', {
        cityId: cityIdNum,
        cityName: selectedCity.name,
      });
      
      setIsCitySearchOpen(false);
      setCitySearchQuery("");
      setSearchCities([]);
      
      setIsBranchSearchOpen(false);
      setBranchSearchQuery("");
      
      ukrposhtaAPI.getBranches(cityIdNum.toString())
        .then((branches) => {
          console.log(`✅ [UkrPoshtaDelivery] Loaded ${branches.length} branches for city ${cityIdNum}`);
          if (branches.length > 0) {
            console.log('📦 [UkrPoshtaDelivery] Sample branch:', branches[0]);
          }
          setBranches(branches);
        })
        .catch((error) => {
          console.error('❌ [UkrPoshtaDelivery] Error loading branches:', error);
          setBranches([]);
        });
    }
  }, [selectedCity]);

  // Загрузка отделений при открытии списка отделений
  useEffect(() => {
    if (isBranchSearchOpen && selectedCity) {
      if (branches.length === 0 || branchSearchQuery) {
        const cityIdForBranches = selectedCity.cityId;
        const cityIdNum = cityIdForBranches ? parseInt(cityIdForBranches.toString(), 10) : null;
        
        if (!cityIdNum || isNaN(cityIdNum)) {
          console.warn('⚠️ [UkrPoshtaDelivery] Cannot load branches: invalid CITY_ID');
          setBranches([]);
          return;
        }
        
        console.log('🔄 [UkrPoshtaDelivery] Loading branches on dropdown open');
        ukrposhtaAPI.getBranches(cityIdNum.toString(), branchSearchQuery || undefined)
          .then((branches) => {
            console.log(`✅ [UkrPoshtaDelivery] Loaded ${branches.length} branches on open`);
            setBranches(branches);
          })
          .catch((error) => {
            console.error('❌ [UkrPoshtaDelivery] Error loading branches on open:', error);
            setBranches([]);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBranchSearchOpen]);

  // Поиск отделений
  useEffect(() => {
    if (isBranchSearchOpen && selectedCity && branchSearchQuery.length >= 2) {
      const cityIdForBranches = selectedCity.cityId;
      const cityIdNum = cityIdForBranches ? parseInt(cityIdForBranches.toString(), 10) : null;
      
      if (!cityIdNum || isNaN(cityIdNum)) {
        console.warn('⚠️ [UkrPoshtaDelivery] Cannot search branches: invalid CITY_ID');
        setBranches([]);
        return;
      }
      
      const timeoutId = setTimeout(() => {
        ukrposhtaAPI.getBranches(cityIdNum.toString(), branchSearchQuery)
          .then((branches) => {
            console.log(`✅ [UkrPoshtaDelivery] Search found ${branches.length} branches`);
            setBranches(branches);
          })
          .catch((error) => {
            console.error('❌ [UkrPoshtaDelivery] Search error:', error);
            setBranches([]);
          });
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchSearchQuery, isBranchSearchOpen]);

  const handleCitySelect = (city: UkrposhtaCity) => {
    // ВАЖНО: Сохраняем полное название города с областью
    const cityWithFullName = {
      ...city,
      // Сохраняем полное название для отображения везде одинаково
      displayName: getCityFullName(city),
    };
    setSelectedCity(cityWithFullName);
    setSelectedBranch(null);
    onCityChange(cityWithFullName);
    onBranchChange(null);
    setIsCitySearchOpen(false);
    setCitySearchQuery("");
  };

  const handleBranchSelect = (branch: UkrposhtaBranch) => {
    setSelectedBranch(branch);
    onBranchChange(branch);
    setIsBranchSearchOpen(false);
    setBranchSearchQuery("");
  };

  // НЕ фильтруем города без области - показываем все города
  const displayedCities = citySearchQuery.length >= 2 ? searchCities : popularCities;
  
  // Единая функция для форматирования города с областью
  // ВАЖНО: Всегда показываем город в формате "Город (Область)" или "Город (*)" если области нет
  const getCityDisplayName = (city: UkrposhtaCity): string => {
    if (!city.region || city.region.trim() === '') {
      // Если области нет, показываем "Город (*)"
      return `${city.name} (*)`;
    }
    // Формат: "Дніпро (Дніпропетровська обл.)"
    return `${city.name} (${city.region})`;
  };
  
  // Функция для получения полного названия города для сохранения
  const getCityFullName = (city: UkrposhtaCity): string => {
    return getCityDisplayName(city);
  };

  return (
    <div className="space-y-4 pl-2">
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
              {selectedCity ? getCityDisplayName(selectedCity) : "Виберіть населений пункт"}
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
                        key={city.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCitySelect(city);
                        }}
                        className="px-3 py-1.5 text-sm border rounded-lg"
                      >
                        {getCityDisplayName(city)}
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
                        key={city.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCitySelect(city);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-left",
                          selectedCity?.id === city.id && "text-primary font-medium"
                        )}
                      >
                        {selectedCity?.id === city.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        <span className={cn("flex-1", selectedCity?.id === city.id && "text-primary")}>
                          {getCityDisplayName(city)}
                        </span>
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
            <span>Відділення</span>
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
                setIsBranchSearchOpen(!isBranchSearchOpen);
                if (!isBranchSearchOpen) {
                  setBranchSearchQuery("");
                }
              }}
            >
              <span className={selectedBranch ? "text-foreground" : "text-muted-foreground"}>
                {selectedBranch ? `${selectedBranch.name}, ${selectedBranch.address}` : "Виберіть відділення"}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", isBranchSearchOpen && "rotate-180")} />
            </div>

            {/* Раскрывающийся модуль с отделениями */}
            {isBranchSearchOpen && (
              <div className="border rounded-xl bg-background overflow-hidden">
                {/* Поле поиска */}
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Виберіть відділення"
                      value={branchSearchQuery}
                      onChange={(e) => setBranchSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Список отделений */}
                <div className="max-h-80 overflow-y-auto">
                  {branches.length > 0 ? (
                    <ul className="p-2 space-y-1">
                      {branches.map((branch) => (
                        <li key={branch.id}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBranchSelect(branch);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-left",
                              selectedBranch?.id === branch.id && "text-primary font-medium"
                            )}
                          >
                            {selectedBranch?.id === branch.id && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                            <span className={cn("flex-1 text-sm", selectedBranch?.id === branch.id && "text-primary")}>
                              {branch.name}, {branch.address}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      {branchSearchQuery.length >= 2 ? "Нічого не знайдено" : "Завантаження..."}
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
            disabled={!selectedCity || !selectedBranch}
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

