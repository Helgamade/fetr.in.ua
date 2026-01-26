import { useState } from 'react';
import { Product, ProductOption } from '@/types/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Plus } from 'lucide-react';

interface AddProductToOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (productId: string, quantity: number, selectedOptions: string[]) => void;
  products: Product[];
}

export function AddProductToOrderDialog({
  isOpen,
  onClose,
  onAdd,
  products,
}: AddProductToOrderDialogProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedOptions([]);
    setQuantity(1);
  };

  const handleOptionToggle = (optionCode: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionCode)
        ? prev.filter((code) => code !== optionCode)
        : [...prev, optionCode]
    );
  };

  const handleAdd = () => {
    if (!selectedProduct) return;
    onAdd(selectedProduct.code, quantity, selectedOptions);
    handleClose();
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setSelectedOptions([]);
    setQuantity(1);
    onClose();
  };

  const selectedProductOptions = selectedProduct?.options || [];
  const totalOptionsPrice = selectedOptions.reduce((total, optCode) => {
    const option = selectedProductOptions.find((opt) => opt.code === optCode);
    return total + (option?.price || 0);
  }, 0);

  const productPrice = selectedProduct
    ? selectedProduct.salePrice || selectedProduct.basePrice
    : 0;
  const totalPrice = (productPrice + totalOptionsPrice) * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Додати товар до замовлення</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!selectedProduct ? (
            // Шаг 1: Выбор товара
            <div className="space-y-4">
              <Label>Оберіть товар</Label>
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Артикул: {product.code}
                      </div>
                      <div className="text-sm font-semibold mt-1">
                        {product.salePrice ? (
                          <>
                            <span className="text-primary">
                              {product.salePrice} ₴
                            </span>
                            <span className="text-muted-foreground line-through ml-2">
                              {product.basePrice} ₴
                            </span>
                          </>
                        ) : (
                          <span>{product.basePrice} ₴</span>
                        )}
                      </div>
                      {product.stock !== undefined && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Остаток: {product.stock}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Шаг 2: Выбор опций и количества
            <div className="space-y-6">
              {/* Информация о выбранном товаре */}
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex-shrink-0">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{selectedProduct.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Артикул: {selectedProduct.code}
                  </div>
                  <div className="text-sm font-semibold mt-1">
                    {selectedProduct.salePrice ? (
                      <>
                        <span className="text-primary">
                          {selectedProduct.salePrice} ₴
                        </span>
                        <span className="text-muted-foreground line-through ml-2">
                          {selectedProduct.basePrice} ₴
                        </span>
                      </>
                    ) : (
                      <span>{selectedProduct.basePrice} ₴</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProduct(null)}
                >
                  Змінити
                </Button>
              </div>

              {/* Количество */}
              <div className="space-y-2">
                <Label>Кількість</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, val));
                    }}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Дополнительные опции */}
              {selectedProductOptions.length > 0 && (
                <div className="space-y-3">
                  <Label>Додаткові опції</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedProductOptions.map((option: ProductOption) => (
                      <div
                        key={option.code}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            id={`option-${option.code}`}
                            checked={selectedOptions.includes(option.code)}
                            onCheckedChange={() => handleOptionToggle(option.code)}
                          />
                          <label
                            htmlFor={`option-${option.code}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium">{option.name}</div>
                            {option.description && (
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            )}
                          </label>
                        </div>
                        <div className="font-semibold text-primary ml-4">
                          +{option.price} ₴
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Итоговая цена */}
              <div className="p-4 border rounded-lg bg-primary/5">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Всього:</span>
                  <span className="text-xl font-bold text-primary">
                    {totalPrice.toFixed(0)} ₴
                  </span>
                </div>
                {totalOptionsPrice > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Товар: {productPrice} ₴ × {quantity} ={' '}
                    {(productPrice * quantity).toFixed(0)} ₴
                    <br />
                    Опції: +{totalOptionsPrice.toFixed(0)} ₴
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Скасувати
          </Button>
          {selectedProduct && (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Додати до замовлення
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
