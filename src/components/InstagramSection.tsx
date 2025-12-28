import React from 'react';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstagramPosts } from '@/hooks/useInstagram';
import { useTranslation } from '@/hooks/useTranslation';

export const InstagramSection: React.FC = () => {
  const { t } = useTranslation('instagram');
  const { data: instagramPosts = [], isLoading } = useInstagramPosts(true);
  
  // Limit to 6 posts
  const displayedPosts = instagramPosts.slice(0, 6);

  return (
    <section className="py-20 bg-gradient-to-b from-peach/20 to-sage/20">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 mb-4">
            <Instagram className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-medium">{t('badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Instagram grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('loading')}
          </div>
        ) : displayedPosts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {displayedPosts.map((post) => (
              <a
                key={post.id}
                href={post.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-xl group"
              >
                <img
                  src={post.image_url}
                  alt="Instagram post"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1 text-primary-foreground">
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">{post.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary-foreground">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{post.comments_count}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : null}

        {/* CTA */}
        <div className="text-center">
          <Button
            variant="hero"
            size="lg"
            asChild
          >
            <a
              href="https://instagram.com/helgamade_ua"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="w-5 h-5" />
              {t('button')}
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
