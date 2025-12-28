import { useState } from 'react';
import { Plus, Edit, Trash2, Search, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useFAQs, useCreateFAQ, useUpdateFAQ, useDeleteFAQ, FAQ } from '@/hooks/useFAQs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function FAQ() {
  const { toast } = useToast();
  const { data: faqs = [], isLoading } = useFAQs(false); // Получаем все, включая неопубликованные
  const createFAQ = useCreateFAQ();
  const updateFAQ = useUpdateFAQ();
  const deleteFAQ = useDeleteFAQ();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState<number | null>(null);

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingFAQ({
      id: 0,
      question: '',
      answer: '',
      sort_order: faqs.length > 0 ? Math.max(...faqs.map(f => f.sort_order)) + 1 : 0,
      is_published: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ({ ...faq });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingFAQ) return;

    if (!editingFAQ.question.trim() || !editingFAQ.answer.trim()) {
      toast({
        title: 'Помилка',
        description: 'Заповніть питання та відповідь',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        question: editingFAQ.question.trim(),
        answer: editingFAQ.answer.trim(),
        sort_order: editingFAQ.sort_order || 0,
        is_published: editingFAQ.is_published ?? true,
      };

      if (editingFAQ.id === 0) {
        await createFAQ.mutateAsync(data);
        toast({ title: 'Створено', description: 'FAQ успішно створено' });
      } else {
        await updateFAQ.mutateAsync({ id: editingFAQ.id, data });
        toast({ title: 'Оновлено', description: 'FAQ успішно оновлено' });
      }
      setIsDialogOpen(false);
      setEditingFAQ(null);
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося зберегти FAQ',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (faq: FAQ) => {
    if (!confirm(`Ви впевнені, що хочете видалити питання "${faq.question}"?`)) {
      return;
    }

    try {
      await deleteFAQ.mutateAsync(faq.id);
      toast({ title: 'Видалено', description: 'FAQ успішно видалено' });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося видалити FAQ',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublish = async (faq: FAQ) => {
    setIsPublishing(faq.id);
    try {
      await updateFAQ.mutateAsync({
        id: faq.id,
        data: { is_published: !faq.is_published },
      });
      toast({
        title: faq.is_published ? 'Знято з публікації' : 'Опубліковано',
        description: `FAQ "${faq.question}" ${faq.is_published ? 'знято з публікації' : 'опубліковано'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося змінити статус публікації',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(null);
    }
  };

  const handleMoveUp = async (faq: FAQ) => {
    const currentIndex = faqs.findIndex(f => f.id === faq.id);
    if (currentIndex <= 0) return;

    const prevFAQ = faqs[currentIndex - 1];
    const newSortOrder = prevFAQ.sort_order;
    const prevSortOrder = faq.sort_order;

    try {
      await updateFAQ.mutateAsync({ id: faq.id, data: { sort_order: newSortOrder } });
      await updateFAQ.mutateAsync({ id: prevFAQ.id, data: { sort_order: prevSortOrder } });
      toast({ title: 'Порядок оновлено', description: 'FAQ переміщено вгору' });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося змінити порядок',
        variant: 'destructive',
      });
    }
  };

  const handleMoveDown = async (faq: FAQ) => {
    const currentIndex = faqs.findIndex(f => f.id === faq.id);
    if (currentIndex >= faqs.length - 1) return;

    const nextFAQ = faqs[currentIndex + 1];
    const newSortOrder = nextFAQ.sort_order;
    const nextSortOrder = faq.sort_order;

    try {
      await updateFAQ.mutateAsync({ id: faq.id, data: { sort_order: newSortOrder } });
      await updateFAQ.mutateAsync({ id: nextFAQ.id, data: { sort_order: nextSortOrder } });
      toast({ title: 'Порядок оновлено', description: 'FAQ переміщено вниз' });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося змінити порядок',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження FAQ...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Часті питання</CardTitle>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Додати питання
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Пошук по питанню або відповіді..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, index) => (
                <Card key={faq.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {!faq.is_published && (
                              <Badge variant="secondary">Неопубліковано</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Порядок: {faq.sort_order}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{faq.answer}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveUp(faq)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleMoveDown(faq)}
                            disabled={index === filteredFAQs.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublish(faq)}
                            disabled={isPublishing === faq.id}
                          >
                            {faq.is_published ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Зняти з публікації
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Опублікувати
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(faq)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Редагувати
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(faq)}
                            disabled={deleteFAQ.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Видалити
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
                  {searchQuery ? 'FAQ не знайдено' : 'FAQ поки немає'}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog для создания/редактирования */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingFAQ?.id === 0 ? 'Додати нове питання' : 'Редагувати питання'}
            </DialogTitle>
          </DialogHeader>
          {editingFAQ && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Питання *</Label>
                <Input
                  id="question"
                  value={editingFAQ.question}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                  placeholder="Введіть питання"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Відповідь *</Label>
                <Textarea
                  id="answer"
                  value={editingFAQ.answer}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                  rows={6}
                  placeholder="Введіть відповідь"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Порядок сортування</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={editingFAQ.sort_order}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={editingFAQ.is_published ?? true}
                  onCheckedChange={(checked) => setEditingFAQ({ ...editingFAQ, is_published: checked })}
                />
                <Label htmlFor="is_published">Опубліковано</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={createFAQ.isPending || updateFAQ.isPending}>
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

