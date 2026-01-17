import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ImageLightboxItem {
  url: string;
  title?: string;
  description?: string;
}

interface ImageLightboxProps {
  isOpen: boolean;
  images: ImageLightboxItem[];
  initialIndex?: number;
  onClose: () => void;
  zIndex?: number; // Для управления z-index при вложенных модалках
}

/**
 * Универсальный компонент всплывающей галереи изображений
 * Используется для отображения полноэкранных галерей с возможностью:
 * - Навигации между изображениями (кнопки влево/вправо)
 * - Закрытия по клику на фон или кнопку X
 * - Закрытия по клавише Escape
 * - Свайпа на мобильных устройствах (влево/вправо)
 * - Отображения номера изображения (X / Total)
 * 
 * Использование:
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * const [currentIndex, setCurrentIndex] = useState(0);
 * 
 * <ImageLightbox
 *   isOpen={isOpen}
 *   images={images}
 *   initialIndex={currentIndex}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  images,
  initialIndex = 0,
  onClose,
  zIndex = 50,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  // Обновляем индекс при изменении initialIndex
  useEffect(() => {
    if (isOpen && initialIndex >= 0 && initialIndex < images.length) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex, images.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Обработка клавиатуры
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        prevImage();
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        nextImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose, nextImage, prevImage]);

  // Обработка свайпов
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.targetTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Предотвращаем прокрутку при горизонтальном свайпе
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || images.length <= 1) {
      setTouchStart(null);
      return;
    }
    
    const touch = e.changedTouches[0];
    const distanceX = touch.clientX - touchStart.x;
    const distanceY = Math.abs(touch.clientY - touchStart.y);
    
    // Проверяем, что свайп горизонтальный и достаточный
    if (Math.abs(distanceX) > distanceY && Math.abs(distanceX) > minSwipeDistance) {
      e.preventDefault();
      if (distanceX > 0) {
        // Свайп вправо - предыдущее изображение
        prevImage();
      } else {
        // Свайп влево - следующее изображение
        nextImage();
      }
    }
    
    setTouchStart(null);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-foreground/95 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Close button - z-20 чтобы быть поверх изображения */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-card/20 flex items-center justify-center hover:bg-card/40 transition-colors z-20"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Navigation buttons - z-20 чтобы быть поверх изображения */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 flex items-center justify-center hover:bg-card/40 transition-colors z-20"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 text-primary-foreground" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 flex items-center justify-center hover:bg-card/40 transition-colors z-20"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 text-primary-foreground" />
          </button>
        </>
      )}

      {/* Image container - z-10 чтобы кнопки были поверх */}
      <div
        className="max-w-7xl max-h-[90vh] mx-4 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.url}
          alt={currentImage.title || `Image ${currentIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain rounded-xl"
        />
        
        {/* Image info */}
        <div className="text-center mt-4">
          {currentImage.title && (
            <p className="text-primary-foreground font-medium text-lg">
              {currentImage.title}
            </p>
          )}
          {currentImage.description && (
            <p className="text-primary-foreground/80 text-sm mt-2">
              {currentImage.description}
            </p>
          )}
          {images.length > 1 && (
            <p className="text-primary-foreground/60 text-sm mt-2">
              {currentIndex + 1} / {images.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
