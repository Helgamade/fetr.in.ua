import React from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useComparison } from '@/hooks/useComparison';
import { Button } from '@/components/ui/button';
import { Check, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export const ComparisonSection: React.FC = () => {
  const { t } = useTranslation('comparison');
  const { data: products = [] } = useProducts();
  const { data: comparisonData, isLoading: isLoadingComparison } = useComparison();
  const { addToCart } = useCart();

  if (isLoadingComparison || !comparisonData) {
    return (
      <section id="comparison" className="py-20 bg-sage/30">
        <div className="container-tight text-center">
          <div className="text-muted-foreground">{t('loading')}</div>
        </div>
      </section>
    );
  }

  const { features } = comparisonData;
  // Filter products to match comparison data products order
  const sortedProducts = products
    .filter(p => comparisonData.products.some(cp => cp.code === p.code))
    .sort((a, b) => {
      const aIdx = comparisonData.products.findIndex(cp => cp.code === a.code);
      const bIdx = comparisonData.products.findIndex(cp => cp.code === b.code);
      return aIdx - bIdx;
    });

  return (
    <section id="comparison" className="py-20 bg-sage/30">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto comparison-scroll pb-4">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="text-left p-4 bg-card rounded-tl-xl sticky left-0 z-20 min-w-[180px] shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                  <span className="text-lg font-heading font-bold">{t('parameters')}</span>
                </th>
                {sortedProducts.map((product, idx) => (
                  <th
                    key={product.id}
                    className={cn(
                      'p-4 text-center min-w-[180px]',
                      idx === 1 ? 'bg-primary/10' : 'bg-card',
                      idx === sortedProducts.length - 1 && 'rounded-tr-xl'
                    )}
                  >
                    <div className="space-y-2">
                      <span className="block text-lg font-heading font-bold">{product.name}</span>
                      <div className="flex items-center justify-center gap-2">
                        {product.salePrice ? (
                          <>
                            <span className="text-xl font-bold text-primary">{product.salePrice} ₴</span>
                            <span className="text-sm text-muted-foreground line-through">{product.basePrice} ₴</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold">{product.basePrice} ₴</span>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, rowIdx) => {
                const rowBg = rowIdx % 2 === 0 ? 'bg-muted' : 'bg-card';
                return (
                  <tr key={feature.key} className={rowBg}>
                    <td className={cn(
                      "p-4 font-medium sticky left-0 z-20",
                      rowBg,
                      "shadow-[2px_0_4px_rgba(0,0,0,0.05)]"
                    )}>
                      {feature.label}
                    </td>
                  {sortedProducts.map((product, colIdx) => {
                    // Get value from comparison data
                    const value = feature.values[product.code] ?? null;
                    return (
                      <td
                        key={product.id}
                        className={cn(
                          'p-4 text-center',
                          colIdx === 1 && 'bg-primary/5'
                        )}
                      >
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="w-6 h-6 text-success mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className={cn(colIdx === 1 && 'font-medium')}>{value || '-'}</span>
                        )}
                      </td>
                    );
                  })}
                  </tr>
                );
              })}
              {/* CTA row */}
              <tr>
                <td className="p-4 sticky left-0 bg-card rounded-bl-xl z-20 shadow-[2px_0_4px_rgba(0,0,0,0.05)]"></td>
                {sortedProducts.map((product, idx) => (
                  <td
                    key={product.id}
                    className={cn(
                      'p-4 text-center',
                      idx === 1 && 'bg-primary/5',
                      idx === sortedProducts.length - 1 && 'rounded-br-xl'
                    )}
                  >
                    <Button
                      variant={idx === 1 ? 'hero' : 'outline'}
                      onClick={() => addToCart(product.code, [])}
                      className="w-full"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Замовити
                    </Button>
                  </td>
                ))}
              </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4 md:hidden">
                ← Прокрутіть таблицю вбік →
              </p>

        {/* Recommendation */}
        <div className="mt-8 p-6 rounded-2xl bg-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-lg mb-1">{t('recommend.title')}</h3>
            <p className="text-muted-foreground">{t('recommend.subtitle')}</p>
          </div>
          {(() => {
            const optimalProduct = sortedProducts.find(p => p.code === 'optimal');
            return (
              <Button variant="hero" onClick={() => optimalProduct && addToCart(optimalProduct.code, [])}>
                {t('recommend.button')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            );
          })()}
        </div>
      </div>
    </section>
  );
};
