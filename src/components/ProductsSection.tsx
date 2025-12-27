import React, { useState } from 'react';
import { products } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { Product } from '@/types/store';
import { Sparkles } from 'lucide-react';

export const ProductsSection: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <section id="products" className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-peach/30 to-background -z-10" />
      
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Наші набори</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Оберіть свій ідеальний набір
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Три набори для будь-якого рівня майстерності. Від початківців до професіоналів — знайдеться щось для кожного!
          </p>
        </div>

        {/* Products grid */}
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

        {/* Bottom CTA */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
          <p className="text-lg font-medium text-foreground mb-2">
            🎁 Безкоштовна доставка при замовленні від 1500 ₴
          </p>
          <p className="text-muted-foreground">
            Не можете обрати? Порівняйте всі набори нижче!
          </p>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
};
