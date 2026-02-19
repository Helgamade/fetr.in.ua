import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { useGalleries } from '@/hooks/useGalleries';
import { Gallery } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { ImageLightbox, ImageLightboxItem } from '@/components/ImageLightbox';

export const GallerySection: React.FC = () => {
  const { t } = useTranslation('gallery');
  const { data: galleries = [], isLoading } = useGalleries(true); // Only published galleries
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (gallery: Gallery, index: number) => {
    setSelectedGallery(gallery);
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    // Сохраняем gallery и index для правильной работы ImageLightbox
    // Очистим их после закрытия анимации
    setTimeout(() => {
      setSelectedGallery(null);
      setSelectedImageIndex(null);
    }, 300);
  };

  // Get first image from each gallery (limit to 6 galleries)
  const galleryPreviews = galleries
    .filter(gallery => gallery.images && gallery.images.length > 0)
    .slice(0, 6)
    .map(gallery => ({
      gallery,
      previewImage: gallery.images![0],
    }));

  return (
    <section id="gallery" className="py-20">
      <div className="container-tight">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary mb-4">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">{t('badge')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Gallery grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('loading')}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryPreviews.map(({ gallery, previewImage }, index) => {
              const imageCount = gallery.images?.length || 0;
              return (
                <button
                  key={gallery.id}
                  onClick={() => openLightbox(gallery, 0)}
                  className="relative aspect-square overflow-hidden rounded-2xl group"
                >
                  <img
                    src={previewImage.url}
                    alt={previewImage.title || gallery.name || `Gallery image ${index + 1}`}
                    loading="lazy"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Gallery name overlay - always visible on all images */}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent flex items-end p-4">
                    <span className="text-primary-foreground font-medium">{gallery.name}</span>
                  </div>
                  {/* Image count badge */}
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    {imageCount} фото
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox - используем универсальный компонент ImageLightbox */}
      {selectedGallery && selectedImageIndex !== null && selectedGallery.images && (
        <ImageLightbox
          isOpen={isLightboxOpen}
          images={selectedGallery.images.map(img => ({
            url: img.url,
            title: img.title || undefined,
            description: img.description || undefined,
          }))}
          initialIndex={selectedImageIndex}
          onClose={closeLightbox}
          zIndex={50}
        />
      )}
    </section>
  );
};
