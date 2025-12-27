import React, { useState } from 'react';
import { Product } from '@/types/store';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ShoppingBag, Eye, Users, ChevronRight, Sparkles, Flame, Crown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAnalytics } from '@/context/AnalyticsContext';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

const badgeConfig = {
  hit: { icon: Flame, label: 'Хіт продажів', className: 'badge-hit' },
  recommended: { icon: Sparkles, label: 'Рекомендовано', className: 'bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full' },
  limited: { icon: Crown, label: 'Обмежено', className: 'badge-limited' },
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenModal }) => {
  const { addToCart } = useCart();
  const { trackEvent } = useAnalytics();
  const [isHovered, setIsHovered] = useState(false);

  // Mock data for social proof
  const viewingNow = Math.floor(Math.random() * 8) + 2;
  const saleEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

  const discount = product.salePrice 
    ? Math.round((1 - product.salePrice / product.basePrice) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product.code, []);
    trackEvent('quick_add_to_cart', { productId: product.id });
  };

  const handleOpenDetails = () => {
    trackEvent('open_product_modal', { productId: product.id });
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
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.badge && (
            <div className={cn('flex items-center gap-1', badgeConfig[product.badge].className)}>
              {React.createElement(badgeConfig[product.badge].icon, { className: 'w-3 h-3' })}
              {badgeConfig[product.badge].label}
            </div>
          )}
          {discount > 0 && (
            <div className="badge-discount">
              -{discount}%
            </div>
          )}
        </div>

        {/* Stock warning */}
        {product.stock <= 10 && (
          <div className="absolute top-3 right-3 bg-destructive/90 text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full">
            Залишилось {product.stock} шт
          </div>
        )}

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
          {product.features.length > 3 && (
            <li className="text-sm text-primary font-medium">
              + ще {product.features.length - 3} позицій
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

        {/* Social proof */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{viewingNow} переглядають</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{product.purchaseCount}+ купили</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="hero" 
            className="flex-1"
            onClick={handleQuickAdd}
          >
            <ShoppingBag className="w-4 h-4" />
            Замовити
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
