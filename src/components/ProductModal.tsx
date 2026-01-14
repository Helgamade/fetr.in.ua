import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Check, Users, Eye, Truck, Shield, Gift } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { CountdownTimer } from '@/components/CountdownTimer';
import { OptionIcon } from '@/components/OptionIcon';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { trackEvent, trackFunnel } from '@/lib/analytics';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { t } = useTranslation('product');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const lightboxContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  // Минимальное расстояние для определения свайпа
  const minSwipeDistance = 50;

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

  if (!product || !isOpen) return null;

  const saleEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const viewingNow = Math.floor(Math.random() * 8) + 2;

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

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

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

  // Обработка свайпов для полноэкранной галереи
  const [lightboxTouchStart, setLightboxTouchStart] = useState<{ x: number; y: number } | null>(null);

  const onLightboxTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    setLightboxTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const onLightboxTouchMove = (e: React.TouchEvent) => {
    if (!lightboxTouchStart) return;
    
    const touch = e.targetTouches[0];
    const deltaX = Math.abs(touch.clientX - lightboxTouchStart.x);
    const deltaY = Math.abs(touch.clientY - lightboxTouchStart.y);
    
    // Предотвращаем прокрутку при горизонтальном свайпе
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  };

  const onLightboxTouchEnd = (e: React.TouchEvent) => {
    if (!lightboxTouchStart || !product) {
      setLightboxTouchStart(null);
      return;
    }
    
    const touch = e.changedTouches[0];
    const distanceX = touch.clientX - lightboxTouchStart.x;
    const distanceY = Math.abs(touch.clientY - lightboxTouchStart.y);
    
    // Проверяем, что свайп горизонтальный (больше горизонтального движения)
    if (Math.abs(distanceX) > distanceY && Math.abs(distanceX) > minSwipeDistance) {
      e.preventDefault();
      if (distanceX > 0) {
        // Свайп вправо - предыдущее изображение
        prevImage();
      } else {
        // Свайп влево - следующее изображение
        nextImage();
      }
    }
    
    setLightboxTouchStart(null);
  };

  // Обработка клавиатуры для полноэкранной галереи
  useEffect(() => {
    if (!isLightboxOpen || !product) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft' && product.images.length > 1) {
        prevImage();
      } else if (e.key === 'ArrowRight' && product.images.length > 1) {
        nextImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, product?.images.length]);

  return (
    <div className="fixed inset-0 z-50 flex md:items-center md:justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:mx-4 bg-card md:rounded-2xl overflow-hidden animate-scale-in md:max-w-[calc(660px+min(90vh,100vw-660px-2rem))]">
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

              {/* Image indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-sm font-medium">
                  {currentImageIndex + 1} / {product.images.length}
                </span>
              </div>

              {/* Thumbnails */}
              <div className="absolute bottom-16 left-4 right-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      'w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                      idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
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
                  <span>{product.purchaseCount}+ купили</span>
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
                    <div key={idx} className="p-3 rounded-lg bg-muted">
                      <div className="font-medium">{material.name}</div>
                      <div className="text-sm text-muted-foreground">{material.description}</div>
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
                  <Truck className="w-5 h-5 text-secondary" />
                  <span>Безкоштовна доставка від 1500 ₴</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-5 h-5 text-secondary" />
                  <span>Гарантія якості</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="w-5 h-5 text-secondary" />
                  <span>Подарунок до замовлення</span>
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

      {/* Fullscreen Lightbox */}
      {isLightboxOpen && (
        <div 
          ref={lightboxContainerRef}
          className="fixed inset-0 z-[60] bg-foreground/95 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeLightbox();
            }
          }}
          onTouchStart={onLightboxTouchStart}
          onTouchMove={onLightboxTouchMove}
          onTouchEnd={onLightboxTouchEnd}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-card/20 flex items-center justify-center hover:bg-card/40 transition-colors z-10"
          >
            <X className="w-6 h-6 text-primary-foreground" />
          </button>

          {product.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 flex items-center justify-center hover:bg-card/40 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-primary-foreground" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 flex items-center justify-center hover:bg-card/40 transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 text-primary-foreground" />
              </button>
            </>
          )}

          <div 
            className="max-w-7xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={product.images[currentImageIndex]}
              alt={product.name}
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
            <div className="text-center mt-4">
              <p className="text-primary-foreground/60 text-sm">
                {currentImageIndex + 1} / {product.images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
