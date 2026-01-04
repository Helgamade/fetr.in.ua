import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePages, useUpdatePage, useDeletePage, Page } from '@/hooks/usePages';
import { useToast } from '@/hooks/use-toast';
import { RichEditor } from '@/components/RichEditor';
import { pagesAPI } from '@/lib/api';

export function PageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    meta_title: '',
    meta_description: '',
    is_published: true,
  });

  useEffect(() => {
    if (id) {
      if (id === 'new') {
        // Новая страница
        setPage(null);
        setFormData({
          slug: '',
          title: '',
          content: '',
          meta_title: '',
          meta_description: '',
          is_published: true,
        });
        setIsLoading(false);
      } else {
        // Загрузка существующей страницы
        pagesAPI.getAll()
          .then((pages) => {
            const foundPage = pages.find((p: Page) => p.id === parseInt(id));
            if (foundPage) {
              setPage(foundPage);
              setFormData({
                slug: foundPage.slug,
                title: foundPage.title,
                content: foundPage.content,
                meta_title: foundPage.meta_title || '',
                meta_description: foundPage.meta_description || '',
                is_published: foundPage.is_published,
              });
            } else {
              toast({
                title: 'Помилка',
                description: 'Сторінку не знайдено',
                variant: 'destructive',
              });
              navigate('/admin/pages');
            }
          })
          .catch((error) => {
            toast({
              title: 'Помилка',
              description: error.message || 'Не вдалося завантажити сторінку',
              variant: 'destructive',
            });
            navigate('/admin/pages');
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!formData.slug || !formData.title || !formData.content) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі обов\'язкові поля',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (id === 'new') {
        // Создание новой страницы
        const result = await pagesAPI.create(formData);
        toast({ title: 'Створено', description: 'Сторінку успішно створено' });
        navigate(`/admin/pages/${result.id}`);
      } else if (page) {
        // Обновление существующей страницы
        await updatePage.mutateAsync({
          id: page.id,
          ...formData,
        });
        toast({ title: 'Збережено', description: 'Сторінку успішно оновлено' });
        // Обновляем локальное состояние
        setPage({ ...page, ...formData });
      }
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося зберегти сторінку',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!page || !confirm(`Ви впевнені, що хочете видалити сторінку "${page.title}"?`)) {
      return;
    }

    try {
      await deletePage.mutateAsync(page.id);
      toast({ title: 'Видалено', description: 'Сторінку успішно видалено' });
      navigate('/admin/pages');
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося видалити сторінку',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження сторінки...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/pages')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {id === 'new' ? 'Створити нову сторінку' : `Редагувати: ${page?.title || ''}`}
            </h1>
            {page && (
              <p className="text-sm text-muted-foreground mt-1">
                URL: <code className="bg-muted px-1 py-0.5 rounded">/{page.slug}</code>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {page && (
            <>
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
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deletePage.isPending}
              >
                Видалити
              </Button>
            </>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || updatePage.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Зберегти
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Основна інформація</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">URL (slug) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="polityka-konfidentsiynosti"
              />
              <p className="text-xs text-muted-foreground">
                Використовуйте тільки латинські літери, цифри та дефіси
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Назва сторінки *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Політика конфіденційності"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
              <Label htmlFor="published">Опубліковано</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO налаштування</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta-title">Meta Title (SEO)</Label>
              <Input
                id="meta-title"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Політика конфіденційності - FetrInUA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta Description (SEO)</Label>
              <Textarea
                id="meta-description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Опис сторінки для пошукових систем"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Зміст сторінки *</CardTitle>
          </CardHeader>
          <CardContent>
            <RichEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Введіть текст сторінки..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

