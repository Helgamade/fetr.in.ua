import React, { useState } from 'react';
import { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ShoppingBag, Eye, Users, ChevronRight, Sparkles, Flame, Crown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenModal }) => {
  const { t } = useTranslation('product');
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  const badgeConfig = {
    hit: { icon: Flame, label: t('badge.hit'), className: 'badge-hit' },
    recommended: { icon: Sparkles, label: t('badge.recommended'), className: 'bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full' },
    limited: { icon: Crown, label: t('badge.limited'), className: 'badge-limited' },
  };

  // Mock data for social proof
  const viewingNow = Math.floor(Math.random() * 8) + 2;
  const saleEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

  const discount = product.salePrice 
    ? Math.round((1 - product.salePrice / product.basePrice) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product.code, []);
    // quick_add_to_cart уже отслеживается в addToCart через trackEvent из @/lib/analytics
    // Дополнительный trackEvent через useAnalytics не нужен, так как он использует другой контекст
  };

  const handleOpenDetails = () => {
    trackEvent({
      eventType: 'product_view',
      eventCategory: 'product',
      productId: product.id,
    });
    onOpenModal(product);
  };

  return (
    <div
      className={cn(
        'glass-card overflow-hidden transition-all duration-300 group',
        isHovered && 'shadow-large -translate-y-2'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badge - top-left */}
        {product.badge && (
          <div className={cn('absolute top-4 left-4 flex items-center gap-1', badgeConfig[product.badge].className)}>
            {React.createElement(badgeConfig[product.badge].icon, { className: 'w-3 h-3' })}
            {badgeConfig[product.badge].label}
          </div>
        )}

        {/* Discount badge - top-right */}
        {discount > 0 && (
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
            -{discount}%
          </div>
        )}

        {/* Live viewers and purchases - bottom-left and bottom-right */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
            <Eye className="w-3 h-3 text-primary animate-pulse" />
            <span>{viewingNow} переглядають</span>
          </div>
          <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
            <Users className="w-3 h-3 text-sage-dark" />
            <span>{product.purchaseCount}+ купили</span>
          </div>
        </div>

        {/* Quick actions overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent flex items-end justify-center pb-4 transition-opacity duration-300',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          <Button variant="glass" onClick={handleOpenDetails}>
            Детальніше
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {/* Timer */}
        <div className="mb-3">
          <CountdownTimer endDate={saleEndDate} compact />
        </div>

        {/* Title */}
        <h3 className="text-lg font-heading font-bold text-foreground mb-2">
          {product.name}
        </h3>

        {/* Short description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.shortDescription}
        </p>

        {/* Features preview */}
        <ul className="mb-4 space-y-1">
          {product.features.slice(0, 3).map((feature, idx) => (
            <li key={idx} className="text-sm text-foreground flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              {feature}
            </li>
          ))}
          {product.featuresExtraText && (
            <li className="text-sm text-primary font-medium">
              {product.featuresExtraText}
            </li>
          )}
        </ul>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          {product.salePrice ? (
            <>
              <span className="text-2xl font-heading font-bold text-primary">
                {product.salePrice} ₴
              </span>
              <span className="text-lg text-muted-foreground line-through">
                {product.basePrice} ₴
              </span>
            </>
          ) : (
            <span className="text-2xl font-heading font-bold text-foreground">
              {product.basePrice} ₴
            </span>
          )}
        </div>

        {/* Stock warning */}
        {product.stock <= 10 && (
          <div className="flex items-center gap-2 text-warning text-sm font-medium mb-4">
            <span>Залишилось {product.stock} шт</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="hero" 
            className="flex-1"
            onClick={handleQuickAdd}
          >
            <ShoppingBag className="w-4 h-4" />
            Купити
          </Button>
          <Button 
            variant="outline"
            onClick={handleOpenDetails}
          >
            Детальніше
          </Button>
        </div>
      </div>
    </div>
  );
};
