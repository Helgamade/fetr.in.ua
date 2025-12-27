import React from 'react';
import { products } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Check, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

const comparisonFeatures = [
  { key: 'colors', label: 'Кількість кольорів фетру' },
  { key: 'size', label: 'Розмір листів фетру' },
  { key: 'tools', label: 'Інструменти' },
  { key: 'templates', label: 'Шаблони' },
  { key: 'video', label: 'Відео-інструкції' },
  { key: 'furniture', label: 'Фурнітура' },
  { key: 'filler', label: 'Наповнювач' },
  { key: 'consultation', label: 'Консультація майстра' },
  { key: 'gift', label: 'Подарункова упаковка' },
  { key: 'suitable', label: 'Рекомендовано для' },
];

const productData: Record<string, Record<string, string | boolean>> = {
  starter: {
    colors: '10 кольорів',
    size: '15×15 см',
    tools: 'Базовий набір',
    templates: '5 шаблонів',
    video: false,
    furniture: false,
    filler: false,
    consultation: false,
    gift: false,
    suitable: 'Діти 3+, початківці',
  },
  optimal: {
    colors: '20 кольорів',
    size: '20×20 см',
    tools: 'Повний набір',
    templates: '20+ шаблонів',
    video: true,
    furniture: true,
    filler: true,
    consultation: false,
    gift: false,
    suitable: 'Вся родина, садок, школа',
  },
  premium: {
    colors: '40 кольорів',
    size: '30×30 см',
    tools: 'Професійні',
    templates: '50+ шаблонів',
    video: true,
    furniture: true,
    filler: true,
    consultation: true,
    gift: true,
    suitable: 'Професіонали, ентузіасти',
  },
};

export const ComparisonSection: React.FC = () => {
  const { addToCart } = useCart();

  return (
    <section id="comparison" className="py-20 bg-sage/30">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Порівняння наборів
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Детальне порівняння допоможе обрати саме той набір, який підходить вам найкраще
          </p>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto comparison-scroll pb-4">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="text-left p-4 bg-card rounded-tl-xl sticky left-0 z-10 min-w-[180px]">
                  <span className="text-lg font-heading font-bold">Параметри</span>
                </th>
                {products.map((product, idx) => (
                  <th
                    key={product.id}
                    className={cn(
                      'p-4 text-center min-w-[180px]',
                      idx === 1 ? 'bg-primary/10' : 'bg-card',
                      idx === products.length - 1 && 'rounded-tr-xl'
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
              {comparisonFeatures.map((feature, rowIdx) => (
                <tr key={feature.key} className={rowIdx % 2 === 0 ? 'bg-muted/30' : 'bg-card'}>
                  <td className="p-4 font-medium sticky left-0 bg-inherit z-10">
                    {feature.label}
                  </td>
                  {products.map((product, colIdx) => {
                    const value = productData[product.id]?.[feature.key];
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
                          <span className={cn(colIdx === 1 && 'font-medium')}>{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* CTA row */}
              <tr>
                <td className="p-4 sticky left-0 bg-card rounded-bl-xl z-10"></td>
                {products.map((product, idx) => (
                  <td
                    key={product.id}
                    className={cn(
                      'p-4 text-center',
                      idx === 1 && 'bg-primary/5',
                      idx === products.length - 1 && 'rounded-br-xl'
                    )}
                  >
                    <Button
                      variant={idx === 1 ? 'hero' : 'outline'}
                      onClick={() => addToCart(product.id, [])}
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

        {/* Recommendation */}
        <div className="mt-8 p-6 rounded-2xl bg-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-lg mb-1">Рекомендуємо: Оптимальний набір</h3>
            <p className="text-muted-foreground">Найкраще співвідношення ціни та можливостей</p>
          </div>
          <Button variant="hero" onClick={() => addToCart('optimal', [])}>
            Замовити зараз
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
