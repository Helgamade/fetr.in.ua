import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Save, X } from 'lucide-react';
import { usePages, useCreatePage, useUpdatePage, useDeletePage, Page } from '@/hooks/usePages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RichEditor } from '@/components/RichEditor';

export function Pages() {
  const { toast } = useToast();
  const { data: pages = [], isLoading } = usePages();
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();
  
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
  });

  const filteredPages = pages.filter(page => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      page.title.toLowerCase().includes(query) ||
      page.slug.toLowerCase().includes(query) ||
      (page.meta_title && page.meta_title.toLowerCase().includes(query)) ||
      (page.meta_description && page.meta_description.toLowerCase().includes(query))
    );
  });

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      is_published: page.is_published,
    });
  };

  const handleSave = async () => {
    if (!editingPage) return;

    if (!formData.slug || !formData.title || !formData.content) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі обов\'язкові поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updatePage.mutateAsync({
        id: editingPage.id,
        ...formData,
      });
      toast({ title: 'Збережено', description: 'Сторінку успішно оновлено' });
      setEditingPage(null);
      setFormData({
        slug: '',
        title: '',
        content: '',
        meta_title: '',
        meta_description: '',
        is_published: true,
      });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося зберегти сторінку',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = async () => {
    if (!formData.slug || !formData.title || !formData.content) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі обов\'язкові поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createPage.mutateAsync(formData);
      toast({ title: 'Створено', description: 'Сторінку успішно створено' });
      setIsCreateDialogOpen(false);
      setFormData({
        slug: '',
        title: '',
        content: '',
        meta_title: '',
        meta_description: '',
        is_published: true,
      });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося створити сторінку',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`Ви впевнені, що хочете видалити сторінку "${page.title}"?`)) {
      return;
    }

    try {
      await deletePage.mutateAsync(page.id);
      toast({ title: 'Видалено', description: 'Сторінку успішно видалено' });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося видалити сторінку',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      title: '',
      content: '',
      meta_title: '',
      meta_description: '',
      is_published: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження сторінок...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Управління сторінками</CardTitle>
              <CardDescription>
                Створюйте та редагуйте індивідуальні сторінки сайту з унікальними URL та SEO мета-тегами
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Додати сторінку
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Поиск */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук по назві, URL, мета-тегах..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Список страниц */}
          <div className="space-y-4">
            {filteredPages.length > 0 ? (
              filteredPages.map((page) => (
                <Card key={page.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{page.title}</h3>
                            {page.is_published ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <Eye className="h-3 w-3 mr-1" />
                                Опубліковано
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Чернетка
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            URL: <code className="bg-muted px-1 py-0.5 rounded">/{page.slug}</code>
                          </p>
                          {page.meta_title && (
                            <p className="text-xs text-muted-foreground">
                              Meta Title: {page.meta_title}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(page)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Редагувати
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(page)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {searchQuery ? 'Сторінок не знайдено' : 'Немає сторінок. Створіть першу сторінку.'}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog для редактирования */}
      {editingPage && (
        <Dialog open={!!editingPage} onOpenChange={() => handleCancel()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редагувати сторінку</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-slug">URL (slug) *</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="polityka-konfidentsiynosti"
                />
                <p className="text-xs text-muted-foreground">
                  Використовуйте тільки латинські літери, цифри та дефіси
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-title">Назва сторінки *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Політика конфіденційності"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-meta-title">Meta Title (SEO)</Label>
                <Input
                  id="edit-meta-title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Політика конфіденційності - FetrInUA"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-meta-description">Meta Description (SEO)</Label>
                <Textarea
                  id="edit-meta-description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Опис сторінки для пошукових систем"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Зміст сторінки *</Label>
                <RichEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Введіть текст сторінки..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="edit-published">Опубліковано</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Скасувати
              </Button>
              <Button onClick={handleSave} disabled={updatePage.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Зберегти
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog для создания */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Створити нову сторінку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-slug">URL (slug) *</Label>
              <Input
                id="new-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="polityka-konfidentsiynosti"
              />
              <p className="text-xs text-muted-foreground">
                Використовуйте тільки латинські літери, цифри та дефіси
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-title">Назва сторінки *</Label>
              <Input
                id="new-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Політика конфіденційності"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-meta-title">Meta Title (SEO)</Label>
              <Input
                id="new-meta-title"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Політика конфіденційності - FetrInUA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-meta-description">Meta Description (SEO)</Label>
              <Textarea
                id="new-meta-description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Опис сторінки для пошукових систем"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-content">Зміст сторінки *</Label>
              <RichEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Введіть текст сторінки..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="new-published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
              <Label htmlFor="new-published">Опубліковано</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Скасувати
            </Button>
            <Button onClick={handleCreate} disabled={createPage.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

