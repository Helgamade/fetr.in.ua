import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faqsAPI } from '@/lib/api';

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useFAQs(publishedOnly: boolean = true) {
  return useQuery<FAQ[]>({
    queryKey: ['faqs', publishedOnly ? 'published' : 'all'],
    queryFn: () => faqsAPI.getAll(publishedOnly),
  });
}

export function useFAQ(id: number) {
  return useQuery<FAQ>({
    queryKey: ['faqs', id],
    queryFn: () => faqsAPI.getById(id),
    enabled: !!id,
  });
}

export function useCreateFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { question: string; answer: string; sort_order?: number; is_published?: boolean }) => {
      return faqsAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
}

export function useUpdateFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FAQ> }) => {
      return faqsAPI.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
}

export function useDeleteFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return faqsAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
}
