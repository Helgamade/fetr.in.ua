import React, { useState, useEffect } from 'react';
import { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Check, Users, Eye, Truck, Shield, Gift } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { CountdownTimer } from '@/components/CountdownTimer';
import { cn } from '@/lib/utils';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const { addToCart } = useCart();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentImageIndex(0);
      setSelectedOptions([]);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
    trackEvent('add_to_cart_modal', { productId: product.code, options: selectedOptions });
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl md:mx-4 bg-card md:rounded-2xl overflow-hidden animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="h-full overflow-y-auto">
          <div className="md:grid md:grid-cols-2">
            {/* Image Gallery */}
            <div className="relative aspect-square md:aspect-square bg-muted flex items-center justify-center">
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain"
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
            <div className="p-6 md:overflow-y-auto md:max-h-[90vh]">
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
                <h3 className="font-heading font-semibold mb-2">Підходить для:</h3>
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
                <h3 className="font-heading font-semibold mb-3">Що входить:</h3>
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
                <h3 className="font-heading font-semibold mb-3">Що можна зробити:</h3>
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
                <h3 className="font-heading font-semibold mb-3">Матеріали:</h3>
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
                <h3 className="font-heading font-semibold mb-3">Додаткові опції:</h3>
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
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.name}</span>
                          <span className="font-semibold text-primary">+{option.price} ₴</span>
                        </div>
                        {option.description && (
                          <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                        )}
                      </div>
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
                  Додати в кошик
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
