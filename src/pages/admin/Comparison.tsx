import { useState } from 'react';
import { Save, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useComparison,
  useUpdateComparisonValue,
  useCreateComparisonFeature,
  useUpdateComparisonFeature,
  useDeleteComparisonFeature,
} from '@/hooks/useComparison';
import { useQueryClient } from '@tanstack/react-query';

export function Comparison() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useComparison();
  const updateValue = useUpdateComparisonValue();
  const createFeature = useCreateComparisonFeature();
  const updateFeature = useUpdateComparisonFeature();
  const deleteFeature = useDeleteComparisonFeature();

  const [editingFeature, setEditingFeature] = useState<{ key: string; label: string; type: 'text' | 'boolean'; sortOrder: number } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({ key: '', label: '', type: 'text' as 'text' | 'boolean', sortOrder: 0 });
  
  // Local state for values that haven't been saved yet
  const [localValues, setLocalValues] = useState<Record<string, Record<number, string | boolean | null>>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження...</div>
      </div>
    );
  }

  const { features, products } = data;

  // Update local state only (no API call)
  const handleValueChange = (
    featureKey: string,
    productId: number,
    value: string | boolean | null
  ) => {
    setLocalValues(prev => ({
      ...prev,
      [featureKey]: {
        ...prev[featureKey],
        [productId]: value,
      },
    }));
  };

  // Save all changes
  const handleSaveAll = async () => {
    if (!data) return;
    
    const changes: Array<{ featureKey: string; productId: number; value: string | boolean | null; isBoolean: boolean }> = [];
    
      // Collect all changes
      Object.entries(localValues).forEach(([featureKey, productValues]) => {
        const feature = features.find(f => f.key === featureKey);
        if (!feature) return;
        
        const isBoolean = feature.type === 'boolean';
      
      Object.entries(productValues).forEach(([productIdStr, value]) => {
        const productId = parseInt(productIdStr);
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const originalValue = feature.values[product.code] ?? null;
        
        // Only save if value changed
        if (value !== originalValue) {
          changes.push({
            featureKey,
            productId,
            value,
            isBoolean,
          });
        }
      });
    });

    if (changes.length === 0) {
      toast({
        title: 'Немає змін',
        description: 'Немає незбережених змін',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Save all changes sequentially to avoid overwhelming the server
      for (const change of changes) {
        await updateValue.mutateAsync(change);
      }
      
      toast({
        title: 'Збережено',
        description: `Успішно збережено ${changes.length} ${changes.length === 1 ? 'значення' : 'значень'}`,
      });
      
      // Clear local changes after successful save
      setLocalValues({});
      
      // Refresh data from server
      await queryClient.invalidateQueries({ queryKey: ['comparison'] });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося зберегти значення',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFeature = () => {
    if (!newFeature.key || !newFeature.label) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі обов\'язкові поля',
        variant: 'destructive',
      });
      return;
    }

    createFeature.mutate(newFeature, {
      onSuccess: () => {
        toast({
          title: 'Успіх',
          description: 'Параметр додано',
        });
        setNewFeature({ key: '', label: '', type: 'text', sortOrder: 0 });
        setIsDialogOpen(false);
      },
      onError: (error: Error) => {
        toast({
          title: 'Помилка',
          description: error.message || 'Не вдалося створити параметр',
          variant: 'destructive',
        });
      },
    });
  };

  const handleEditFeature = (feature: { key: string; label: string; type: 'text' | 'boolean'; sortOrder: number }) => {
    setEditingFeature(feature);
    setIsDialogOpen(true);
  };

  const handleUpdateFeature = () => {
    if (!editingFeature) return;

    updateFeature.mutate(editingFeature, {
      onSuccess: () => {
        toast({
          title: 'Успіх',
          description: 'Параметр оновлено',
        });
        setEditingFeature(null);
        setIsDialogOpen(false);
      },
      onError: (error: Error) => {
        toast({
          title: 'Помилка',
          description: error.message || 'Не вдалося оновити параметр',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDeleteFeature = (key: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей параметр?')) return;

    deleteFeature.mutate(key, {
      onSuccess: () => {
        toast({
          title: 'Успіх',
          description: 'Параметр видалено',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Помилка',
          description: error.message || 'Не вдалося видалити параметр',
          variant: 'destructive',
        });
      },
    });
  };

  // Get feature type
  const getFeatureType = (feature: typeof features[0]): 'text' | 'boolean' => {
    return feature.type || 'text';
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(localValues).length > 0 && 
    Object.values(localValues).some(productValues => Object.keys(productValues).length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Таблиця порівняння</h2>
          <p className="text-muted-foreground">Керування параметрами порівняння товарів</p>
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <Button 
              variant="outline" 
              onClick={handleSaveAll}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Збереження...' : 'Зберегти зміни'}
            </Button>
          )}
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Додати параметр
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Параметри порівняння</CardTitle>
          <CardDescription>
            Редагуйте значення параметрів для кожного товару
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold sticky left-0 bg-background z-10 min-w-[200px]">
                    Параметр
                  </th>
                  {products.map((product) => (
                    <th key={product.id} className="text-center p-3 font-semibold min-w-[150px]">
                      {product.name}
                    </th>
                  ))}
                  <th className="p-3 w-[100px]"></th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => {
                  const isBoolean = feature.type === 'boolean';
                  return (
                    <tr key={feature.key} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="p-3 sticky left-0 bg-inherit z-10 font-medium">
                        {feature.label}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-6 w-6 p-0"
                          onClick={() => handleEditFeature(feature)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </td>
                      {products.map((product) => {
                        // Use local value if exists, otherwise use server value
                        const localValue = localValues[feature.key]?.[product.id];
                        const serverValue = feature.values[product.code] ?? null;
                        const currentValue = localValue !== undefined ? localValue : serverValue;
                        
                        // Check if this value has been changed
                        const isChanged = localValue !== undefined && localValue !== serverValue;
                        
                        return (
                          <td key={product.id} className="p-3">
                            {isBoolean ? (
                              <div className="flex justify-center">
                                <Switch
                                  checked={currentValue === true}
                                  onCheckedChange={(checked) =>
                                    handleValueChange(feature.key, product.id, checked)
                                  }
                                />
                              </div>
                            ) : (
                              <div className="relative">
                                <Input
                                  value={currentValue?.toString() || ''}
                                  onChange={(e) =>
                                    handleValueChange(feature.key, product.id, e.target.value || null)
                                  }
                                  placeholder="Введіть значення"
                                  className={`w-full ${isChanged ? 'ring-2 ring-primary' : ''}`}
                                />
                                {isChanged && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFeature(feature.key)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for create/edit feature */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? 'Редагувати параметр' : 'Додати параметр'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingFeature && (
              <div className="space-y-2">
                <Label htmlFor="key">Ключ (латиниця, без пробілів)</Label>
                <Input
                  id="key"
                  value={newFeature.key}
                  onChange={(e) => setNewFeature({ ...newFeature, key: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="colors"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="label">Назва параметра</Label>
              <Input
                id="label"
                value={editingFeature?.label || newFeature.label}
                onChange={(e) => {
                  if (editingFeature) {
                    setEditingFeature({ ...editingFeature, label: e.target.value });
                  } else {
                    setNewFeature({ ...newFeature, label: e.target.value });
                  }
                }}
                placeholder="Кількість кольорів фетру"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Тип параметра</Label>
              <Select
                value={editingFeature?.type || newFeature.type}
                onValueChange={(value: 'text' | 'boolean') => {
                  if (editingFeature) {
                    setEditingFeature({ ...editingFeature, type: value });
                  } else {
                    setNewFeature({ ...newFeature, type: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Виберіть тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Текст</SelectItem>
                  <SelectItem value="boolean">Булеве значення (Так/Ні)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Порядок сортування</Label>
              <Input
                id="sortOrder"
                type="number"
                value={editingFeature?.sortOrder ?? newFeature.sortOrder}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (editingFeature) {
                    setEditingFeature({ ...editingFeature, sortOrder: value });
                  } else {
                    setNewFeature({ ...newFeature, sortOrder: value });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setEditingFeature(null);
              setNewFeature({ key: '', label: '', type: 'text', sortOrder: 0 });
            }}>
              Скасувати
            </Button>
            <Button
              onClick={editingFeature ? handleUpdateFeature : handleCreateFeature}
            >
              {editingFeature ? 'Зберегти' : 'Додати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

