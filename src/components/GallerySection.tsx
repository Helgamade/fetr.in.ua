import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGalleries } from '@/hooks/useGalleries';
import { Gallery, GalleryImage } from '@/lib/api';

export const GallerySection: React.FC = () => {
  const { data: galleries = [], isLoading } = useGalleries(true); // Only published galleries
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const openLightbox = (gallery: Gallery, index: number) => {
    setSelectedGallery(gallery);
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedGallery(null);
    setSelectedImageIndex(null);
  };

  // Handle Esc key to close lightbox
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedGallery) {
        closeLightbox();
      }
    };

    if (selectedGallery) {
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [selectedGallery]);

  const goNext = () => {
    if (selectedGallery && selectedImageIndex !== null && selectedGallery.images) {
      setSelectedImageIndex((selectedImageIndex + 1) % selectedGallery.images.length);
    }
  };

  const goPrev = () => {
    if (selectedGallery && selectedImageIndex !== null && selectedGallery.images) {
      const images = selectedGallery.images;
      setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
    }
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
            <span className="text-sm font-medium">Натхнення</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Що можна зробити
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ось лише деякі ідеї того, що можна створити з наших наборів. Ваша фантазія — єдине обмеження!
          </p>
        </div>

        {/* Gallery grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Завантаження галереї...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryPreviews.map(({ gallery, previewImage }, index) => {
              const imageCount = gallery.images?.length || 0;
              return (
                <button
                  key={gallery.id}
                  onClick={() => openLightbox(gallery, 0)}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-2xl group',
                    index === 0 && 'md:col-span-2 md:row-span-2'
                  )}
                >
                  <img
                    src={previewImage.url}
                    alt={previewImage.title || gallery.name || `Gallery image ${index + 1}`}
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

      {/* Lightbox */}
      {selectedGallery && selectedImageIndex !== null && selectedGallery.images && (
        <div 
          className="fixed inset-0 z-50 bg-foreground/90 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => {
            // Close on click outside image
            if (e.target === e.currentTarget) {
              closeLightbox();
            }
          }}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-card/20 flex items-center justify-center hover:bg-card/40 transition-colors z-10"
          >
            <X className="w-6 h-6 text-primary-foreground" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 flex items-center justify-center hover:bg-card/40 transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6 text-primary-foreground" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 flex items-center justify-center hover:bg-card/40 transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6 text-primary-foreground" />
          </button>

          <div 
            className="max-w-4xl max-h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedGallery.images[selectedImageIndex].url}
              alt={selectedGallery.images[selectedImageIndex].title || `Gallery image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="text-center mt-4">
              {selectedGallery.images[selectedImageIndex].title && (
                <p className="text-primary-foreground font-medium text-lg">
                  {selectedGallery.images[selectedImageIndex].title}
                </p>
              )}
              {selectedGallery.images[selectedImageIndex].description && (
                <p className="text-primary-foreground/80 text-sm mt-2">
                  {selectedGallery.images[selectedImageIndex].description}
                </p>
              )}
              <p className="text-primary-foreground/60 text-sm mt-2">
                {selectedImageIndex + 1} / {selectedGallery.images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
