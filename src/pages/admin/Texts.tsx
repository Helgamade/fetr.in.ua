import { useState } from 'react';
import { Save, Plus, Trash2, Search } from 'lucide-react';
import { useTexts, useUpdateText, useCreateText, useDeleteText, SiteText } from '@/hooks/useTexts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export function Texts() {
  const { toast } = useToast();
  const { data: texts = [], isLoading } = useTexts();
  const updateText = useUpdateText();
  const createText = useCreateText();
  const deleteText = useDeleteText();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedValue, setEditedValue] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newText, setNewText] = useState({ key: '', value: '', namespace: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтруем тексты по поисковому запросу
  const filteredTexts = texts.filter(text => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      text.key.toLowerCase().includes(query) ||
      text.value.toLowerCase().includes(query) ||
      text.namespace.toLowerCase().includes(query) ||
      (text.description && text.description.toLowerCase().includes(query))
    );
  });

  // Группируем по namespace (только для отфильтрованных текстов)
  const namespaces = Array.from(new Set(filteredTexts.map(t => t.namespace))).sort();

  const handleEdit = (text: SiteText) => {
    setEditingId(text.id);
    setEditedValue(text.value);
    setEditedDescription(text.description || '');
  };

  const handleSave = async (text: SiteText) => {
    try {
      await updateText.mutateAsync({
        id: text.id,
        value: editedValue,
        description: editedDescription,
      });
      toast({ title: 'Збережено', description: 'Текст успішно оновлено' });
      setEditingId(null);
    } catch (error: any) {
      toast({ 
        title: 'Помилка', 
        description: error.message || 'Не вдалося зберегти текст',
        variant: 'destructive' 
      });
    }
  };

  const handleCreate = async () => {
    if (!newText.key || !newText.value || !newText.namespace) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі обов\'язкові поля',
        variant: 'destructive'
      });
      return;
    }

    // Проверка формата ключа
    if (!newText.key.includes('.')) {
      toast({
        title: 'Помилка',
        description: 'Ключ повинен бути у форматі: namespace.key (наприклад, nav.home)',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createText.mutateAsync({
        key: newText.key,
        value: newText.value,
        namespace: newText.namespace,
        description: newText.description,
      });
      toast({ title: 'Створено', description: 'Текст успішно створено' });
      setIsCreateDialogOpen(false);
      setNewText({ key: '', value: '', namespace: '', description: '' });
    } catch (error: any) {
      toast({ 
        title: 'Помилка', 
        description: error.message || 'Не вдалося створити текст',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (text: SiteText) => {
    if (!confirm(`Ви впевнені, що хочете видалити текст "${text.key}"?`)) {
      return;
    }

    try {
      await deleteText.mutateAsync(text.id);
      toast({ title: 'Видалено', description: 'Текст успішно видалено' });
    } catch (error: any) {
      toast({ 
        title: 'Помилка', 
        description: error.message || 'Не вдалося видалити текст',
        variant: 'destructive' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження текстів...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управління текстами сайту</CardTitle>
              <CardDescription>
                Всі тексти організовані по namespace для легкого переходу на i18next.
                Формат ключів: namespace.key (наприклад, nav.home)
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Додати текст
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Поиск */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук по ключу, значенню, namespace або опису..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Знайдено текстів: {filteredTexts.length}
              </p>
            )}
          </div>

          {searchQuery ? (
            // Режим поиска - показываем все результаты сразу
            <div className="space-y-4">
              {filteredTexts.length > 0 ? (
                filteredTexts.map((text) => (
                  <Card key={text.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Label className="text-xs text-muted-foreground">Namespace</Label>
                              <span className="text-xs font-semibold px-2 py-1 bg-secondary rounded">{text.namespace}</span>
                            </div>
                            <Label className="text-xs text-muted-foreground">Ключ</Label>
                            <p className="font-mono text-sm font-semibold">{text.key}</p>
                          </div>
                          {editingId !== text.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(text)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        {editingId === text.id ? (
                          <>
                            <div className="space-y-2">
                              <Label>Текст</Label>
                              <Textarea
                                value={editedValue}
                                onChange={(e) => setEditedValue(e.target.value)}
                                rows={4}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Опис (для справки)</Label>
                              <Input
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                placeholder="Де використовується цей текст"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleSave(text)}
                                size="sm"
                                disabled={updateText.isPending}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Зберегти
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditingId(null)}
                              >
                                Скасувати
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <Label>Текст</Label>
                              <p className="text-sm mt-1 whitespace-pre-wrap">{text.value}</p>
                            </div>
                            
                            {text.description && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Опис</Label>
                                <p className="text-xs text-muted-foreground mt-1">{text.description}</p>
                              </div>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEdit(text)}
                            >
                              Редагувати
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Текстів не знайдено
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Обычный режим - группировка по namespace
            <Tabs defaultValue={namespaces[0] || ''}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(namespaces.length, 5)}, 1fr)` }}>
                {namespaces.map(ns => (
                  <TabsTrigger key={ns} value={ns}>
                    {ns}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {namespaces.map(namespace => (
                <TabsContent key={namespace} value={namespace} className="space-y-4 mt-4">
                  {filteredTexts
                    .filter(t => t.namespace === namespace)
                    .map(text => (
                      <Card key={text.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Ключ</Label>
                                <p className="font-mono text-sm font-semibold">{text.key}</p>
                              </div>
                              {editingId !== text.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(text)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            {editingId === text.id ? (
                              <>
                                <div className="space-y-2">
                                  <Label>Текст</Label>
                                  <Textarea
                                    value={editedValue}
                                    onChange={(e) => setEditedValue(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Опис (для справки)</Label>
                                  <Input
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    placeholder="Де використовується цей текст"
                                  />
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => handleSave(text)}
                                    size="sm"
                                    disabled={updateText.isPending}
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Зберегти
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Скасувати
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <Label>Текст</Label>
                                  <p className="text-sm mt-1 whitespace-pre-wrap">{text.value}</p>
                                </div>
                                
                                {text.description && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Опис</Label>
                                    <p className="text-xs text-muted-foreground mt-1">{text.description}</p>
                                  </div>
                                )}
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEdit(text)}
                                >
                                  Редагувати
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  
                  {filteredTexts.filter(t => t.namespace === namespace).length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        Немає текстів у цьому namespace
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialog для создания нового текста */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Додати новий текст</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-key">Ключ * (формат: namespace.key)</Label>
              <Input
                id="new-key"
                value={newText.key}
                onChange={(e) => {
                  const key = e.target.value;
                  setNewText({ 
                    ...newText, 
                    key,
                    namespace: key.includes('.') ? key.split('.')[0] : newText.namespace
                  });
                }}
                placeholder="nav.home"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-namespace">Namespace *</Label>
              <Input
                id="new-namespace"
                value={newText.namespace}
                onChange={(e) => setNewText({ ...newText, namespace: e.target.value })}
                placeholder="nav"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-value">Текст *</Label>
              <Textarea
                id="new-value"
                value={newText.value}
                onChange={(e) => setNewText({ ...newText, value: e.target.value })}
                rows={4}
                placeholder="Текст для відображення"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-description">Опис</Label>
              <Input
                id="new-description"
                value={newText.description}
                onChange={(e) => setNewText({ ...newText, description: e.target.value })}
                placeholder="Де використовується цей текст"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleCreate} disabled={createText.isPending}>
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
