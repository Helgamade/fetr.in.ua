import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galleriesAPI, Gallery, GalleryImage } from '@/lib/api';

export function useGalleries(publishedOnly: boolean = false) {
  return useQuery<Gallery[]>({
    queryKey: ['galleries', publishedOnly],
    queryFn: () => galleriesAPI.getAll(publishedOnly),
  });
}

export function useGallery(id: number, publishedOnly: boolean = false) {
  return useQuery<Gallery>({
    queryKey: ['galleries', id, publishedOnly],
    queryFn: () => galleriesAPI.getById(id, publishedOnly),
    enabled: !!id,
  });
}

export function useCreateGallery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; sort_order?: number; is_published?: boolean }) => 
      galleriesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
    },
  });
}

export function useUpdateGallery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; sort_order?: number; is_published?: boolean } }) =>
      galleriesAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['galleries', variables.id] });
    },
  });
}

export function useDeleteGallery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => galleriesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
    },
  });
}

export function useUploadGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ galleryId, file, title, description, sortOrder }: { 
      galleryId: number; 
      file: File; 
      title?: string; 
      description?: string; 
      sortOrder?: number;
    }) => galleriesAPI.uploadImage(galleryId, file, title, description, sortOrder),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['galleries', variables.galleryId] });
    },
  });
}

export function useUpdateGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ galleryId, imageId, data }: { 
      galleryId: number; 
      imageId: number; 
      data: { title?: string; description?: string; sort_order?: number; is_published?: boolean };
    }) => galleriesAPI.updateImage(galleryId, imageId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['galleries', variables.galleryId] });
    },
  });
}

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ galleryId, imageId }: { galleryId: number; imageId: number }) => 
      galleriesAPI.deleteImage(galleryId, imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['galleries'] });
      queryClient.invalidateQueries({ queryKey: ['galleries', variables.galleryId] });
    },
  });
}

