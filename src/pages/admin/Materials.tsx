import { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Upload, X, Image as ImageIcon } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { ProductMaterial } from '@/types/store';
import { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial } from '@/hooks/useMaterials';

interface EditingMaterial extends Omit<ProductMaterial, 'id'> {
  id: number;
  imageFile?: File | null;
  imagePreview?: string | null;
  sortOrder?: number;
}

export function Materials() {
  const { data: materials = [], isLoading } = useMaterials();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<EditingMaterial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingMaterial({ id: 0, name: '', description: '', image: null, thumbnail: null, sortOrder: 0 });
    setIsDialogOpen(true);
  };

  const handleEdit = (material: ProductMaterial) => {
    setEditingMaterial({ 
      ...material, 
      imagePreview: material.thumbnail || material.image || null,
      imageFile: null,
    });
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Помилка',
        description: 'Тільки зображення (jpeg, jpg, png, gif, webp) дозволені!',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Помилка',
        description: 'Розмір файлу не повинен перевищувати 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingMaterial({
        ...editingMaterial!,
        imageFile: file,
        imagePreview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!editingMaterial) return;

    if (!editingMaterial.name.trim()) {
      toast({
        title: 'Помилка',
        description: 'Заповніть назву матеріалу',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      name: editingMaterial.name,
      description: editingMaterial.description || undefined,
      image: editingMaterial.imageFile || undefined,
      sortOrder: editingMaterial.sortOrder || 0,
    };

    if (editingMaterial.id === 0) {
      createMaterial.mutate(data, {
        onSuccess: () => {
          toast({
            title: 'Створено',
            description: 'Матеріал успішно створено',
          });
          setIsDialogOpen(false);
          setEditingMaterial(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (error: Error) => {
          toast({
            title: 'Помилка',
            description: error.message || 'Не вдалося створити матеріал',
            variant: 'destructive',
          });
        },
      });
    } else {
      updateMaterial.mutate(
        { id: editingMaterial.id, data },
        {
          onSuccess: () => {
            toast({
              title: 'Збережено',
              description: 'Матеріал успішно оновлено',
            });
            setIsDialogOpen(false);
            setEditingMaterial(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          },
          onError: (error: Error) => {
            toast({
              title: 'Помилка',
              description: error.message || 'Не вдалося оновити матеріал',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  const handleDelete = (material: ProductMaterial) => {
    if (!confirm(`Видалити матеріал "${material.name}"?`)) return;

    deleteMaterial.mutate(material.id, {
      onSuccess: () => {
        toast({
          title: 'Видалено',
          description: `Матеріал "${material.name}" видалено`,
          variant: 'destructive',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Помилка',
          description: error.message || 'Не вдалося видалити матеріал',
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження матеріалів...</div>
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
                placeholder="Пошук матеріалів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Додати матеріал
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Materials list */}
      <div className="grid gap-4">
        {filteredMaterials.map((material) => (
          <Card key={material.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Image */}
                {material.thumbnail && (
                  <div className="flex-shrink-0">
                    <img
                      src={material.thumbnail}
                      alt={material.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {!material.thumbnail && material.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={material.image}
                      alt={material.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  </div>
                )}
                {!material.thumbnail && !material.image && (
                  <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-lg border flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-2">{material.name}</h3>
                  {material.description && (
                    <p className="text-sm text-muted-foreground mb-2">{material.description}</p>
                  )}
                  {material.products && material.products.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {material.products.map((product) => {
                        const getBadgeColor = (productName: string) => {
                          if (productName.includes('Стартовий')) return 'bg-blue-100 text-blue-800 border-blue-200';
                          if (productName.includes('Оптимальний')) return 'bg-green-100 text-green-800 border-green-200';
                          if (productName.includes('Преміум')) return 'bg-purple-100 text-purple-800 border-purple-200';
                          return 'bg-secondary text-secondary-foreground';
                        };
                        return (
                          <Badge key={product.id} variant="outline" className={getBadgeColor(product.name)}>
                            {product.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(material)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(material)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredMaterials.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? 'Матеріали не знайдено' : 'Матеріали відсутні. Додайте перший матеріал.'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit/Create Dialog */}
      {editingMaterial && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial.id === 0 ? 'Додати матеріал' : 'Редагувати матеріал'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва *</Label>
                <Input
                  id="name"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  placeholder="Набір ниток – 20 шт"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={editingMaterial.description || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                  placeholder="Набір ниток Peri, Китай"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Порядок сортування</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={editingMaterial.sortOrder || 0}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Зображення</Label>
                {editingMaterial.imagePreview && (
                  <div className="relative w-full max-w-xs">
                    <img
                      src={editingMaterial.imagePreview}
                      alt="Preview"
                      className="w-full h-auto rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setEditingMaterial({
                          ...editingMaterial,
                          imageFile: null,
                          imagePreview: null,
                        });
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Рекомендований розмір: 200×200px. Буде автоматично створено мініатюру.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Скасувати
              </Button>
              <Button onClick={handleSave} disabled={createMaterial.isPending || updateMaterial.isPending}>
                {createMaterial.isPending || updateMaterial.isPending ? 'Збереження...' : 'Зберегти'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}