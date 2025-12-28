import { useState } from 'react';
import { Search, Check, X as XIcon, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
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
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function Reviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  // Get all reviews (including unapproved)
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', 'all'],
    queryFn: async () => {
      // Fetch all reviews by calling API without is_approved filter
      const response = await fetch('/api/reviews/all');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      return data.map((review: any) => ({
        ...review,
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
    },
    onError: (error: Error) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося оновити відгук',
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
                        </div>
                        {review.rating && (
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
                    {review.is_approved && (
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
    </div>
  );
}

