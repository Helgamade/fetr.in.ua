import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Pencil } from "lucide-react";
import { NovaPoshtaDelivery } from "@/components/NovaPoshtaDelivery";
import { UkrPoshtaDelivery } from "@/components/UkrPoshtaDelivery";
import { NovaPoshtaLogo, UkrposhtaLogo, PickupLogo } from "@/components/DeliveryLogos";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { useTexts, SiteText } from "@/hooks/useTexts";
import type { DeliveryInfo } from "@/types/store";
import type { NovaPoshtaCity, NovaPoshtaWarehouse, UkrposhtaCity, UkrposhtaBranch } from "@/lib/api";

interface DeliveryFormProps {
  delivery: DeliveryInfo;
  onSave: (delivery: DeliveryInfo) => void;
  onCancel?: () => void;
  mode?: 'edit' | 'view';
  defaultExpanded?: boolean;
  orderTotal?: number; // Для расчета бесплатной доставки
}

interface DeliveryFormData {
  method: 'nova_poshta' | 'ukrposhta' | 'pickup';
  // Нова Пошта
  novaPoshtaCity?: string;
  novaPoshtaCityRef?: string | null;
  novaPoshtaPostOfficeWarehouse?: string;
  novaPoshtaPostOfficeWarehouseRef?: string | null;
  novaPoshtaPostomatWarehouse?: string;
  novaPoshtaPostomatWarehouseRef?: string | null;
  novaPoshtaDeliveryType?: 'PostOffice' | 'Postomat';
  // Укрпошта
  ukrPoshtaCity?: string;
  ukrPoshtaCityId?: string | null;
  ukrPoshtaCityRegion?: string;
  ukrPoshtaBranch?: string;
  ukrPoshtaBranchId?: string | null;
  ukrPoshtaPostalCode?: string;
  ukrPoshtaAddress?: string;
}

export const DeliveryForm = ({
  delivery: initialDelivery,
  onSave,
  onCancel,
  mode = 'view',
  defaultExpanded = false,
  orderTotal = 0,
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
    const method = initialDelivery.method as 'nova_poshta' | 'ukrposhta' | 'pickup';
    
    if (method === 'nova_poshta') {
      // Пытаемся извлечь ref из city и warehouse
      // В реальности эти данные должны храниться отдельно, но для совместимости парсим
      return {
        method,
        novaPoshtaCity: initialDelivery.city || '',
        novaPoshtaCityRef: null, // Нужно будет загрузить через API
        novaPoshtaPostOfficeWarehouse: initialDelivery.warehouse || '',
        novaPoshtaPostOfficeWarehouseRef: null,
        novaPoshtaDeliveryType: 'PostOffice',
      };
    } else if (method === 'ukrposhta') {
      return {
        method,
        ukrPoshtaCity: initialDelivery.city || '',
        ukrPoshtaCityId: null,
        ukrPoshtaCityRegion: '',
        ukrPoshtaBranch: initialDelivery.warehouse || '',
        ukrPoshtaBranchId: null,
        ukrPoshtaPostalCode: initialDelivery.postIndex || '',
        ukrPoshtaAddress: initialDelivery.address || '',
      };
    }
    
    return { method };
  });

  const [novaPoshtaExpanded, setNovaPoshtaExpanded] = useState<boolean | undefined>(false);
  const [ukrPoshtaExpanded, setUkrPoshtaExpanded] = useState<boolean | undefined>(false);

  // При открытии формы редактирования автоматически открываем соответствующую форму доставки
  useEffect(() => {
    if (isExpanded) {
      if (formData.method === 'nova_poshta' && novaPoshtaExpanded === false) {
        setNovaPoshtaExpanded(true);
      } else if (formData.method === 'ukrposhta' && ukrPoshtaExpanded === false) {
        setUkrPoshtaExpanded(true);
      }
    }
  }, [isExpanded, formData.method]);

  const isCompleted = () => {
    if (formData.method === 'pickup') return true;
    if (formData.method === 'nova_poshta') {
      return !!(formData.novaPoshtaCityRef && (
        formData.novaPoshtaDeliveryType === 'PostOffice' 
          ? formData.novaPoshtaPostOfficeWarehouseRef 
          : formData.novaPoshtaPostomatWarehouseRef
      ));
    }
    if (formData.method === 'ukrposhta') {
      return !!(formData.ukrPoshtaCityId && formData.ukrPoshtaBranchId);
    }
    return false;
  };

  const handleSave = () => {
    if (!isCompleted()) return;

    let delivery: DeliveryInfo = {
      method: formData.method,
    };

    if (formData.method === 'nova_poshta') {
      delivery.city = formData.novaPoshtaCity || '';
      delivery.warehouse = formData.novaPoshtaDeliveryType === 'PostOffice'
        ? formData.novaPoshtaPostOfficeWarehouse || ''
        : formData.novaPoshtaPostomatWarehouse || '';
    } else if (formData.method === 'ukrposhta') {
      delivery.city = formData.ukrPoshtaCity || '';
      delivery.warehouse = formData.ukrPoshtaBranch || '';
      delivery.postIndex = formData.ukrPoshtaPostalCode || '';
      delivery.address = formData.ukrPoshtaAddress || '';
    }

    onSave(delivery);
    if (mode === 'view') {
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    // Восстанавливаем исходные данные
    const method = initialDelivery.method as 'nova_poshta' | 'ukrposhta' | 'pickup';
    if (method === 'nova_poshta') {
      setFormData({
        method,
        novaPoshtaCity: initialDelivery.city || '',
        novaPoshtaCityRef: null,
        novaPoshtaPostOfficeWarehouse: initialDelivery.warehouse || '',
        novaPoshtaPostOfficeWarehouseRef: null,
        novaPoshtaDeliveryType: 'PostOffice',
      });
    } else if (method === 'ukrposhta') {
      setFormData({
        method,
        ukrPoshtaCity: initialDelivery.city || '',
        ukrPoshtaCityId: null,
        ukrPoshtaCityRegion: '',
        ukrPoshtaBranch: initialDelivery.warehouse || '',
        ukrPoshtaBranchId: null,
        ukrPoshtaPostalCode: initialDelivery.postIndex || '',
        ukrPoshtaAddress: initialDelivery.address || '',
      });
    } else {
      setFormData({ method });
    }
    setNovaPoshtaExpanded(false);
    setUkrPoshtaExpanded(false);
    
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
          const method = value as 'nova_poshta' | 'ukrposhta' | 'pickup';
          // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
          if (formData.method === method && method === "nova_poshta" && novaPoshtaExpanded === false) {
            setNovaPoshtaExpanded(true);
            return;
          }
          if (formData.method === method && method === "ukrposhta" && ukrPoshtaExpanded === false) {
            setUkrPoshtaExpanded(true);
            return;
          }
          
          if (method === 'pickup') {
            setFormData({ method });
            setNovaPoshtaExpanded(undefined);
            setUkrPoshtaExpanded(undefined);
          } else if (method === 'nova_poshta') {
            setFormData(prev => ({
              ...prev,
              method,
              novaPoshtaDeliveryType: prev.novaPoshtaDeliveryType || 'PostOffice',
            }));
            setNovaPoshtaExpanded(true);
            setUkrPoshtaExpanded(undefined);
          } else if (method === 'ukrposhta') {
            setFormData(prev => ({ ...prev, method }));
            setNovaPoshtaExpanded(undefined);
            setUkrPoshtaExpanded(true);
          }
        }}
        className="space-y-3"
      >
        {/* Нова Пошта */}
        <div 
          className="border rounded-xl transition-all"
          onClick={(e) => {
            // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
            if (formData.method === "nova_poshta" && novaPoshtaExpanded === false) {
              e.stopPropagation();
              setNovaPoshtaExpanded(true);
            }
          }}
        >
          <label 
            className="flex flex-col gap-2 p-4 cursor-pointer hover:border-primary transition-colors"
            onClick={(e) => {
              // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
              if (formData.method === "nova_poshta" && novaPoshtaExpanded === false) {
                e.stopPropagation();
                setNovaPoshtaExpanded(true);
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div
                onClick={(e) => {
                  // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
                  if (formData.method === "nova_poshta" && novaPoshtaExpanded === false) {
                    e.stopPropagation();
                    setNovaPoshtaExpanded(true);
                  }
                }}
              >
                <RadioGroupItem value="nova_poshta" id="nova_poshta" />
              </div>
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
            <div 
              className="ml-[28px]"
              onClick={(e) => {
                // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
                if (formData.method === "nova_poshta" && novaPoshtaExpanded === false) {
                  e.stopPropagation();
                  setNovaPoshtaExpanded(true);
                }
              }}
            >
              {formData.method === 'nova_poshta' && formData.novaPoshtaCity ? (
                <div className="space-y-1 text-sm">
                  <div className="text-foreground">{formData.novaPoshtaCity}</div>
                  <div className="text-foreground">
                    {formData.novaPoshtaDeliveryType === 'PostOffice'
                      ? formData.novaPoshtaPostOfficeWarehouse
                      : formData.novaPoshtaPostomatWarehouse}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{deliveryNovaPoshtaDescription}</div>
              )}
            </div>
          </label>
          {formData.method === "nova_poshta" && novaPoshtaExpanded !== false && (
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
                    novaPoshtaPostOfficeWarehouse: "",
                    novaPoshtaPostOfficeWarehouseRef: null,
                    novaPoshtaPostomatWarehouse: "",
                    novaPoshtaPostomatWarehouseRef: null,
                  }));
                }}
                onWarehouseChange={(warehouse) => {
                  setFormData(prev => {
                    if (prev.novaPoshtaDeliveryType === "PostOffice") {
                      return {
                        ...prev,
                        novaPoshtaPostOfficeWarehouse: warehouse ? warehouse.description_ua : "",
                        novaPoshtaPostOfficeWarehouseRef: warehouse ? warehouse.ref : null,
                      };
                    } else {
                      return {
                        ...prev,
                        novaPoshtaPostomatWarehouse: warehouse ? warehouse.description_ua : "",
                        novaPoshtaPostomatWarehouseRef: warehouse ? warehouse.ref : null,
                      };
                    }
                  });
                }}
                onDeliveryTypeChange={(type) => {
                  setFormData(prev => ({ ...prev, novaPoshtaDeliveryType: type }));
                }}
                onContinue={() => {
                  setNovaPoshtaExpanded(false);
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
            if (formData.method === "ukrposhta" && ukrPoshtaExpanded === false) {
              e.stopPropagation();
              setUkrPoshtaExpanded(true);
            }
          }}
        >
          <label 
            className="flex flex-col gap-2 p-4 cursor-pointer hover:border-primary transition-colors w-full"
            onClick={(e) => {
              // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
              if (formData.method === "ukrposhta" && ukrPoshtaExpanded === false) {
                e.stopPropagation();
                setUkrPoshtaExpanded(true);
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div
                onClick={(e) => {
                  // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
                  if (formData.method === "ukrposhta" && ukrPoshtaExpanded === false) {
                    e.stopPropagation();
                    setUkrPoshtaExpanded(true);
                  }
                }}
              >
                <RadioGroupItem value="ukrposhta" id="ukrposhta" />
              </div>
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
            <div 
              className="ml-[28px] w-full"
              onClick={(e) => {
                // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
                if (formData.method === "ukrposhta" && ukrPoshtaExpanded === false) {
                  e.stopPropagation();
                  setUkrPoshtaExpanded(true);
                }
              }}
            >
              {formData.method === 'ukrposhta' && formData.ukrPoshtaCity ? (
                <div className="space-y-1 text-sm">
                  <div className="text-foreground">{formData.ukrPoshtaCity}</div>
                  {formData.ukrPoshtaBranch && (
                    <div className="text-foreground">{formData.ukrPoshtaBranch}</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{deliveryUkrposhtaDescription}</div>
              )}
            </div>
          </label>
          {formData.method === "ukrposhta" && ukrPoshtaExpanded !== false && (
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
                  const cityFullName = city 
                    ? (city.region && city.region.trim() !== '' 
                        ? `${city.name} (${city.region})`
                        : `${city.name} (*)`)
                    : "";
                  
                  setFormData(prev => ({
                    ...prev,
                    ukrPoshtaCity: cityFullName,
                    ukrPoshtaCityId: city ? city.id : null,
                    ukrPoshtaCityRegion: city ? (city.region || "") : "",
                    ukrPoshtaBranch: "",
                    ukrPoshtaBranchId: null,
                    ukrPoshtaPostalCode: "",
                    ukrPoshtaAddress: "",
                  }));
                }}
                onBranchChange={(branch) => {
                  setFormData(prev => ({
                    ...prev,
                    ukrPoshtaBranch: branch ? branch.name : "",
                    ukrPoshtaBranchId: branch ? branch.id : null,
                    ukrPoshtaPostalCode: branch ? branch.postalCode : "",
                    ukrPoshtaAddress: branch ? branch.address : "",
                  }));
                }}
                onContinue={() => {
                  setUkrPoshtaExpanded(false);
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

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!isCompleted()}
          onClick={handleSave}
          className="flex-1 rounded-xl"
        >
          Зберегти
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            className="flex-1 rounded-xl"
          >
            Скасувати
          </Button>
        )}
      </div>
    </div>
  );
};
