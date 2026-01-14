import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsAPI } from '@/lib/api';
import { ProductMaterial } from '@/types/store';

export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsAPI.getAll(),
  });
}

export function useMaterial(id: number) {
  return useQuery({
    queryKey: ['materials', id],
    queryFn: () => materialsAPI.getById(id),
    enabled: !!id,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; description?: string; image?: File }) => materialsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string; image?: File } }) =>
      materialsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => materialsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}