import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Check, Users, Eye, Truck, Shield, RefreshCw, Grid3x3 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CountdownTimer } from '@/components/CountdownTimer';
import { OptionIcon } from '@/components/OptionIcon';
import { cn, getEndOfTodayKyiv, getViewingNowCount } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useTexts } from '@/hooks/useTexts';
import { trackEvent, trackFunnel } from '@/lib/analytics';
import { ImageLightbox, ImageLightboxItem } from '@/components/ImageLightbox';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { t } = useTranslation('product');
  const { data: texts = [] } = useTexts();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMaterialsLightboxOpen, setIsMaterialsLightboxOpen] = useState(false);
  const [materialsLightboxIndex, setMaterialsLightboxIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  // Состояние для текущего часа (обновляется раз в час)
  const [currentHour, setCurrentHour] = useState(() => {
    const now = new Date();
    return parseInt(now.toLocaleString('en-US', { 
      timeZone: 'Europe/Kyiv',
      hour: '2-digit',
      hour12: false
    }));
  });

  // Минимальное расстояние для определения свайпа
  const minSwipeDistance = 50;

  // Обновление часа раз в час
  useEffect(() => {
    const updateHour = () => {
      const now = new Date();
      const newHour = parseInt(now.toLocaleString('en-US', { 
        timeZone: 'Europe/Kyiv',
        hour: '2-digit',
        hour12: false
      }));
      setCurrentHour(newHour);
    };

    // Обновляем сразу при монтировании
    updateHour();

    // Вычисляем время до следующего часа
    const now = new Date();
    const msUntilNextHour = 3600000 - (now.getTime() % 3600000);
    
    let intervalId: NodeJS.Timeout | null = null;
    
    // Устанавливаем таймер на обновление в начале следующего часа
    const timeoutId = setTimeout(() => {
      updateHour();
      // Затем обновляем каждый час
      intervalId = setInterval(updateHour, 3600000);
    }, msUntilNextHour);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentImageIndex(0);
      setSelectedOptions([]);
      
      // Отслеживаем просмотр товара
      if (product) {
        trackEvent({
          eventType: 'product_view',
          eventCategory: 'ecommerce',
          productId: product.id,
          eventData: {
            name: product.name,
            price: product.salePrice || product.basePrice,
          },
        });
        trackFunnel({ stage: 'viewed_product' });
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex(prev => {
      if (!product || !product.images || product.images.length === 0) return prev;
      return (prev + 1) % product.images.length;
    });
  }, [product]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(prev => {
      if (!product || !product.images || product.images.length === 0) return prev;
      return (prev - 1 + product.images.length) % product.images.length;
    });
  }, [product]);

  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  const openMaterialsLightbox = useCallback((index: number) => {
    setMaterialsLightboxIndex(index);
    setIsMaterialsLightboxOpen(true);
  }, []);

  const closeMaterialsLightbox = useCallback(() => {
    setIsMaterialsLightboxOpen(false);
  }, []);

  // Обработка свайпов для модального окна
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setTouchEndX(null);
    setTouchEndY(null);
    setIsSwiping(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY) return;
    
    const touch = e.targetTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    // Если горизонтальное движение больше вертикального, это свайп
    if (deltaX > deltaY && deltaX > 10) {
      setIsSwiping(true);
      e.preventDefault(); // Предотвращаем прокрутку при горизонтальном свайпе
    }
    
    setTouchEndX(touch.clientX);
    setTouchEndY(touch.clientY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !touchEndX || !touchStartY || !touchEndY || !product) {
      setTouchStartX(null);
      setTouchStartY(null);
      setTouchEndX(null);
      setTouchEndY(null);
      setIsSwiping(false);
      return;
    }
    
    const distanceX = touchStartX - touchEndX;
    const distanceY = Math.abs(touchStartY - touchEndY);
    
    // Проверяем, что это горизонтальный свайп
    if (Math.abs(distanceX) > distanceY && Math.abs(distanceX) > minSwipeDistance) {
      const isLeftSwipe = distanceX > 0;
      const isRightSwipe = distanceX < 0;

      if (isLeftSwipe && product.images.length > 1) {
        e.preventDefault();
        nextImage();
      } else if (isRightSwipe && product.images.length > 1) {
        e.preventDefault();
        prevImage();
      }
    }
    
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchEndX(null);
    setTouchEndY(null);
    setIsSwiping(false);
  };


  // Используем useMemo для стабильности даты и просмотров - не будут меняться при ре-рендере
  // Обновляются только при изменении часа или при открытии модалки (перезагрузка данных)
  const saleEndDate = useMemo(() => getEndOfTodayKyiv(), []);
  
  // Используем useMemo для стабильности просмотров - обновляется только при изменении часа или открытии модалки
  // Вызываем ДО раннего возврата (правила хуков)
  const viewingNow = useMemo(
    () => product ? getViewingNowCount(product.id, product.purchaseCount || 0) : 0,
    [product?.id, product?.purchaseCount, currentHour, isOpen]
  );
  
  // Ранний возврат ПОСЛЕ всех хуков
  if (!product || !isOpen) return null;

  // Преобразуем изображения товара для ImageLightbox
  const productLightboxImages: ImageLightboxItem[] = product.images.map(url => ({ url }));
  
  // Преобразуем материалы для ImageLightbox
  const materialsLightboxImages: ImageLightboxItem[] = (product.materials || [])
    .filter(m => m.image)
    .map(m => ({
      url: m.image!,
      title: m.name,
      description: m.description || undefined,
    }));

  const basePrice = product.salePrice || product.basePrice;
  const optionsTotal = selectedOptions.reduce((sum, optId) => {
    const option = product.options.find(o => o.code === optId);
    return sum + (option?.price || 0);
  }, 0);
  const totalPrice = basePrice + optionsTotal;

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleAddToCart = () => {
    addToCart(product.code, selectedOptions);
    // trackEvent уже вызывается в addToCart из CartContext
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex md:items-center md:justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:mx-4 bg-card md:rounded-xl overflow-hidden animate-scale-in md:max-w-[calc(660px+min(90vh,100vw-660px-2rem))]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="h-full overflow-y-auto">
          <div className="flex flex-col md:flex-row">
            {/* Image Gallery */}
            <div 
              ref={imageContainerRef}
              className="relative aspect-square md:aspect-auto md:flex-1 md:h-[90vh] bg-muted flex items-center justify-center min-w-0"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain cursor-pointer"
                onClick={(e) => {
                  // Открываем галерею только если не было свайпа
                  if (!isSwiping) {
                    openLightbox();
                  }
                }}
              />
              
              {/* Image navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Toggle thumbnails button */}
              {product.images.length > 1 && (
                <button
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors z-10"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
              )}

              {/* Thumbnails - below image, hidden by default */}
              {product.images.length > 1 && (
                <div className={cn(
                  'absolute bottom-0 left-0 right-0 bg-muted/50 transition-all duration-300 overflow-hidden',
                  showThumbnails ? 'max-h-24 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'
                )}>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={cn(
                          'w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors',
                          idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                        )}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 md:w-[660px] md:flex-shrink-0 md:overflow-y-auto md:max-h-[90vh]">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CountdownTimer endDate={saleEndDate} compact />
                  <span className="text-sm text-muted-foreground">до кінця акції</span>
                </div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                  {product.name}
                </h2>
                <p className="text-muted-foreground">
                  {product.fullDescription}
                </p>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1 text-warning">
                  <Eye className="w-4 h-4" />
                  <span>{viewingNow} переглядають зараз</span>
                </div>
                <div className="flex items-center gap-1 text-success">
                  <Users className="w-4 h-4" />
                  <span>{product.purchaseCount || 0}+ купили</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6 p-4 rounded-xl bg-peach">
                {product.salePrice ? (
                  <>
                    <span className="text-3xl font-heading font-bold text-primary">
                      {product.salePrice} ₴
                    </span>
                    <span className="text-xl text-muted-foreground line-through">
                      {product.basePrice} ₴
                    </span>
                    <span className="badge-discount">
                      Економія {product.basePrice - product.salePrice} ₴
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-heading font-bold text-foreground">
                    {product.basePrice} ₴
                  </span>
                )}
              </div>

              {/* Suitable for */}
              <div className="mb-6">
                <h3 className="font-heading font-semibold mb-2 flex items-center gap-2">
                  {product.sectionIconSuitableFor && (
                    <OptionIcon icon={product.sectionIconSuitableFor} className="w-5 h-5" />
                  )}
                  Підходить для:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.suitableFor.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-sage text-sm font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* What's included */}
              <div className="mb-6">
                <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                  {product.sectionIconFeatures && (
                    <OptionIcon icon={product.sectionIconFeatures} className="w-5 h-5" />
                  )}
                  Що входить:
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What you can make */}
              <div className="mb-6">
                <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                  {product.sectionIconCanMake && (
                    <OptionIcon icon={product.sectionIconCanMake} className="w-5 h-5" />
                  )}
                  {t('what_can_make')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.canMake.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-muted text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div className="mb-6">
                <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                  {product.sectionIconMaterials && (
                    <OptionIcon icon={product.sectionIconMaterials} className="w-5 h-5" />
                  )}
                  Матеріали:
                </h3>
                <div className="space-y-2">
                  {product.materials.map((material, idx) => (
                    <div key={material.id || idx} className="flex gap-3 p-2 rounded-xl bg-muted">
                      {material.thumbnail && (
                        <button
                          onClick={() => openMaterialsLightbox(idx)}
                          className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-border hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={material.thumbnail}
                            alt={material.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{material.name}</div>
                        {material.description && (
                          <div className="text-sm text-muted-foreground mt-1">{material.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional options */}
              <div className="mb-6">
                <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                  {product.sectionIconOptions && (
                    <OptionIcon icon={product.sectionIconOptions} className="w-5 h-5" />
                  )}
                  Додаткові опції:
                </h3>
                <div className="space-y-3">
                  {product.options.map(option => (
                    <label
                      key={option.code}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors',
                        selectedOptions.includes(option.code)
                          ? 'border-primary bg-peach'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox
                        checked={selectedOptions.includes(option.code)}
                        onCheckedChange={() => toggleOption(option.code)}
                        className="mt-0.5"
                      />
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          {option.icon && (
                            <OptionIcon icon={option.icon} />
                          )}
                          <span className="font-medium text-foreground">{option.name}</span>
                        </div>
                        {option.description && (
                          <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                        )}
                      </div>
                      <span className="font-bold text-primary whitespace-nowrap">+{option.price} ₴</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl bg-sage">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-5 h-5 text-secondary" />
                  <span>{texts.find(t => t.key === 'product.benefits.quality')?.value || 'Безпечні матеріали для дитячої творчості'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="w-5 h-5 text-secondary" />
                  <span>{texts.find(t => t.key === 'product.benefits.return')?.value || 'Обмін і повернення без зайвих питань'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-5 h-5 text-secondary" />
                  <span>{texts.find(t => t.key === 'product.benefits.freeDelivery')?.value || 'Безкоштовна доставка від 1500 ₴'}</span>
                </div>
              </div>

              {/* Total & Add to cart */}
              <div className="sticky bottom-0 bg-card pt-4 border-t border-border">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Разом:</span>
                    <span className="text-2xl font-heading font-bold text-primary">{totalPrice} ₴</span>
                  </div>
                  {optionsTotal > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Набір {basePrice} грн + додатково {optionsTotal} грн
                    </div>
                  )}
                </div>
                <Button variant="cta" size="xl" className="w-full" onClick={handleAddToCart}>
                  <ShoppingBag className="w-5 h-5" />
                  Купити зараз
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox - используем универсальный компонент ImageLightbox */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        images={productLightboxImages}
        initialIndex={currentImageIndex}
        onClose={closeLightbox}
        zIndex={60}
      />

      {/* Materials Fullscreen Lightbox - используем универсальный компонент ImageLightbox */}
      <ImageLightbox
        isOpen={isMaterialsLightboxOpen}
        images={materialsLightboxImages}
        initialIndex={materialsLightboxIndex}
        onClose={closeMaterialsLightbox}
        zIndex={70}
      />
    </div>
  );
};
