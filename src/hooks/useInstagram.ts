import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instagramAPI } from '@/lib/api';
import { InstagramPost } from '@/types/store';

export function useInstagramPosts(activeOnly: boolean = false) {
  return useQuery<InstagramPost[]>({
    queryKey: ['instagram', activeOnly ? 'active' : 'all'],
    queryFn: async () => {
      const url = activeOnly ? '/api/instagram?active=true' : '/api/instagram';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch Instagram posts');
      return response.json();
    },
  });
}

export function useCreateInstagramPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPost: Partial<InstagramPost>) => instagramAPI.create({
      image_url: newPost.image_url!,
      instagram_url: newPost.instagram_url!,
      likes_count: newPost.likes_count || 0,
      comments_count: newPost.comments_count || 0,
      sort_order: newPost.sort_order || 0,
      is_active: newPost.is_active !== undefined ? newPost.is_active : true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram'] });
    },
  });
}

export function useUpdateInstagramPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InstagramPost> }) =>
      instagramAPI.update(id, {
        image_url: data.image_url,
        instagram_url: data.instagram_url,
        likes_count: data.likes_count,
        comments_count: data.comments_count,
        sort_order: data.sort_order,
        is_active: data.is_active,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram'] });
    },
  });
}

export function useDeleteInstagramPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => instagramAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram'] });
    },
  });
}

export type { InstagramPost };

