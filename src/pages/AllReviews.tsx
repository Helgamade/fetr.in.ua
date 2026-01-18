import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { SocialProof } from '@/components/SocialProof';
import { ChatWidget } from '@/components/ChatWidget';
import { StickyMobileCTA } from '@/components/StickyMobileCTA';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, MessageSquarePlus, X, Send, Quote } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sanitizeName, sanitizeString, validateRating } from '@/utils/sanitize';
import { formatRelativeTime } from '@/utils/dateFormat';
import { reviewsAPI } from '@/lib/api';
import { Review } from '@/types/store';

export default function AllReviews() {
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', text: '', rating: 5 });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reviews-all', ratingFilter, sortBy],
    queryFn: () => reviewsAPI.getAllWithFilters({
      rating: ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
      sort: sortBy
    }),
  });

  const reviews = data?.reviews || [];
  const stats = data?.stats || { total: 0, averageRating: 0, byRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedName = sanitizeName(formData.name.trim());
    const sanitizedText = sanitizeString(formData.text.trim(), 2000);
    const validatedRating = validateRating(formData.rating);

    if (!sanitizedName || sanitizedName.length < 2) {
      toast.error('Помилка', {
        description: 'Ім\'я має містити мінімум 2 символи (тільки літери)',
      });
      return;
    }

    if (!sanitizedText || sanitizedText.length < 10) {
      toast.error('Помилка', {
        description: 'Текст відгуку має містити мінімум 10 символів',
      });
      return;
    }

    try {
      await reviewsAPI.create({
        name: sanitizedName,
        text: sanitizedText,
        rating: validatedRating,
        is_approved: false,
      });
      
      toast.success('Дякуємо за відгук!', {
        description: 'Ваш відгук буде опублікований після модерації',
      });
      setIsModalOpen(false);
      setFormData({ name: '', text: '', rating: 5 });
      refetch();
    } catch (error: any) {
      toast.error('Помилка', {
        description: error.message || 'Не вдалося відправити відгук. Спробуйте пізніше.',
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Відгуки - Fetr.in.ua</title>
        <meta name="description" content="Відгуки наших клієнтів про товари з фетру" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-24 pb-20">
          <section className="py-20 bg-peach/30">
            <div className="container-tight">
              {/* Section header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground mb-4">
                  <Quote className="w-4 h-4" />
                  <span className="text-sm font-medium">Відгуки клієнтів</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
                  Відгуки
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Що кажуть наші клієнти про наші товари
                </p>
              </div>

              {/* Statistics Block */}
              {stats.total > 0 && (
                <div className="glass-card p-6 mb-12">
                  <div className="mb-6">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                      Оцінка користувачів {stats.averageRating.toFixed(2)}/5
                    </h2>
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-accent fill-accent" />
                      <span className="text-muted-foreground">на основі {stats.total} {stats.total === 1 ? 'відгук' : stats.total < 5 ? 'відгуки' : 'відгуків'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = stats.byRating[rating as keyof typeof stats.byRating] || 0;
                      const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="w-12 text-sm font-medium">{rating} зірок</div>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="w-8 text-sm text-muted-foreground text-right">{count}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center">
                    <Button variant="hero" onClick={() => setIsModalOpen(true)}>
                      <MessageSquarePlus className="w-5 h-5 mr-2" />
                      Написати відгук
                    </Button>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Фільтр по рейтингу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі оцінки</SelectItem>
                    <SelectItem value="5">5 зірок</SelectItem>
                    <SelectItem value="4">4 зірки</SelectItem>
                    <SelectItem value="3">3 зірки</SelectItem>
                    <SelectItem value="2">2 зірки</SelectItem>
                    <SelectItem value="1">1 зірка</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Сортування" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Спочатку нові</SelectItem>
                    <SelectItem value="oldest">Спочатку старі</SelectItem>
                    <SelectItem value="rating_high">За рейтингом (високий)</SelectItem>
                    <SelectItem value="rating_low">За рейтингом (низький)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reviews grid */}
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Завантаження...
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Відгуків не знайдено
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {reviews.map((review: Review, index: number) => (
                    <div
                      key={review.id}
                      className="glass-card p-6 hover-lift animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-primary">{review.name[0]}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-heading font-bold">{review.name}</span>
                            {review.rating && review.rating > 0 && (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      'w-4 h-4',
                                      i < review.rating! ? 'text-accent fill-accent' : 'text-muted'
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground">{review.text}</p>
                          <p className="text-sm text-muted-foreground/60 mt-2">
                            {formatRelativeTime(review.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
        
        <Footer />
        <CartDrawer />
        <SocialProof />
        <ChatWidget />
        <StickyMobileCTA />
      </div>

      {/* Review modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card rounded-2xl p-6 animate-scale-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-heading font-bold mb-4">Залишити відгук</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ваше ім'я</label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const sanitized = sanitizeName(e.target.value);
                    setFormData({ ...formData, name: sanitized });
                  }}
                  placeholder="Олена"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Оцінка</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating })}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 transition-colors',
                          rating <= formData.rating
                            ? 'text-accent fill-accent'
                            : 'text-muted hover:text-accent/50'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ваш відгук</label>
                <Textarea
                  value={formData.text}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (value.length > 2000) {
                      value = value.substring(0, 2000);
                    }
                    setFormData({ ...formData, text: value });
                  }}
                  placeholder="Розкажіть про ваш досвід..."
                  rows={4}
                  required
                  maxLength={2000}
                />
              </div>

              <Button type="submit" variant="hero" className="w-full">
                <Send className="w-4 h-4" />
                Надіслати відгук
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
