import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { ordersAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Package, CreditCard, Truck, MapPin, Phone, Mail, User } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "@/hooks/use-toast";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { NovaPoshtaDelivery } from "@/components/NovaPoshtaDelivery";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/lib/api";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, getDiscount, getDeliveryCost, getTotal, clearCart } = useCart();
  const { data: products = [] } = useProducts();
  const { data: storeSettings = {} } = usePublicSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('checkoutFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          phone: parsed.phone || prev.phone,
          email: parsed.email || prev.email,
          paymentMethod: parsed.paymentMethod || prev.paymentMethod,
          deliveryMethod: parsed.deliveryMethod || prev.deliveryMethod,
          novaPoshtaCity: parsed.novaPoshtaCity || prev.novaPoshtaCity,
          novaPoshtaCityRef: parsed.novaPoshtaCityRef || prev.novaPoshtaCityRef,
          novaPoshtaPostOfficeWarehouse: parsed.novaPoshtaPostOfficeWarehouse || prev.novaPoshtaPostOfficeWarehouse,
          novaPoshtaPostOfficeWarehouseRef: parsed.novaPoshtaPostOfficeWarehouseRef || prev.novaPoshtaPostOfficeWarehouseRef,
          novaPoshtaPostOfficeCompleted: parsed.novaPoshtaPostOfficeCompleted || false,
          novaPoshtaPostomatWarehouse: parsed.novaPoshtaPostomatWarehouse || prev.novaPoshtaPostomatWarehouse,
          novaPoshtaPostomatWarehouseRef: parsed.novaPoshtaPostomatWarehouseRef || prev.novaPoshtaPostomatWarehouseRef,
          novaPoshtaPostomatCompleted: parsed.novaPoshtaPostomatCompleted || false,
          novaPoshtaDeliveryType: parsed.novaPoshtaDeliveryType || prev.novaPoshtaDeliveryType,
          novaPoshtaExpanded: false, // Всегда свернуто при загрузке
          ukrPoshtaCity: parsed.ukrPoshtaCity || prev.ukrPoshtaCity,
          ukrPoshtaPostalCode: parsed.ukrPoshtaPostalCode || prev.ukrPoshtaPostalCode,
          ukrPoshtaAddress: parsed.ukrPoshtaAddress || prev.ukrPoshtaAddress,
          ukrPoshtaExpanded: false, // Всегда свернуто при загрузке
          ukrPoshtaCompleted: parsed.ukrPoshtaCompleted || false,
          pickupExpanded: false, // Всегда свернуто при загрузке
          pickupCompleted: parsed.pickupCompleted || false,
        }));
      } catch (error) {
        console.error('Error loading checkout form data from localStorage:', error);
      }
    }
  }, []);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    paymentMethod: "card",
    deliveryMethod: "",
    // Данные для Нова Пошта - город общий, отделения/поштоматы отдельно
    novaPoshtaCity: "",
    novaPoshtaCityRef: null as string | null,
    novaPoshtaPostOfficeWarehouse: "",
    novaPoshtaPostOfficeWarehouseRef: null as string | null,
    novaPoshtaPostOfficeCompleted: false,
    novaPoshtaPostomatWarehouse: "",
    novaPoshtaPostomatWarehouseRef: null as string | null,
    novaPoshtaPostomatCompleted: false,
    novaPoshtaDeliveryType: "PostOffice" as "PostOffice" | "Postomat",
    novaPoshtaExpanded: false as boolean | undefined, // По умолчанию свернуто
    // Данные для Укрпошта
    ukrPoshtaCity: "",
    ukrPoshtaPostalCode: "",
    ukrPoshtaAddress: "",
    ukrPoshtaExpanded: false,
    ukrPoshtaCompleted: false,
    // Данные для Самовывоза
    pickupExpanded: false,
    pickupCompleted: false,
    comment: ""
  });

  // Save to localStorage whenever formData changes
  useEffect(() => {
    const dataToSave = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      paymentMethod: formData.paymentMethod,
      deliveryMethod: formData.deliveryMethod,
      novaPoshtaCity: formData.novaPoshtaCity,
      novaPoshtaCityRef: formData.novaPoshtaCityRef,
      novaPoshtaPostOfficeWarehouse: formData.novaPoshtaPostOfficeWarehouse,
      novaPoshtaPostOfficeWarehouseRef: formData.novaPoshtaPostOfficeWarehouseRef,
      novaPoshtaPostOfficeCompleted: formData.novaPoshtaPostOfficeCompleted,
      novaPoshtaPostomatWarehouse: formData.novaPoshtaPostomatWarehouse,
      novaPoshtaPostomatWarehouseRef: formData.novaPoshtaPostomatWarehouseRef,
      novaPoshtaPostomatCompleted: formData.novaPoshtaPostomatCompleted,
      novaPoshtaDeliveryType: formData.novaPoshtaDeliveryType,
      novaPoshtaExpanded: formData.novaPoshtaExpanded,
      ukrPoshtaCity: formData.ukrPoshtaCity,
      ukrPoshtaPostalCode: formData.ukrPoshtaPostalCode,
      ukrPoshtaAddress: formData.ukrPoshtaAddress,
      ukrPoshtaExpanded: formData.ukrPoshtaExpanded,
      ukrPoshtaCompleted: formData.ukrPoshtaCompleted,
      pickupExpanded: formData.pickupExpanded,
      pickupCompleted: formData.pickupCompleted,
      // Не сохраняем comment, так как он может быть специфичным для каждого заказа
    };
    localStorage.setItem('checkoutFormData', JSON.stringify(dataToSave));
  }, [formData]);

  // Получить текущие данные для выбранного способа доставки
  const getCurrentDeliveryData = () => {
    if (formData.deliveryMethod === "nova_poshta") {
      if (formData.novaPoshtaDeliveryType === "PostOffice") {
        return {
          city: formData.novaPoshtaCity,
          cityRef: formData.novaPoshtaCityRef,
          warehouse: formData.novaPoshtaPostOfficeWarehouse,
          warehouseRef: formData.novaPoshtaPostOfficeWarehouseRef,
          deliveryType: "PostOffice" as const,
          completed: formData.novaPoshtaPostOfficeCompleted,
        };
      } else {
        return {
          city: formData.novaPoshtaCity,
          cityRef: formData.novaPoshtaCityRef,
          warehouse: formData.novaPoshtaPostomatWarehouse,
          warehouseRef: formData.novaPoshtaPostomatWarehouseRef,
          deliveryType: "Postomat" as const,
          completed: formData.novaPoshtaPostomatCompleted,
        };
      }
    } else if (formData.deliveryMethod === "ukr_poshta") {
      return {
        city: formData.ukrPoshtaCity,
        postalCode: formData.ukrPoshtaPostalCode,
        address: formData.ukrPoshtaAddress,
        completed: formData.ukrPoshtaCompleted,
      };
    }
    return null;
  };

  // Получить сохраненные данные для способа доставки (даже если он не выбран)
  const getSavedDeliveryData = (method: string) => {
    if (method === "nova_poshta") {
      // Город общий, отделение/поштомат зависят от типа
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
    } else if (method === "ukr_poshta") {
      return {
        city: formData.ukrPoshtaCity,
        postalCode: formData.ukrPoshtaPostalCode,
        address: formData.ukrPoshtaAddress,
        completed: formData.ukrPoshtaCompleted,
      };
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.name || !formData.phone) {
      toast({
        title: "Помилка",
        description: "Будь ласка, заповніть контактні дані",
        variant: "destructive"
      });
      return;
    }

    if (formData.deliveryMethod !== "pickup") {
      const deliveryData = getCurrentDeliveryData();
      if (formData.deliveryMethod === "nova_poshta") {
        if (!deliveryData?.city || !deliveryData?.warehouseRef) {
          toast({
            title: "Помилка",
            description: "Будь ласка, виберіть місто та відділення доставки",
            variant: "destructive"
          });
          return;
        }
      } else if (formData.deliveryMethod === "ukr_poshta") {
        if (!deliveryData?.city || !deliveryData?.postalCode || !deliveryData?.address) {
          toast({
            title: "Помилка",
            description: "Будь ласка, заповніть адресу доставки",
            variant: "destructive"
          });
          return;
        }
      }
    }

    setIsSubmitting(true);
    
    try {
      // Calculate order totals
      const subtotal = getSubtotal();
      const discount = getDiscount();
      const deliveryCost = getDeliveryCost();
      const orderTotal = getTotal();
      
      // Add COD commission if needed
      const finalTotal = orderTotal + (formData.paymentMethod === "cod" ? 20 : 0);
      
      // Generate order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Prepare order data - convert undefined/empty strings to null for SQL
      const orderData = {
        id: orderId,
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email && formData.email.trim() ? formData.email.trim() : null,
        },
        delivery: (() => {
          const deliveryData = getCurrentDeliveryData();
          if (formData.deliveryMethod === "nova_poshta" && deliveryData) {
            return {
              method: formData.deliveryMethod,
              city: deliveryData.city || null,
              warehouse: deliveryData.warehouse || null,
              warehouseRef: deliveryData.warehouseRef || null,
              cityRef: deliveryData.cityRef || null,
              postIndex: null,
              address: null,
            };
          } else if (formData.deliveryMethod === "ukr_poshta" && deliveryData) {
            return {
              method: formData.deliveryMethod,
              city: deliveryData.city || null,
              warehouse: null,
              warehouseRef: null,
              cityRef: null,
              postIndex: deliveryData.postalCode || null,
              address: deliveryData.address || null,
            };
          } else {
            return {
              method: formData.deliveryMethod,
              city: null,
              warehouse: null,
              warehouseRef: null,
              cityRef: null,
              postIndex: null,
              address: null,
            };
          }
        })(),
        payment: {
          method: formData.paymentMethod,
        },
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions || [],
        })),
        subtotal: subtotal || 0,
        discount: discount || 0,
        deliveryCost: deliveryCost || 0,
        total: finalTotal || 0,
      };

      // Submit order to API
      const order = await ordersAPI.create(orderData);
      
      // Clear localStorage after successful order
      localStorage.removeItem('checkoutFormData');
      
      clearCart();
      navigate(`/thank-you?order=${order.id}`);
    } catch (error) {
      console.error('Order submission error:', error);
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося оформити замовлення. Спробуйте пізніше.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = getTotal();
  const deliveryPrice = total >= 1500 ? 0 : 70;
  const finalTotal = total + deliveryPrice;

  // Get full product data for cart items
  const cartItemsWithProducts = items.map(item => {
    const product = products.find(p => p.code === item.productId);
    return { ...item, product };
  }).filter(item => item.product);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Кошик порожній</h1>
          <p className="text-muted-foreground">Додайте товари для оформлення замовлення</p>
          <Button onClick={() => navigate("/")} className="rounded-full">
            Повернутися до покупок
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Оформлення замовлення | FetrInUA</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <header className="bg-background border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Оформлення замовлення</h1>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Info */}
                <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Контактні дані
                  </h2>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ім'я та прізвище *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Олена Петренко"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+380 XX XXX XX XX"
                          required
                          className="rounded-xl pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                        className="rounded-xl pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Доставка
                  </h2>
                  
                  <RadioGroup
                    value={formData.deliveryMethod}
                    onValueChange={(value) => {
                      setFormData(prev => {
                        // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
                        if (prev.deliveryMethod === value && value === "nova_poshta" && prev.novaPoshtaExpanded === false) {
                          return { ...prev, novaPoshtaExpanded: true };
                        }
                        // Иначе просто переключаем способ доставки
                        return { ...prev, deliveryMethod: value, novaPoshtaExpanded: value === "nova_poshta" ? true : undefined };
                      });
                    }}
                    className="space-y-3"
                  >
                    {/* Нова Пошта */}
                    <div 
                      className="border rounded-xl transition-all"
                      onClick={(e) => {
                        // Если кликаем на уже выбранный способ доставки и он свернут, раскрываем его
                        if (formData.deliveryMethod === "nova_poshta" && formData.novaPoshtaExpanded === false) {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, novaPoshtaExpanded: true }));
                        }
                      }}
                    >
                      <label className="flex items-center gap-3 p-4 cursor-pointer hover:border-primary transition-colors">
                        <RadioGroupItem value="nova_poshta" id="nova_poshta" />
                        <div className="flex-1">
                          <div className="font-medium">Нова Пошта</div>
                          {(() => {
                            const savedData = getSavedDeliveryData("nova_poshta");
                            const isCollapsed = formData.deliveryMethod === "nova_poshta" && formData.novaPoshtaExpanded === false;
                            const showCollapsed = isCollapsed && savedData?.completed && savedData.city && savedData.warehouse;
                            const showSavedWhenNotSelected = formData.deliveryMethod !== "nova_poshta" && savedData?.completed && savedData.city && savedData.warehouse;
                            
                            if (showCollapsed || showSavedWhenNotSelected) {
                              return (
                                <div className="space-y-1 text-sm mt-1">
                                  <div className="text-foreground">{savedData.city}</div>
                                  <div className="text-foreground">{savedData.warehouse}</div>
                                </div>
                              );
                            }
                            return <div className="text-sm text-muted-foreground">1-2 дні по Україні</div>;
                          })()}
                        </div>
                        <div className="text-sm font-medium">
                          {total >= 1500 ? <span className="text-green-600">Безкоштовно</span> : "від 70 грн"}
                        </div>
                      </label>
                      {formData.deliveryMethod === "nova_poshta" && formData.novaPoshtaExpanded !== false && (
                        <div className="pl-4 pr-4 pb-4">
                          <NovaPoshtaDelivery
                            cityRef={formData.novaPoshtaCityRef}
                            warehouseRef={formData.novaPoshtaDeliveryType === "PostOffice" 
                              ? formData.novaPoshtaPostOfficeWarehouseRef 
                              : formData.novaPoshtaPostomatWarehouseRef}
                            deliveryType={formData.novaPoshtaDeliveryType}
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
                                    novaPoshtaPostOfficeCompleted: false
                                  };
                                } else {
                                  return {
                                    ...prev,
                                    novaPoshtaPostomatWarehouse: warehouse ? warehouse.description_ua : "",
                                    novaPoshtaPostomatWarehouseRef: warehouse ? warehouse.ref : null,
                                    novaPoshtaPostomatCompleted: false
                                  };
                                }
                              });
                            }}
                            onDeliveryTypeChange={(type) => {
                              setFormData(prev => ({
                                ...prev,
                                novaPoshtaDeliveryType: type,
                                // Не сбрасываем данные при переключении типа, город остается общим
                              }));
                            }}
                            onContinue={() => {
                              setFormData(prev => ({
                                ...prev,
                                novaPoshtaExpanded: false,
                                ...(prev.novaPoshtaDeliveryType === "PostOffice" 
                                  ? { novaPoshtaPostOfficeCompleted: true }
                                  : { novaPoshtaPostomatCompleted: true })
                              }));
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
                        if (formData.deliveryMethod === "ukr_poshta" && formData.ukrPoshtaExpanded === false) {
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, ukrPoshtaExpanded: true }));
                        }
                      }}
                    >
                      <label className="flex items-center gap-3 p-4 cursor-pointer hover:border-primary transition-colors">
                        <RadioGroupItem value="ukr_poshta" id="ukr_poshta" />
                        <div className="flex-1">
                          <div className="font-medium">Укрпошта</div>
                          {(() => {
                            const savedData = getSavedDeliveryData("ukr_poshta");
                            const isCollapsed = formData.deliveryMethod === "ukr_poshta" && formData.ukrPoshtaExpanded === false;
                            const showCollapsed = isCollapsed && savedData?.completed && savedData.city;
                            const showSavedWhenNotSelected = formData.deliveryMethod !== "ukr_poshta" && savedData?.completed && savedData.city;
                            
                            if (showCollapsed || showSavedWhenNotSelected) {
                              return (
                                <div className="space-y-1 text-sm mt-1">
                                  <div className="text-foreground">{savedData.city}</div>
                                  {savedData.address && (
                                    <div className="text-foreground">{savedData.address}</div>
                                  )}
                                </div>
                              );
                            }
                            return <div className="text-sm text-muted-foreground">3-5 днів по Україні</div>;
                          })()}
                        </div>
                        <div className="text-sm font-medium">від 45 грн</div>
                      </label>
                      {formData.deliveryMethod === "ukr_poshta" && formData.ukrPoshtaExpanded !== false && (
                        <div className="pl-4 pr-4 pb-4 space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="ukrPoshtaCity">Місто *</Label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="ukrPoshtaCity"
                                  name="ukrPoshtaCity"
                                  value={formData.ukrPoshtaCity}
                                  onChange={(e) => {
                                    setFormData(prev => ({ ...prev, ukrPoshtaCity: e.target.value, ukrPoshtaCompleted: false, ukrPoshtaExpanded: true }));
                                  }}
                                  placeholder="Введіть місто"
                                  required
                                  className="rounded-xl pl-10"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ukrPoshtaPostalCode">Індекс *</Label>
                              <Input
                                id="ukrPoshtaPostalCode"
                                name="ukrPoshtaPostalCode"
                                value={formData.ukrPoshtaPostalCode}
                                onChange={(e) => {
                                  setFormData(prev => ({ ...prev, ukrPoshtaPostalCode: e.target.value, ukrPoshtaCompleted: false, ukrPoshtaExpanded: true }));
                                }}
                                placeholder="01001"
                                required
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <Label htmlFor="ukrPoshtaAddress">Адреса *</Label>
                              <Input
                                id="ukrPoshtaAddress"
                                name="ukrPoshtaAddress"
                                value={formData.ukrPoshtaAddress}
                                onChange={(e) => {
                                  setFormData(prev => ({ ...prev, ukrPoshtaAddress: e.target.value, ukrPoshtaCompleted: false, ukrPoshtaExpanded: true }));
                                }}
                                placeholder="Вулиця, будинок, квартира"
                                required
                                className="rounded-xl"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                ukrPoshtaExpanded: false,
                                ukrPoshtaCompleted: true
                              }));
                            }}
                            disabled={!formData.ukrPoshtaCity || !formData.ukrPoshtaPostalCode || !formData.ukrPoshtaAddress}
                            variant="outline"
                            className="w-full rounded-full border-2"
                          >
                            Продовжити
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Самовивіз */}
                    <div className="border rounded-xl transition-all">
                      <label className="flex items-center gap-3 p-4 cursor-pointer hover:border-primary transition-colors">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <div className="flex-1">
                          <div className="font-medium">Самовивіз</div>
                          <div className="text-sm text-muted-foreground">{storeSettings.store_address || 'м. Київ, вул. Урлівська 30'}</div>
                        </div>
                        <div className="text-sm font-medium text-green-600">Безкоштовно</div>
                      </label>
                      {formData.deliveryMethod === "pickup" && (
                        <div className="pl-4 pr-4 pb-4">
                          <div className="font-medium mb-1">Адреса самовивозу:</div>
                          <div className="text-muted-foreground">{storeSettings.store_address || 'м. Київ, вул. Урлівська 30'}</div>
                          {storeSettings.store_working_hours_weekdays && (
                            <div className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                              {storeSettings.store_working_hours_weekdays}
                            </div>
                          )}
                          {storeSettings.store_working_hours_weekend && (
                            <div className="text-sm text-muted-foreground/60 mt-1 whitespace-pre-line">
                              {storeSettings.store_working_hours_weekend}
                            </div>
                          )}
                          <Button
                            type="button"
                            onClick={() => {
                              // Для самовывоза ничего не сохраняем, просто свертываем
                              // Можно добавить флаг, если понадобится
                            }}
                            variant="outline"
                            className="w-full rounded-full border-2 mt-4"
                          >
                            Продовжити
                          </Button>
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                </div>

                {/* Payment */}
                <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Спосіб оплати
                  </h2>
                  
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                    className="space-y-3"
                  >
                    <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="card" id="card" />
                      <div>
                        <div className="font-medium">Оплата на карту</div>
                        <div className="text-sm text-muted-foreground">Переказ на картку ПриватБанку</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <div>
                        <div className="font-medium">Накладений платіж</div>
                        <div className="text-sm text-muted-foreground">Оплата при отриманні (+20 грн комісія)</div>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Comment */}
                <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
                  <Label htmlFor="comment">Коментар до замовлення</Label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    placeholder="Додаткові побажання..."
                    className="w-full min-h-[100px] p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>

                {/* Submit Button (Mobile) */}
                <div className="lg:hidden">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full rounded-full text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Обробка..." : `Підтвердити замовлення • ${finalTotal} грн`}
                  </Button>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 shadow-soft sticky top-24 space-y-4">
                <h2 className="text-lg font-bold">Ваше замовлення</h2>
                
                <div className="space-y-3 max-h-[300px] overflow-auto">
                  {cartItemsWithProducts.map((item) => {
                    const product = item.product!;
                    const productOptions = item.selectedOptions.map(optId => 
                      product.options.find(o => o.code === optId)
                    ).filter(Boolean);
                    const optionsTotal = productOptions.reduce((sum, opt) => sum + (opt?.price || 0), 0);
                    
                    return (
                      <div key={item.productId + JSON.stringify(item.selectedOptions)} className="flex gap-3">
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground">Кількість: {item.quantity}</div>
                          {productOptions.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              + {productOptions.length} опц.
                            </div>
                          )}
                        </div>
                        <div className="font-medium text-sm">
                          {((product.salePrice || product.basePrice) * item.quantity) + optionsTotal} грн
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Товари:</span>
                    <span>{total} грн</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Доставка:</span>
                    <span className={deliveryPrice === 0 ? "text-green-600" : ""}>
                      {deliveryPrice === 0 ? "Безкоштовно" : `${deliveryPrice} грн`}
                    </span>
                  </div>
                  {formData.paymentMethod === "cod" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Комісія НП:</span>
                      <span>+20 грн</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Разом:</span>
                    <span className="text-primary">
                      {finalTotal + (formData.paymentMethod === "cod" ? 20 : 0)} грн
                    </span>
                  </div>
                </div>

                {/* Submit Button (Desktop) */}
                <div className="hidden lg:block pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full rounded-full"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? "Обробка..." : "Підтвердити замовлення"}
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-2 pt-4 border-t justify-center text-xs text-muted-foreground">
                  <span>🔒 Безпечна оплата</span>
                  <span>•</span>
                  <span>📦 Швидка доставка</span>
                  <span>•</span>
                  <span>↩️ 14 днів повернення</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
