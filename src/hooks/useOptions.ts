import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optionsAPI } from '@/lib/api';
import { ProductOption } from '@/types/store';

export function useOptions() {
  return useQuery({
    queryKey: ['options'],
    queryFn: () => optionsAPI.getAll(),
  });
}

export function useOption(id: number) {
  return useQuery({
    queryKey: ['options', id],
    queryFn: () => optionsAPI.getById(id),
    enabled: !!id,
  });
}

export function useCreateOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; price: number; description?: string }) => optionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['options'] });
    },
  });
}

export function useUpdateOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; price: number; description?: string } }) =>
      optionsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['options'] });
    },
  });
}

export function useDeleteOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => optionsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['options'] });
    },
  });
}


