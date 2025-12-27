import React from 'react';
import { Instagram, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock Instagram posts
const instagramPosts = [
  { id: '1', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', likes: 234, comments: 18 },
  { id: '2', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', likes: 189, comments: 24 },
  { id: '3', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400', likes: 312, comments: 31 },
  { id: '4', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400', likes: 156, comments: 12 },
  { id: '5', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', likes: 278, comments: 22 },
  { id: '6', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400', likes: 198, comments: 15 },
];

export const InstagramSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-peach/20 to-sage/20">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 mb-4">
            <Instagram className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-medium">Слідкуйте за нами</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            @helgamade_ua
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ідеї, натхнення та закулісся нашої майстерні в Instagram
          </p>
        </div>

        {/* Instagram grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {instagramPosts.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com/helgamade_ua"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden rounded-xl group"
            >
              <img
                src={post.image}
                alt="Instagram post"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 text-primary-foreground">
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1 text-primary-foreground">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.comments}</span>
                </div>
              </div>
            </a>
          ))}
        </div>

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
              Підписатися
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
