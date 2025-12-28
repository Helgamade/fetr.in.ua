import { useState } from 'react';
import { Plus, Edit, Trash2, Search, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ProductOption } from '@/types/store';
import { useOptions, useCreateOption, useUpdateOption, useDeleteOption } from '@/hooks/useOptions';

export function Options() {
  const { data: options = [], isLoading } = useOptions();
  const createOption = useCreateOption();
  const updateOption = useUpdateOption();
  const deleteOption = useDeleteOption();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingOption({ id: 0, code: '', name: '', price: 0, description: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (option: ProductOption) => {
    setEditingOption({ ...option });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingOption) return;

    if (!editingOption.name || editingOption.price === undefined) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі обов\'язкові поля',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      name: editingOption.name,
      price: editingOption.price,
      description: editingOption.description,
    };

    if (editingOption.id === 0) {
      createOption.mutate(data, {
        onSuccess: () => {
          toast({
            title: 'Створено',
            description: 'Опцію успішно створено',
          });
          setIsDialogOpen(false);
          setEditingOption(null);
        },
        onError: (error: Error) => {
          toast({
            title: 'Помилка',
            description: error.message || 'Не вдалося створити опцію',
            variant: 'destructive',
          });
        },
      });
    } else {
      updateOption.mutate(
        { id: editingOption.id, data },
        {
          onSuccess: () => {
            toast({
              title: 'Збережено',
              description: 'Опцію успішно оновлено',
            });
            setIsDialogOpen(false);
            setEditingOption(null);
          },
          onError: (error: Error) => {
            toast({
              title: 'Помилка',
              description: error.message || 'Не вдалося оновити опцію',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  const handleDelete = (option: ProductOption) => {
    if (!confirm(`Видалити опцію "${option.name}"?`)) return;

    deleteOption.mutate(option.id, {
      onSuccess: () => {
        toast({
          title: 'Видалено',
          description: `Опцію "${option.name}" видалено`,
          variant: 'destructive',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Помилка',
          description: error.message || 'Не вдалося видалити опцію',
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження опцій...</div>
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
                placeholder="Пошук опцій..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Додати опцію
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Options list */}
      <div className="grid gap-4">
        {filteredOptions.map((option) => (
          <Card key={option.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{option.name}</h3>
                    <span className="text-lg font-bold text-primary">+{option.price} ₴</span>
                  </div>
                  {option.description && (
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">Код: {option.code}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(option)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(option)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredOptions.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? 'Опції не знайдено' : 'Опції відсутні. Додайте першу опцію.'}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit/Create Dialog */}
      {editingOption && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingOption.id === 0 ? 'Додати опцію' : 'Редагувати опцію'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва *</Label>
                <Input
                  id="name"
                  value={editingOption.name}
                  onChange={(e) => setEditingOption({ ...editingOption, name: e.target.value })}
                  placeholder="Подарункова упаковка"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Ціна (₴) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingOption.price}
                  onChange={(e) => setEditingOption({ ...editingOption, price: parseFloat(e.target.value) || 0 })}
                  placeholder="75.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={editingOption.description || ''}
                  onChange={(e) => setEditingOption({ ...editingOption, description: e.target.value })}
                  placeholder="Красива святкова упаковка з бантом"
                  rows={3}
                />
              </div>
            </div>

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
      )}
    </div>
  );
}

