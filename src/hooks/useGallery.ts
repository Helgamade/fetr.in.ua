import { useQuery } from '@tanstack/react-query';
import { galleryAPI } from '@/lib/api';

export interface GalleryImage {
  id: number;
  url: string;
  title: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export function useGallery() {
  return useQuery<GalleryImage[]>({
    queryKey: ['gallery'],
    queryFn: () => galleryAPI.getAll(),
  });
}

