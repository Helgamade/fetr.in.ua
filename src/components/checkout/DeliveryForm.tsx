import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Pencil } from "lucide-react";
import { NovaPoshtaDelivery } from "@/components/NovaPoshtaDelivery";
import { UkrPoshtaDelivery } from "@/components/UkrPoshtaDelivery";
import { NovaPoshtaLogo, UkrposhtaLogo, PickupLogo } from "@/components/DeliveryLogos";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { useTexts, SiteText } from "@/hooks/useTexts";
import { novaPoshtaAPI, ukrposhtaAPI } from "@/lib/api";
import type { DeliveryInfo } from "@/types/store";
import type { NovaPoshtaCity, NovaPoshtaWarehouse, UkrposhtaCity, UkrposhtaBranch } from "@/lib/api";

interface DeliveryFormProps {
  delivery: DeliveryInfo;
  onSave: (delivery: DeliveryInfo) => void;
  onCancel?: () => void;
  mode?: 'edit' | 'view';
  defaultExpanded?: boolean;
  orderTotal?: number; // Для расчета бесплатной доставки
  isCompleted?: boolean; // Для отображения иконки валидации
  onToggleExpanded?: () => void; // Для клика по заголовку
}

interface DeliveryFormData {
  method: 'nova_poshta' | 'ukr_poshta' | 'pickup';
  // Нова Пошта
  novaPoshtaCity?: string;
  novaPoshtaCityRef?: string | null;
  novaPoshtaPostOfficeWarehouse?: string;
  novaPoshtaPostOfficeWarehouseRef?: string | null;
  novaPoshtaPostOfficeCompleted?: boolean;
  novaPoshtaPostomatWarehouse?: string;
  novaPoshtaPostomatWarehouseRef?: string | null;
  novaPoshtaPostomatCompleted?: boolean;
  novaPoshtaDeliveryType?: 'PostOffice' | 'Postomat';
  novaPoshtaExpanded?: boolean | undefined;
  // Укрпошта
  ukrPoshtaCity?: string;
  ukrPoshtaCityId?: string | null;
  ukrPoshtaCityRegion?: string;
  ukrPoshtaBranch?: string;
  ukrPoshtaBranchId?: string | null;
  ukrPoshtaPostalCode?: string;
  ukrPoshtaAddress?: string;
  ukrPoshtaCompleted?: boolean;
  ukrPoshtaExpanded?: boolean | undefined;
}

export const DeliveryForm = ({
  delivery: initialDelivery,
  onSave,
  onCancel,
  mode = 'view',
  defaultExpanded = false,
  orderTotal = 0,
  isCompleted,
  onToggleExpanded,
}: DeliveryFormProps) => {
  const { data: storeSettings = {} } = usePublicSettings();
  const { data: textsData } = useTexts();
  const texts: SiteText[] = Array.isArray(textsData) ? textsData : [];
  
  const deliveryNovaPoshtaTitle = texts.find(t => t.key === 'checkout.delivery.nova_poshta.title')?.value || 'Нова Пошта';
  const deliveryNovaPoshtaDescription = texts.find(t => t.key === 'checkout.delivery.nova_poshta.description')?.value || '1-2 дні по Україні';
  const deliveryUkrposhtaTitle = texts.find(t => t.key === 'checkout.delivery.ukrposhta.title')?.value || 'Укрпошта';
  const deliveryUkrposhtaDescription = texts.find(t => t.key === 'checkout.delivery.ukrposhta.description')?.value || '3-5 днів по Україні';
  const deliveryPickupTitle = texts.find(t => t.key === 'checkout.delivery.pickup.title')?.value || 'Самовивіз';

  const FREE_DELIVERY_THRESHOLD = typeof storeSettings.free_delivery_threshold === 'number' 
    ? storeSettings.free_delivery_threshold 
    : parseInt(String(storeSettings.free_delivery_threshold || '1500')) || 1500;

  const [isExpanded, setIsExpanded] = useState(defaultExpanded || mode === 'edit');
  const [formData, setFormData] = useState<DeliveryFormData>(() => {
    // Парсим данные из initialDelivery
    // В базе данных используется "ukrposhta" без подчеркивания, но в форме используем "ukr_poshta" как в Checkout
    const dbMethod = initialDelivery.method as 'nova_poshta' | 'ukrposhta' | 'pickup';
    const method = dbMethod === 'ukrposhta' ? 'ukr_poshta' : dbMethod;
    
    if (method === 'nova_poshta') {
      // Проверяем, есть ли сохраненные данные из базы
      const hasCity = !!initialDelivery.city;
      const hasWarehouse = !!initialDelivery.warehouse;
      const hasCityRef = !!initialDelivery.cityRef;
      const hasWarehouseRef = !!initialDelivery.warehouseRef;
      const isCompleted = hasCity && hasWarehouse;
      
      return {
        method,
        novaPoshtaCity: initialDelivery.city || '',
        novaPoshtaCityRef: initialDelivery.cityRef || null, // Используем ref из базы, если есть
        novaPoshtaPostOfficeWarehouse: initialDelivery.warehouse || '',
        novaPoshtaPostOfficeWarehouseRef: initialDelivery.warehouseRef || null, // Используем ref из базы, если есть
        novaPoshtaPostOfficeCompleted: isCompleted, // true если данные есть в БД
        novaPoshtaPostomatWarehouse: '',
        novaPoshtaPostomatWarehouseRef: null,
        novaPoshtaPostomatCompleted: false,
        novaPoshtaDeliveryType: 'PostOffice', // По умолчанию PostOffice, можно определить по warehouse если нужно
        novaPoshtaExpanded: isCompleted && (defaultExpanded || mode === 'edit'), // Открываем если данные есть
      };
    } else if (method === 'ukr_poshta') {
      // Проверяем, есть ли сохраненные данные из базы
      const hasCity = !!initialDelivery.city;
      const hasBranch = !!initialDelivery.warehouse;
      const hasCityRef = !!initialDelivery.cityRef; // Для Укрпошта cityRef содержит ID города
      const hasWarehouseRef = !!initialDelivery.warehouseRef; // Для Укрпошта warehouseRef содержит ID отделения
      const isCompleted = hasCity && hasBranch;
      
      // Пытаемся извлечь область из названия города (формат "Город (Область)" или просто "Город")
      let cityRegion = '';
      let cityName = initialDelivery.city || '';
      if (cityName.includes('(') && cityName.includes(')')) {
        const match = cityName.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
          cityName = match[1].trim();
          cityRegion = match[2].trim();
        }
      }
      
      return {
        method,
        ukrPoshtaCity: initialDelivery.city || '', // Сохраняем полное название как есть
        ukrPoshtaCityId: initialDelivery.cityRef || null, // Используем cityRef из базы как ID города
        ukrPoshtaCityRegion: cityRegion,
        ukrPoshtaBranch: initialDelivery.warehouse || '',
        ukrPoshtaBranchId: initialDelivery.warehouseRef || null, // Используем warehouseRef из базы как ID отделения
        ukrPoshtaPostalCode: initialDelivery.postIndex || '',
        ukrPoshtaAddress: initialDelivery.address || '',
        ukrPoshtaCompleted: isCompleted, // true если данные есть в БД
        ukrPoshtaExpanded: isCompleted && (defaultExpanded || mode === 'edit'), // Открываем если данные есть
      };
    }
    
    return { method };
  });

  // Функция для получения сохраненных данных доставки (как в Checkout)
  const getSavedDeliveryData = (method: string) => {
    if (method === "nova_poshta") {
      const warehouse = formData.novaPoshtaDeliveryType === "PostOffice" 
        ? formData.novaPoshtaPostOfficeWarehouse 
        : formData.novaPoshtaPostomatWarehouse;
      const completed = formData.novaPoshtaDeliveryType === "PostOffice"
        ? formData.novaPoshtaPostOfficeCompleted
        : formData.novaPoshtaPostomatCompleted;
      return {
        city: formData.novaPoshtaCity,
        warehouse: warehouse,
        completed: completed,
      };
    } else if (method === "ukr_poshta" || method === "ukrposhta") {
      return {
        city: formData.ukrPoshtaCity,
        cityRegion: formData.ukrPoshtaCityRegion,
        branch: formData.ukrPoshtaBranch,
        postalCode: formData.ukrPoshtaPostalCode,
        address: formData.ukrPoshtaAddress,
        completed: formData.ukrPoshtaCompleted,
      };
    }
    return null;
  };

  // Загрузка ref'ов для Новой Почты из базы данных при инициализации (только если ref'ов нет)
  useEffect(() => {
    if (formData.method === 'nova_poshta' && 
        formData.novaPoshtaCity && 
        !formData.novaPoshtaCityRef && 
        isExpanded &&
        mode === 'edit') { // Только в режиме редактирования
      // Ищем город по названию
      const cityName = formData.novaPoshtaCity.trim();
      novaPoshtaAPI.searchCities(cityName)
        .then(cities => {
          // Ищем точное совпадение или первое похожее
          const foundCity = cities.find(c => 
            c.full_description_ua === cityName || 
            c.description_ua === cityName ||
            c.full_description_ua.includes(cityName) ||
            cityName.includes(c.description_ua)
          ) || cities[0];
          
          if (foundCity) {
            setFormData(prev => ({
              ...prev,
              novaPoshtaCityRef: foundCity.ref,
              novaPoshtaCity: foundCity.full_description_ua, // Обновляем на полное название
            }));
            
            // Если есть warehouse, ищем его ref
            const warehouseName = formData.novaPoshtaPostOfficeWarehouse || formData.novaPoshtaPostomatWarehouse;
            if (warehouseName && foundCity.ref) {
              const deliveryType = formData.novaPoshtaDeliveryType || 'PostOffice';
              novaPoshtaAPI.getWarehouses(foundCity.ref, deliveryType)
                .then(warehouses => {
                  const foundWarehouse = warehouses.find(w => 
                    w.description_ua === warehouseName ||
                    w.description_ua.includes(warehouseName) ||
                    warehouseName.includes(w.description_ua)
                  ) || warehouses[0];
                  
                  if (foundWarehouse) {
                    setFormData(prev => {
                      if (deliveryType === 'PostOffice') {
                        return {
                          ...prev,
                          novaPoshtaPostOfficeWarehouseRef: foundWarehouse.ref,
                          novaPoshtaPostOfficeWarehouse: foundWarehouse.description_ua,
                        };
                      } else {
                        return {
                          ...prev,
                          novaPoshtaPostomatWarehouseRef: foundWarehouse.ref,
                          novaPoshtaPostomatWarehouse: foundWarehouse.description_ua,
                        };
                      }
                    });
                  }
                })
                .catch(console.error);
            }
          }
        })
        .catch(console.error);
    }
  }, [formData.method, formData.novaPoshtaCity, formData.novaPoshtaCityRef, formData.novaPoshtaPostOfficeWarehouse, formData.novaPoshtaPostomatWarehouse, formData.novaPoshtaDeliveryType, isExpanded]);

  // Загрузка ID для Укрпошта из базы данных при инициализации (только если ID нет)
  useEffect(() => {
    if (formData.method === 'ukr_poshta' && 
        formData.ukrPoshtaCity && 
        !formData.ukrPoshtaCityId && 
        isExpanded &&
        mode === 'edit') { // Только в режиме редактирования
      // Ищем город по названию
      const cityName = formData.ukrPoshtaCity.trim();
      // Убираем область из названия для поиска (формат "Город (Область)")
      const cityNameOnly = cityName.replace(/\s*\([^)]*\)\s*$/, '').trim();
      
      ukrposhtaAPI.searchCities(cityNameOnly)
        .then(cities => {
          // Ищем точное совпадение или первое похожее
          const foundCity = cities.find(c => 
            c.name === cityNameOnly ||
            c.name.includes(cityNameOnly) ||
            cityNameOnly.includes(c.name)
          ) || cities[0];
          
          if (foundCity) {
            // Формируем полное название с областью
            const cityFullName = foundCity.region && foundCity.region.trim() !== ''
              ? `${foundCity.name} (${foundCity.region})`
              : `${foundCity.name} (*)`;
            
            setFormData(prev => ({
              ...prev,
              ukrPoshtaCityId: foundCity.id,
              ukrPoshtaCity: cityFullName,
              ukrPoshtaCityRegion: foundCity.region || '',
            }));
            
            // Если есть branch, ищем его ID
            if (formData.ukrPoshtaBranch && foundCity.id) {
              ukrposhtaAPI.getBranches(foundCity.id)
                .then(branches => {
                  const branchName = formData.ukrPoshtaBranch.trim();
                  const foundBranch = branches.find(b => 
                    b.name === branchName ||
                    b.name.includes(branchName) ||
                    branchName.includes(b.name)
                  ) || branches[0];
                  
                  if (foundBranch) {
                    setFormData(prev => ({
                      ...prev,
                      ukrPoshtaBranchId: foundBranch.id,
                      ukrPoshtaBranch: foundBranch.name,
                      ukrPoshtaPostalCode: foundBranch.postalCode || prev.ukrPoshtaPostalCode,
                      ukrPoshtaAddress: foundBranch.address || prev.ukrPoshtaAddress,
                    }));
                  }
                })
                .catch(console.error);
            }
          }
        })
        .catch(console.error);
    }
  }, [formData.method, formData.ukrPoshtaCity, formData.ukrPoshtaCityId, formData.ukrPoshtaBranch, isExpanded]);

  // При открытии формы редактирования автоматически открываем соответствующую форму доставки
  useEffect(() => {
    if (isExpanded) {
      // Если данные уже есть (completed = true), но форма не развернута - разворачиваем
      if (formData.method === 'nova_poshta' && formData.novaPoshtaExpanded === false) {
        setFormData(prev => ({ ...prev, novaPoshtaExpanded: true }));
      } else if (formData.method === 'ukr_poshta' && formData.ukrPoshtaExpanded === false) {
        setFormData(prev => ({ ...prev, ukrPoshtaExpanded: true }));
      }
    }
  }, [isExpanded, formData.method, formData.novaPoshtaExpanded, formData.ukrPoshtaExpanded]);

  const checkIsCompleted = () => {
    if (formData.method === 'pickup') return true;
    if (formData.method === 'nova_poshta') {
      const completed = formData.novaPoshtaDeliveryType === "PostOffice"
        ? formData.novaPoshtaPostOfficeCompleted
        : formData.novaPoshtaPostomatCompleted;
      return completed || false;
    }
    if (formData.method === 'ukr_poshta') {
      return formData.ukrPoshtaCompleted || false;
    }
    return false;
  };

  const handleSave = () => {
    if (!checkIsCompleted()) return;

    let delivery: DeliveryInfo = {
      method: formData.method,
    };

    if (formData.method === 'nova_poshta') {
      delivery.city = formData.novaPoshtaCity || '';
      delivery.cityRef = formData.novaPoshtaCityRef || null;
      delivery.warehouse = formData.novaPoshtaDeliveryType === 'PostOffice'
        ? formData.novaPoshtaPostOfficeWarehouse || ''
        : formData.novaPoshtaPostomatWarehouse || '';
      delivery.warehouseRef = formData.novaPoshtaDeliveryType === 'PostOffice'
        ? formData.novaPoshtaPostOfficeWarehouseRef || null
        : formData.novaPoshtaPostomatWarehouseRef || null;
    } else if (formData.method === 'ukr_poshta') {
      delivery.method = 'ukrposhta'; // Конвертируем в формат базы данных (без подчеркивания)
      delivery.city = formData.ukrPoshtaCity || '';
      // Для Укрпошта конвертируем ID в строку (база данных хранит как varchar(36))
      delivery.cityRef = formData.ukrPoshtaCityId ? String(formData.ukrPoshtaCityId) : null;
      delivery.warehouse = formData.ukrPoshtaBranch || '';
      delivery.warehouseRef = formData.ukrPoshtaBranchId ? String(formData.ukrPoshtaBranchId) : null;
      delivery.postIndex = formData.ukrPoshtaPostalCode || '';
      delivery.address = formData.ukrPoshtaAddress || '';
    }

    onSave(delivery);
    // Закрываем блок доставки после сохранения
    if (mode === 'view') {
      setIsExpanded(false);
    }
    // Сворачиваем подформу доставки
    if (formData.method === 'nova_poshta') {
      setFormData(prev => ({ ...prev, novaPoshtaExpanded: false }));
    } else if (formData.method === 'ukr_poshta') {
      setFormData(prev => ({ ...prev, ukrPoshtaExpanded: false }));
    }
  };

  const handleCancel = () => {
    // Восстанавливаем исходные данные
    const dbMethod = initialDelivery.method as 'nova_poshta' | 'ukrposhta' | 'pickup';
    const method = dbMethod === 'ukrposhta' ? 'ukr_poshta' : dbMethod;
    if (method === 'nova_poshta') {
      setFormData({
        method,
        novaPoshtaCity: initialDelivery.city || '',
        novaPoshtaCityRef: null,
        novaPoshtaPostOfficeWarehouse: initialDelivery.warehouse || '',
        novaPoshtaPostOfficeWarehouseRef: null,
        novaPoshtaPostOfficeCompleted: false,
        novaPoshtaPostomatWarehouse: '',
        novaPoshtaPostomatWarehouseRef: null,
        novaPoshtaPostomatCompleted: false,
        novaPoshtaDeliveryType: 'PostOffice',
        novaPoshtaExpanded: false,
      });
    } else if (method === 'ukr_poshta') {
      setFormData({
        method,
        ukrPoshtaCity: initialDelivery.city || '',
        ukrPoshtaCityId: null,
        ukrPoshtaCityRegion: '',
        ukrPoshtaBranch: initialDelivery.warehouse || '',
        ukrPoshtaBranchId: null,
        ukrPoshtaPostalCode: initialDelivery.postIndex || '',
        ukrPoshtaAddress: initialDelivery.address || '',
        ukrPoshtaCompleted: false,
        ukrPoshtaExpanded: false,
      });
    } else {
      setFormData({ method });
    }
    setFormData(prev => ({
      ...prev,
      novaPoshtaExpanded: false,
      ukrPoshtaExpanded: false
    }));
    
    if (mode === 'view') {
      setIsExpanded(false);
    }
    onCancel?.();
  };

  if (mode === 'view' && !isExpanded) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium flex items-center gap-2">
            {initialDelivery.method === 'nova_poshta' && <NovaPoshtaLogo className="w-5 h-5" />}
            {initialDelivery.method === 'ukrposhta' && <UkrposhtaLogo className="w-5 h-5" />}
            {initialDelivery.method === 'pickup' && <PickupLogo className="w-5 h-5" />}
            {initialDelivery.method === 'nova_poshta' && deliveryNovaPoshtaTitle}
            {initialDelivery.method === 'ukrposhta' && deliveryUkrposhtaTitle}
            {initialDelivery.method === 'pickup' && deliveryPickupTitle}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-muted-foreground hover:text-primary"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        {initialDelivery.city && (
          <div className="text-sm">м. {initialDelivery.city}</div>
        )}
        {initialDelivery.warehouse && (
          <div className="text-sm">{initialDelivery.warehouse}</div>
        )}
        {initialDelivery.address && (
          <div className="text-sm">{initialDelivery.address}</div>
        )}
        {initialDelivery.postIndex && (
          <div className="text-sm">Індекс: {initialDelivery.postIndex}</div>
        )}
        {initialDelivery.method === 'pickup' && (
          <div className="text-sm">{storeSettings.store_address || 'м. Київ, вул. Урлівська 30'}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        value={formData.method}
        onValueChange={(value) => {
          setFormData(prev => {
            // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
            if (prev.method === value && value === "nova_poshta" && prev.novaPoshtaExpanded === false) {
              return { ...prev, novaPoshtaExpanded: true };
            }
            if (prev.method === value && value === "ukr_poshta" && prev.ukrPoshtaExpanded === false) {
              return { ...prev, ukrPoshtaExpanded: true };
            }
            // Если выбираем самовывоз
            if (value === "pickup") {
              return { 
                ...prev, 
                method: value as 'pickup',
                novaPoshtaExpanded: undefined,
                ukrPoshtaExpanded: undefined
              };
            }
            // Иначе просто переключаем способ доставки
            return { 
              ...prev, 
              method: value as 'nova_poshta' | 'ukr_poshta' | 'pickup',
              novaPoshtaExpanded: value === "nova_poshta" ? true : undefined,
              ukrPoshtaExpanded: value === "ukr_poshta" ? true : undefined,
              ...(value === "nova_poshta" ? { novaPoshtaDeliveryType: prev.novaPoshtaDeliveryType || 'PostOffice' } : {})
            };
          });
        }}
        className="space-y-3"
      >
        {/* Нова Пошта */}
        <div 
          className="border rounded-xl transition-all"
          onClick={(e) => {
            // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
            if (formData.method === "nova_poshta" && formData.novaPoshtaExpanded === false) {
              e.stopPropagation();
              setFormData(prev => ({ ...prev, novaPoshtaExpanded: true }));
            }
          }}
        >
          <label className="flex flex-col gap-2 p-4 cursor-pointer hover:border-primary transition-colors">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="nova_poshta" id="nova_poshta" />
              <div className="font-medium flex items-center gap-2 flex-1">
                <NovaPoshtaLogo className="w-5 h-5" />
                {deliveryNovaPoshtaTitle}
              </div>
              <div className="text-sm font-medium">
                {orderTotal >= FREE_DELIVERY_THRESHOLD ? (
                  <span className="text-green-600">Безкоштовно</span>
                ) : (
                  "від 60 ₴"
                )}
              </div>
            </div>
            <div className="ml-[28px]">
              {(() => {
                const savedData = getSavedDeliveryData("nova_poshta");
                const isCollapsed = formData.method === "nova_poshta" && formData.novaPoshtaExpanded === false;
                const showCollapsed = isCollapsed && savedData?.completed && savedData.city && savedData.warehouse;
                const showSavedWhenNotSelected = formData.method !== "nova_poshta" && savedData?.completed && savedData.city && savedData.warehouse;
                
                if (showCollapsed || showSavedWhenNotSelected) {
                  return (
                    <div className="space-y-1 text-sm">
                      <div className="text-foreground">{savedData.city}</div>
                      <div className="text-foreground">{savedData.warehouse}</div>
                    </div>
                  );
                }
                return <div className="text-sm text-muted-foreground">{deliveryNovaPoshtaDescription}</div>;
              })()}
            </div>
          </label>
          {formData.method === "nova_poshta" && formData.novaPoshtaExpanded !== false && (
            <div className="pl-4 pr-4 pb-4">
              <NovaPoshtaDelivery
                cityRef={formData.novaPoshtaCityRef}
                warehouseRef={formData.novaPoshtaDeliveryType === "PostOffice" 
                  ? formData.novaPoshtaPostOfficeWarehouseRef 
                  : formData.novaPoshtaPostomatWarehouseRef}
                deliveryType={formData.novaPoshtaDeliveryType || 'PostOffice'}
                isExpanded={true}
                onCityChange={(city) => {
                  setFormData(prev => ({
                    ...prev,
                    novaPoshtaCity: city ? city.full_description_ua : "",
                    novaPoshtaCityRef: city ? city.ref : null,
                    // Сбрасываем оба типа при смене города
                    novaPoshtaPostOfficeWarehouse: "",
                    novaPoshtaPostOfficeWarehouseRef: null,
                    novaPoshtaPostOfficeCompleted: false,
                    novaPoshtaPostomatWarehouse: "",
                    novaPoshtaPostomatWarehouseRef: null,
                    novaPoshtaPostomatCompleted: false
                  }));
                }}
                onWarehouseChange={(warehouse) => {
                  setFormData(prev => {
                    if (prev.novaPoshtaDeliveryType === "PostOffice") {
                      return {
                        ...prev,
                        novaPoshtaPostOfficeWarehouse: warehouse ? warehouse.description_ua : "",
                        novaPoshtaPostOfficeWarehouseRef: warehouse ? warehouse.ref : null,
                        novaPoshtaPostOfficeCompleted: !!warehouse
                      };
                    } else {
                      return {
                        ...prev,
                        novaPoshtaPostomatWarehouse: warehouse ? warehouse.description_ua : "",
                        novaPoshtaPostomatWarehouseRef: warehouse ? warehouse.ref : null,
                        novaPoshtaPostomatCompleted: !!warehouse
                      };
                    }
                  });
                }}
                onDeliveryTypeChange={(type) => {
                  setFormData(prev => {
                    // При переключении типа проверяем, выбрано ли соответствующее отделение/почтомат
                    if (type === "PostOffice") {
                      return {
                        ...prev,
                        novaPoshtaDeliveryType: type,
                        novaPoshtaPostOfficeCompleted: !!prev.novaPoshtaPostOfficeWarehouseRef
                      };
                    } else {
                      return {
                        ...prev,
                        novaPoshtaDeliveryType: type,
                        novaPoshtaPostomatCompleted: !!prev.novaPoshtaPostomatWarehouseRef
                      };
                    }
                  });
                }}
                onContinue={() => {
                  setFormData(prev => ({
                    ...prev,
                    novaPoshtaExpanded: false,
                    ...(prev.novaPoshtaDeliveryType === "PostOffice" 
                      ? { novaPoshtaPostOfficeCompleted: true }
                      : { novaPoshtaPostomatCompleted: true })
                  }));
                  // Сохраняем данные при нажатии на Продовжити
                  handleSave();
                }}
              />
            </div>
          )}
        </div>

        {/* Укрпошта */}
        <div 
          className="border rounded-xl transition-all"
          onClick={(e) => {
            // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
            if (formData.method === "ukr_poshta" && formData.ukrPoshtaExpanded === false) {
              e.stopPropagation();
              setFormData(prev => ({ ...prev, ukrPoshtaExpanded: true }));
            }
          }}
        >
          <label className="flex flex-col gap-2 p-4 cursor-pointer hover:border-primary transition-colors w-full">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="ukr_poshta" id="ukr_poshta" />
              <div className="font-medium flex items-center gap-2 flex-1">
                <UkrposhtaLogo className="w-5 h-5" />
                {deliveryUkrposhtaTitle}
              </div>
              <div className="text-sm font-medium">
                {orderTotal >= FREE_DELIVERY_THRESHOLD ? (
                  <span className="text-green-600">Безкоштовно</span>
                ) : (
                  "від 45 грн"
                )}
              </div>
            </div>
            <div className="ml-[28px] w-full">
              {(() => {
                const savedData = getSavedDeliveryData("ukr_poshta");
                const isCollapsed = formData.method === "ukr_poshta" && formData.ukrPoshtaExpanded === false;
                const showCollapsed = isCollapsed && savedData?.completed && savedData.city;
                const showSavedWhenNotSelected = formData.method !== "ukr_poshta" && savedData?.completed && savedData.city;
                
                if (showCollapsed || showSavedWhenNotSelected) {
                  // ВАЖНО: savedData.city уже содержит полное название "Город (Область)"
                  const cityDisplayName = savedData.city || 
                    (savedData.cityRegion ? `${savedData.city} (${savedData.cityRegion})` : savedData.city);
                  
                  // Формируем полный адрес отделения: {postalCode} {city}, {address}
                  const cityNameOnly = savedData.cityRegion 
                    ? savedData.city.replace(` (${savedData.cityRegion})`, '')
                    : savedData.city;
                  const fullAddress = savedData.postalCode && savedData.address
                    ? `${savedData.postalCode} ${cityNameOnly}, ${savedData.address}`
                    : savedData.branch || '';
                  
                  return (
                    <div className="space-y-1 text-sm">
                      <div className="text-foreground">{cityDisplayName}</div>
                      {fullAddress && (
                        <div className="text-foreground">{fullAddress}</div>
                      )}
                    </div>
                  );
                }
                return <div className="text-sm text-muted-foreground">{deliveryUkrposhtaDescription}</div>;
              })()}
            </div>
          </label>
          {formData.method === "ukr_poshta" && formData.ukrPoshtaExpanded !== false && (
            <div className="pl-4 pr-4 pb-4">
              <UkrPoshtaDelivery
                cityId={formData.ukrPoshtaCityId}
                branchId={formData.ukrPoshtaBranchId}
                savedCityName={formData.ukrPoshtaCity}
                savedCityRegion={formData.ukrPoshtaCityRegion}
                savedBranchName={formData.ukrPoshtaBranch}
                savedBranchAddress={formData.ukrPoshtaAddress}
                savedBranchPostalCode={formData.ukrPoshtaPostalCode}
                isExpanded={true}
                onCityChange={(city) => {
                  // ВАЖНО: Сохраняем полное название города с областью в формате "Город (Область)" или "Город (*)"
                  const cityFullName = city 
                    ? (city.region && city.region.trim() !== '' 
                        ? `${city.name} (${city.region})`
                        : `${city.name} (*)`)
                    : "";
                  
                  setFormData(prev => ({
                    ...prev,
                    ukrPoshtaCity: cityFullName, // Сохраняем полное название "Город (Область)" или "Город (*)"
                    ukrPoshtaCityId: city ? city.id : null,
                    ukrPoshtaCityRegion: city ? (city.region || "") : "", // Сохраняем область отдельно для удобства
                    // Сбрасываем отделение при смене города (как у Новой Почты)
                    ukrPoshtaBranch: "",
                    ukrPoshtaBranchId: null,
                    ukrPoshtaPostalCode: "",
                    ukrPoshtaAddress: "",
                    ukrPoshtaCompleted: false
                  }));
                }}
                onBranchChange={(branch) => {
                  setFormData(prev => ({
                    ...prev,
                    ukrPoshtaBranch: branch ? branch.name : "",
                    ukrPoshtaBranchId: branch ? branch.id : null,
                    ukrPoshtaPostalCode: branch ? branch.postalCode : "",
                    ukrPoshtaAddress: branch ? branch.address : "",
                    ukrPoshtaCompleted: !!branch
                  }));
                }}
                onContinue={() => {
                  setFormData(prev => ({
                    ...prev,
                    ukrPoshtaExpanded: false,
                    ukrPoshtaCompleted: true
                  }));
                  // Сохраняем данные при нажатии на Продовжити
                  handleSave();
                }}
              />
            </div>
          )}
        </div>

        {/* Самовивіз */}
        <div className="border rounded-xl transition-all">
          <label className="flex flex-col gap-2 p-4 cursor-pointer hover:border-primary transition-colors">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="pickup" id="pickup" />
              <div className="font-medium flex items-center gap-2 flex-1">
                <PickupLogo className="w-5 h-5" />
                {deliveryPickupTitle}
              </div>
              <div className="text-sm font-medium">
                <span className="text-green-600">Безкоштовно</span>
              </div>
            </div>
            <div className="ml-[28px]">
              <div className="text-sm text-muted-foreground">{storeSettings.store_address || 'м. Київ, вул. Урлівська 30'}</div>
            </div>
          </label>
        </div>
      </RadioGroup>
    </div>
  );
};
