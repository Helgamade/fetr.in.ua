import { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Package,
  Eye,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { products as initialProducts } from '@/data/products';
import { Product } from '@/types/store';
import { useToast } from '@/hooks/use-toast';

const badgeLabels = {
  hit: 'Хіт',
  recommended: 'Рекомендуємо',
  limited: 'Обмежено',
};

const badgeColors = {
  hit: 'bg-red-100 text-red-800',
  recommended: 'bg-green-100 text-green-800',
  limited: 'bg-purple-100 text-purple-800',
};

export function Products() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingProduct) return;

    setProducts(prev => prev.map(p => 
      p.id === editingProduct.id ? editingProduct : p
    ));
    
    toast({
      title: 'Збережено',
      description: `Товар "${editingProduct.name}" оновлено`,
    });
    
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    
    toast({
      title: 'Видалено',
      description: `Товар "${product?.name}" видалено`,
      variant: 'destructive',
    });
  };

  const handleStockChange = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
    ));
  };

  return (
    <div className="space-y-6">
      {/* Search and actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук товарів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => {
              toast({
                title: 'Функція в розробці',
                description: 'Додавання нових товарів буде доступне пізніше',
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Додати товар
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            {/* Product image */}
            <div className="aspect-video relative">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <Badge className={`absolute top-2 right-2 ${badgeColors[product.badge]}`}>
                  {badgeLabels[product.badge]}
                </Badge>
              )}
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Product info */}
              <div>
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.shortDescription}
                </p>
              </div>

              {/* Prices */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  ₴{product.salePrice || product.basePrice}
                </span>
                {product.salePrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₴{product.basePrice}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {product.viewCount}
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" />
                  {product.purchaseCount}
                </div>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">На складі:</span>
                <Input
                  type="number"
                  value={product.stock}
                  onChange={(e) => handleStockChange(product.id, parseInt(e.target.value) || 0)}
                  className="w-20 h-8 text-center"
                  min={0}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Редагувати
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Товари не знайдено
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагувати товар</DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва</Label>
                <Input
                  id="name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Короткий опис</Label>
                <Textarea
                  id="shortDescription"
                  value={editingProduct.shortDescription}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDescription">Повний опис</Label>
                <Textarea
                  id="fullDescription"
                  value={editingProduct.fullDescription}
                  onChange={(e) => setEditingProduct({ ...editingProduct, fullDescription: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Базова ціна</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={editingProduct.basePrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Ціна зі знижкою</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    value={editingProduct.salePrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Кількість на складі</Label>
                <Input
                  id="stock"
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Особливості (по одній на рядок)</Label>
                <Textarea
                  value={editingProduct.features.join('\n')}
                  onChange={(e) => setEditingProduct({ ...editingProduct, features: e.target.value.split('\n').filter(Boolean) })}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSave}>
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
