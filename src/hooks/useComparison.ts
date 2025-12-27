import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comparisonAPI, ComparisonData } from '@/lib/api';

export function useComparison() {
  return useQuery<ComparisonData>({
    queryKey: ['comparison'],
    queryFn: () => comparisonAPI.getAll(),
  });
}

export function useUpdateComparisonValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ featureKey, productId, value }: {
      featureKey: string;
      productId: number;
      value: string | boolean | null;
    }) => comparisonAPI.updateValue(featureKey, productId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
    },
  });
}

export function useCreateComparisonFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { key: string; label: string; type: 'text' | 'boolean'; sortOrder?: number }) =>
      comparisonAPI.createFeature(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
    },
  });
}

export function useUpdateComparisonFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { key: string; label: string; type: 'text' | 'boolean'; sortOrder?: number }) =>
      comparisonAPI.updateFeature(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
    },
  });
}

export function useDeleteComparisonFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => comparisonAPI.deleteFeature(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
    },
  });
}

