import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagesAPI } from '@/lib/api';

export interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function usePages() {
  return useQuery<Page[]>({
    queryKey: ['pages'],
    queryFn: () => pagesAPI.getAll(),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

export function usePage(slug: string) {
  return useQuery<Page>({
    queryKey: ['page', slug],
    queryFn: () => pagesAPI.getBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

// Graceful version — не повторяет запрос при 404, не бросает ошибку в boundary
export function useOptionalPage(slug: string) {
  return useQuery<Page>({
    queryKey: ['page', slug],
    queryFn: () => pagesAPI.getBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      slug: string;
      title: string;
      content: string;
      meta_title?: string;
      meta_description?: string;
      is_published?: boolean;
    }) => {
      return pagesAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<Page>) => {
      return pagesAPI.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ['page', variables.slug] });
      }
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return pagesAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });
}

