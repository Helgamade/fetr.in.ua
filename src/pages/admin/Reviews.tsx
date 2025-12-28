import { useState } from 'react';
import { Search, Check, X as XIcon, Trash2, Eye, EyeOff, Plus, Edit, Star } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Review {
  id: number;
  name: string;
  text: string;
  rating: number | null;
  photo: string | null;
  is_approved: boolean;
  featured: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function Reviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get all reviews (including unapproved)
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/reviews/all');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      return data.map((review: any) => ({
        ...review,
        is_approved: Boolean(review.is_approved),
        featured: Boolean(review.featured),
        createdAt: new Date(review.created_at || review.createdAt),
        updatedAt: new Date(review.updated_at || review.updatedAt),
      }));
    },
  });

  const updateReview = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Review> }) =>
      reviewsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: 'Оновлено',
        description: 'Відгук успішно оновлено',
      });
      setIsDialogOpen(false);
      setEditingReview(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося оновити відгук',
        variant: 'destructive',
      });
    },
  });

  const createReview = useMutation({
    mutationFn: (data: Partial<Review>) => reviewsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: 'Створено',
        description: 'Відгук успішно створено',
      });
      setIsDialogOpen(false);
      setEditingReview(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося створити відгук',
        variant: 'destructive',
      });
    },
  });

  const deleteReview = useMutation({
    mutationFn: (id: number) => reviewsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: 'Видалено',
        description: 'Відгук успішно видалено',
        variant: 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося видалити відгук',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    setEditingReview({
      id: 0,
      name: '',
      text: '',
      rating: 5,
      photo: null,
      is_approved: true,
      featured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (review: Review) => {
    setEditingReview({ ...review });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingReview) return;

    if (!editingReview.name || !editingReview.text) {
      toast({
        title: 'Помилка',
        description: 'Заповніть всі обов\'язкові поля',
        variant: 'destructive',
      });
      return;
    }

    const createdAtDate = editingReview.createdAt instanceof Date 
      ? editingReview.createdAt 
      : new Date(editingReview.createdAt);
    
    // Format date as YYYY-MM-DD HH:mm:ss in local time (not UTC)
    const year = createdAtDate.getFullYear();
    const month = String(createdAtDate.getMonth() + 1).padStart(2, '0');
    const day = String(createdAtDate.getDate()).padStart(2, '0');
    const hours = String(createdAtDate.getHours()).padStart(2, '0');
    const minutes = String(createdAtDate.getMinutes()).padStart(2, '0');
    const seconds = String(createdAtDate.getSeconds()).padStart(2, '0');
    const localDateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
    const data = {
      name: editingReview.name,
      text: editingReview.text,
      rating: editingReview.rating,
      photo: editingReview.photo,
      is_approved: editingReview.is_approved,
      featured: editingReview.featured,
      created_at: localDateTimeString,
    };

    if (editingReview.id === 0) {
      createReview.mutate(data);
    } else {
      updateReview.mutate({ id: editingReview.id, data });
    }
  };

  const handleApprove = (review: Review) => {
    updateReview.mutate({
      id: review.id,
      data: { ...review, is_approved: true },
    });
  };

  const handleReject = (review: Review) => {
    updateReview.mutate({
      id: review.id,
      data: { ...review, is_approved: false },
    });
  };

  const handleDelete = (review: Review) => {
    if (!confirm(`Ви впевнені, що хочете видалити відгук від "${review.name}"?`)) return;
    deleteReview.mutate(review.id);
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.text.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && review.is_approved) ||
      (statusFilter === 'pending' && !review.is_approved);
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження відгуків...</div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук відгуків..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Додати відгук
            </Button>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                Всі
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
              >
                <Check className="h-4 w-4 mr-2" />
                Опубліковані
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                На модерації
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary">{review.name[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{review.name}</span>
                          {!review.is_approved && (
                            <Badge variant="secondary">На модерації</Badge>
                          )}
                          {review.featured && (
                            <Badge variant="default">На головній</Badge>
                          )}
                        </div>
                        {review.rating && review.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'w-4 h-4',
                                  i < review.rating!
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-muted-foreground'
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-3 mb-2 whitespace-pre-wrap">{review.text}</p>
                    <p className="text-sm text-muted-foreground/60">
                      {new Date(review.createdAt).toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(review)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Редагувати
                    </Button>
                    {!review.is_approved && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(review)}
                        disabled={updateReview.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Опублікувати
                      </Button>
                    )}
                    {!!review.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(review)}
                        disabled={updateReview.isPending}
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Зняти з публікації
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(review)}
                      disabled={deleteReview.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Видалити
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Відгуків не знайдено
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingReview?.id === 0 ? 'Додати новий відгук' : 'Редагувати відгук'}
            </DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ім'я *</Label>
                <Input
                  id="name"
                  value={editingReview.name}
                  onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })}
                  placeholder="Олена"
                />
              </div>

              <div className="space-y-2">
                <Label>Оцінка</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setEditingReview({ ...editingReview, rating })}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 transition-colors',
                          rating <= (editingReview.rating || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground hover:text-yellow-400/50'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text">Текст відгуку *</Label>
                <Textarea
                  id="text"
                  value={editingReview.text}
                  onChange={(e) => setEditingReview({ ...editingReview, text: e.target.value })}
                  placeholder="Розкажіть про ваш досвід..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <DateTimePicker
                  label="Дата створення"
                  value={editingReview.createdAt instanceof Date 
                    ? editingReview.createdAt 
                    : new Date(editingReview.createdAt)}
                  onChange={(date) => {
                    setEditingReview({ ...editingReview, createdAt: date || new Date() });
                  }}
                  id="created_at"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Фото (URL)</Label>
                <Input
                  id="photo"
                  value={editingReview.photo || ''}
                  onChange={(e) => setEditingReview({ ...editingReview, photo: e.target.value || null })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_approved"
                  checked={editingReview.is_approved}
                  onCheckedChange={(checked) => setEditingReview({ ...editingReview, is_approved: checked })}
                />
                <Label htmlFor="is_approved">Опубліковано</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={editingReview.featured}
                  onCheckedChange={(checked) => setEditingReview({ ...editingReview, featured: checked })}
                />
                <Label htmlFor="featured">Показувати на головній (максимум 4)</Label>
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
