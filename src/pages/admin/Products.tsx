import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Package,
  Eye,
  ShoppingCart,
  X,
  Upload,
  Loader2,
  ChevronUp,
  ChevronDown
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Product, ProductOption } from '@/types/store';
import { useToast } from '@/hooks/use-toast';
import { useProducts, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { productsAPI } from '@/lib/api';

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
  const { data: products = [], isLoading } = useProducts();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableOptions, setAvailableOptions] = useState<ProductOption[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const { toast } = useToast();

  // Load available options when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      optionsAPI.getAll()
        .then(setAvailableOptions)
        .catch(() => {
          toast({
            title: 'Помилка',
            description: 'Не вдалося завантажити опції',
            variant: 'destructive',
          });
        });
    }
  }, [isDialogOpen, toast]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct({ 
      ...product,
      images: product.images && product.images.length > 0 ? [...product.images] : ['']
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingProduct) return;

    // Prepare data for API - convert options to array of objects with id and sortOrder, filter empty images
    const dataToSave = {
      ...editingProduct,
      options: editingProduct.options.map((opt, index) => ({
        id: opt.id,
        sortOrder: index
      })),
      images: editingProduct.images.filter(img => img && img.trim()),
    };

    updateProduct.mutate(
      { id: editingProduct.id, data: dataToSave },
      {
        onSuccess: () => {
          toast({
            title: 'Збережено',
            description: `Товар "${editingProduct.name}" оновлено`,
          });
          setIsDialogOpen(false);
          setEditingProduct(null);
        },
        onError: (error: Error) => {
          toast({
            title: 'Помилка',
            description: error.message || 'Не вдалося зберегти товар',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження файлу');
      }

      const data = await response.json();
      const newImages = [...(editingProduct?.images || [])];
      newImages[index] = data.url;
      setEditingProduct({ ...editingProduct!, images: newImages });
      toast({
        title: 'Успішно',
        description: 'Зображення завантажено',
      });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося завантажити зображення',
        variant: 'destructive',
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleFileInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(index, file);
    }
    // Сброс input для возможности загрузки того же файла снова
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  const handleDelete = (productId: string) => {
    const product = products.find(p => p.id === productId);
    
    deleteProduct.mutate(productId, {
      onSuccess: () => {
        toast({
          title: 'Видалено',
          description: `Товар "${product?.name}" видалено`,
          variant: 'destructive',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Помилка',
          description: error.message || 'Не вдалося видалити товар',
          variant: 'destructive',
        });
      },
    });
  };

  const handleStockChange = (productId: string, newStock: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    updateProduct.mutate({
      id: productId,
      data: { ...product, stock: Math.max(0, newStock) },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження товарів...</div>
      </div>
    );
  }

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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагувати товар</DialogTitle>
          </DialogHeader>

          {editingProduct && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="basic">Основне</TabsTrigger>
                <TabsTrigger value="images">Зображення</TabsTrigger>
                <TabsTrigger value="features">Що входить</TabsTrigger>
                <TabsTrigger value="materials">Матеріали</TabsTrigger>
                <TabsTrigger value="canMake">Що можна зробити</TabsTrigger>
                <TabsTrigger value="suitableFor">Підходить для</TabsTrigger>
                <TabsTrigger value="options">Опції</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
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
                    <Label htmlFor="basePrice">Базова ціна (₴)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={editingProduct.basePrice}
                      onChange={(e) => setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">Ціна зі знижкою (₴)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      value={editingProduct.salePrice || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="badge">Бейдж</Label>
                    <select
                      id="badge"
                      value={editingProduct.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value as 'hit' | 'recommended' | 'limited' | undefined })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Без бейджа</option>
                      <option value="hit">Хіт продажів</option>
                      <option value="recommended">Рекомендовано</option>
                      <option value="limited">Обмежено</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Порядок відображення</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={editingProduct.displayOrder || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Менше значення = вище в списку. Рекомендовано: Стартовий=1, Оптимальний=2, Преміум=3
                  </p>
                </div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Зображення товару</Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Додайте URL зображень або завантажте файли з комп'ютера (кнопка з іконкою завантаження). Перше зображення буде основним. Можна додавати необмежену кількість.
                  </p>
                  <div className="space-y-3">
                    {editingProduct.images.map((image, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input
                          value={image}
                          onChange={(e) => {
                            const newImages = [...editingProduct.images];
                            newImages[index] = e.target.value;
                            setEditingProduct({ ...editingProduct, images: newImages });
                          }}
                          placeholder="https://example.com/image.jpg або завантажте файл"
                          className="flex-1"
                        />
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          ref={(el) => fileInputRefs.current[index] = el}
                          onChange={(e) => handleFileInputChange(index, e)}
                          className="hidden"
                          id={`file-upload-${index}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          disabled={uploadingIndex === index}
                          title="Завантажити зображення"
                        >
                          {uploadingIndex === index ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex gap-1">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newImages = [...editingProduct.images];
                                [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                                setEditingProduct({ ...editingProduct, images: newImages });
                              }}
                            >
                              ↑
                            </Button>
                          )}
                          {index < editingProduct.images.length - 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newImages = [...editingProduct.images];
                                [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                                setEditingProduct({ ...editingProduct, images: newImages });
                              }}
                            >
                              ↓
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newImages = editingProduct.images.filter((_, i) => i !== index);
                              setEditingProduct({ ...editingProduct, images: newImages });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {image && (
                          <div className="w-20 h-20 border rounded overflow-hidden flex-shrink-0">
                            <img src={image} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingProduct({ ...editingProduct, images: [...editingProduct.images, ''] });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Додати зображення
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Що входить (по одній на рядок)</Label>
                  <Textarea
                    value={editingProduct.features.join('\n')}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      features: e.target.value.split('\n').filter(Boolean) 
                    })}
                    rows={8}
                    placeholder="20 кольорів фетру (20×20 см)&#10;Повний набір інструментів&#10;20+ шаблонів різної складності"
                  />
                </div>
              </TabsContent>

              {/* Materials Tab */}
              <TabsContent value="materials" className="space-y-4 mt-4">
                <div className="space-y-3">
                  {editingProduct.materials.map((material, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Назва матеріалу"
                          value={material.name}
                          onChange={(e) => {
                            const newMaterials = [...editingProduct.materials];
                            newMaterials[index] = { ...material, name: e.target.value };
                            setEditingProduct({ ...editingProduct, materials: newMaterials });
                          }}
                        />
                        <Textarea
                          placeholder="Опис"
                          value={material.description || ''}
                          onChange={(e) => {
                            const newMaterials = [...editingProduct.materials];
                            newMaterials[index] = { ...material, description: e.target.value };
                            setEditingProduct({ ...editingProduct, materials: newMaterials });
                          }}
                          rows={2}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newMaterials = editingProduct.materials.filter((_, i) => i !== index);
                          setEditingProduct({ ...editingProduct, materials: newMaterials });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingProduct({
                        ...editingProduct,
                        materials: [...editingProduct.materials, { name: '', description: '' }]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Додати матеріал
                  </Button>
                </div>
              </TabsContent>

              {/* CanMake Tab */}
              <TabsContent value="canMake" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Що можна зробити (по одній на рядок)</Label>
                  <Textarea
                    value={editingProduct.canMake.join('\n')}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      canMake: e.target.value.split('\n').filter(Boolean) 
                    })}
                    rows={8}
                    placeholder="М'які іграшки&#10;Мобілі для малюків&#10;Розвиваючі книжки"
                  />
                </div>
              </TabsContent>

              {/* SuitableFor Tab */}
              <TabsContent value="suitableFor" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Підходить для (по одній на рядок)</Label>
                  <Textarea
                    value={editingProduct.suitableFor.join('\n')}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      suitableFor: e.target.value.split('\n').filter(Boolean) 
                    })}
                    rows={6}
                    placeholder="Вся родина&#10;Садочок&#10;Школа&#10;Подарунок"
                  />
                </div>
              </TabsContent>

              {/* Options Tab */}
              <TabsContent value="options" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Вибрані опції (відсортовані для цього товару)</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Використовуйте кнопки ↑ ↓ для зміни порядку відображення
                    </p>
                    {editingProduct.options.length > 0 ? (
                      <div className="space-y-2">
                        {editingProduct.options.map((option, index) => (
                          <div key={option.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                            <div className="flex flex-col gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={index === 0}
                                onClick={() => {
                                  const newOptions = [...editingProduct.options];
                                  [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
                                  setEditingProduct({ ...editingProduct, options: newOptions });
                                }}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={index === editingProduct.options.length - 1}
                                onClick={() => {
                                  const newOptions = [...editingProduct.options];
                                  [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
                                  setEditingProduct({ ...editingProduct, options: newOptions });
                                }}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{option.name}</div>
                              {option.description && (
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                              )}
                              <div className="text-sm font-semibold text-primary mt-1">
                                +{option.price} ₴
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingProduct({
                                  ...editingProduct,
                                  options: editingProduct.options.filter(opt => opt.id !== option.id)
                                });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                        Опції не вибрані. Додайте опції зі списку нижче.
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Доступні опції для додавання</Label>
                    {availableOptions.filter(opt => !editingProduct.options.some(o => o.id === opt.id)).length > 0 ? (
                      <div className="space-y-2 mt-3">
                        {availableOptions
                          .filter(opt => !editingProduct.options.some(o => o.id === opt.id))
                          .map((option) => (
                            <div key={option.id} className="flex items-start gap-3 p-3 border rounded-lg">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingProduct({
                                    ...editingProduct,
                                    options: [...editingProduct.options, option]
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Додати
                              </Button>
                              <div className="flex-1">
                                <div className="font-medium">{option.name}</div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                                <div className="text-sm font-semibold text-primary mt-1">
                                  +{option.price} ₴
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg mt-3">
                        Всі доступні опції додано або опції відсутні. Створіть нові опції в розділі "Опції".
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
