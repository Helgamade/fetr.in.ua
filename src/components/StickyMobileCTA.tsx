import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowUp } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

export const StickyMobileCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { openCart, getItemCount, getTotal } = useCart();
  const itemCount = getItemCount();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section
      setIsVisible(window.scrollY > 500);
      // Show scroll to top after significant scroll
      setShowScrollTop(window.scrollY > 1500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToProducts = () => {
    document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={cn(
          'fixed bottom-36 right-4 z-30 w-12 h-12 rounded-full bg-card shadow-medium flex items-center justify-center transition-all duration-300 md:hidden',
          showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        )}
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Sticky CTA bar */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border p-3 transition-all duration-300 md:hidden',
          isVisible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex items-center gap-3">
          {itemCount > 0 ? (
            <>
              <Button variant="outline" className="flex-1" onClick={scrollToProducts}>
                Ще набори
              </Button>
              <Button variant="cta" className="flex-1" onClick={openCart}>
                <ShoppingBag className="w-4 h-4" />
                Кошик ({getTotal()} ₴)
              </Button>
            </>
          ) : (
            <Button variant="cta" className="w-full" onClick={scrollToProducts}>
              <ShoppingBag className="w-4 h-4" />
              Обрати набір
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
