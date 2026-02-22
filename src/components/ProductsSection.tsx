import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { Product } from '@/types/store';
import { Sparkles } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useTranslation } from '@/hooks/useTranslation';

export const ProductsSection: React.FC = () => {
  const { t } = useTranslation('products');
  const { data: products = [], isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const openedFromUrlRef = useRef(false);

  // Open product modal from URL param ?product=<slug>
  useEffect(() => {
    if (products.length === 0 || openedFromUrlRef.current) return;
    const slug = searchParams.get('product');
    if (!slug) return;
    const product = products.find(p => p.slug === slug);
    if (product) {
      openedFromUrlRef.current = true;
      setSelectedProduct(product);
    }
  }, [products, searchParams]);

  const handleCloseModal = () => {
    setSelectedProduct(null);
    if (searchParams.has('product')) {
      const next = new URLSearchParams(searchParams);
      next.delete('product');
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <section id="products" className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-peach/30 to-background -z-10" />
      
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{t('badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('loading')}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <ProductCard
                product={product}
                onOpenModal={setSelectedProduct}
              />
            </div>
          ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
          <p className="text-lg font-medium text-foreground mb-2">
            {t('cta.title')}
          </p>
          <p className="text-muted-foreground">
            {t('cta.subtitle')}
          </p>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={handleCloseModal}
      />
    </section>
  );
};
