import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface SiteText {
  id: number;
  key: string;
  value: string;
  namespace: string;
  description?: string;
}

export function useTexts() {
  return useQuery<SiteText[]>({
    queryKey: ['siteTexts'],
    queryFn: async () => {
      const response = await fetch('/api/texts');
      if (!response.ok) throw new Error('Failed to fetch texts');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

export function useUpdateText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value, description }: { id: number; value: string; description?: string }) => {
      const response = await fetch(`/api/texts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, description }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update text');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteTexts'] });
    },
  });
}

export function useCreateText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value, namespace, description }: { key: string; value: string; namespace: string; description?: string }) => {
      const response = await fetch('/api/texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, namespace, description }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create text');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteTexts'] });
    },
  });
}

export function useDeleteText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/texts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete text');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteTexts'] });
    },
  });
}









