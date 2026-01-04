import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { usePages, useDeletePage, Page } from '@/hooks/usePages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function Pages() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: pages = [], isLoading } = usePages();
  const deletePage = useDeletePage();
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDelete = async (page: Page, e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем переход на страницу редактирования
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
            <Button onClick={() => navigate('/admin/pages/new')}>
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
                <Card 
                  key={page.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/admin/pages/${page.id}`)}
                >
                  <CardContent className="pt-6">
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
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/pages/${page.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Редагувати
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(page, e)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}
