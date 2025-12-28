import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useReviews, useCreateReview } from '@/hooks/useReviews';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquarePlus, X, Send, Quote } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sanitizeName, sanitizeString, validateRating } from '@/utils/sanitize';
import { formatRelativeTime } from '@/utils/dateFormat';
import { useTranslation } from '@/hooks/useTranslation';

export const ReviewsSection: React.FC = () => {
  const { t } = useTranslation('reviews');
  const { data: reviews = [], isLoading } = useReviews();
  const createReview = useCreateReview();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', text: '', rating: 5 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation and sanitization
    const sanitizedName = sanitizeName(formData.name.trim());
    const sanitizedText = sanitizeString(formData.text.trim(), 2000);
    const validatedRating = validateRating(formData.rating);

    // Validate
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

    createReview.mutate(
      {
        name: sanitizedName,
        text: sanitizedText,
        rating: validatedRating,
        is_approved: false,
      },
      {
        onSuccess: () => {
          toast.success('Дякуємо за відгук!', {
            description: 'Ваш відгук буде опублікований після модерації',
          });
          setIsModalOpen(false);
          setFormData({ name: '', text: '', rating: 5 });
        },
        onError: (error: Error) => {
          toast.error('Помилка', {
            description: error.message || 'Не вдалося відправити відгук. Спробуйте пізніше.',
          });
        },
      }
    );
  };

  return (
    <section id="reviews" className="py-20 bg-peach/30">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground mb-4">
            <Quote className="w-4 h-4" />
            <span className="text-sm font-medium">{t('badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t('subtitle')}
          </p>

          {/* Add review button */}
          <div className="text-center">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" 
              onClick={() => setIsModalOpen(true)}
            >
              <MessageSquarePlus className="w-5 h-5 mr-2" />
              {t('add_button') || '+ Додати відгук'}
            </Button>
          </div>
        </div>

        {/* Reviews grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground mb-8">
            {t('loading')}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {reviews.map((review, index) => (
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

        {/* Statistics */}
        {reviews.length > 0 && (() => {
          const approvedReviews = reviews.filter(r => r.isApproved !== false);
          const averageRating = approvedReviews.length > 0
            ? approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / approvedReviews.length
            : 0;
          const satisfiedCount = approvedReviews.filter(r => (r.rating || 0) >= 4).length;
          const satisfiedPercent = approvedReviews.length > 0
            ? Math.round((satisfiedCount / approvedReviews.length) * 100)
            : 0;
          const reviewsCount = approvedReviews.length;

          return (
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{averageRating.toFixed(1)}</div>
                <div className="flex gap-0.5 justify-center my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        i < Math.round(averageRating) ? 'text-warning fill-warning' : 'text-muted'
                      )}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">{t('stats.average_rating') || 'Середня оцінка'}</div>
              </div>

              {/* Reviews Count */}
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{reviewsCount}{reviewsCount >= 500 ? '+' : ''}</div>
                <div className="text-sm text-muted-foreground">{t('stats.reviews_count') || 'Відгуків'}</div>
              </div>

              {/* Satisfied Clients */}
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">{satisfiedPercent}%</div>
                <div className="text-sm text-muted-foreground">{t('stats.satisfied_clients') || 'Задоволених клієнтів'}</div>
              </div>
            </div>
          );
        })()}
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
                    // Sanitize on input to prevent dangerous characters
                    const sanitized = sanitizeName(e.target.value);
                    setFormData({ ...formData, name: sanitized });
                  }}
                  placeholder="Олена"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Мінімум 2 символи, тільки літери, пробіли, дефіси та апострофи
                </p>
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
                    // Limit length and remove HTML
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
                <p className="text-xs text-muted-foreground mt-1">
                  Мінімум 10 символів, максимум 2000 символів ({formData.text.length}/2000)
                </p>
              </div>

              <Button type="submit" variant="hero" className="w-full">
                <Send className="w-4 h-4" />
                Надіслати відгук
              </Button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
