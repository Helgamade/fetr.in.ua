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
    mutationFn: ({ featureKey, productId, value, isBoolean }: {
      featureKey: string;
      productId: number;
      value: string | boolean | null;
      isBoolean: boolean;
    }) => comparisonAPI.updateValue(featureKey, productId, value, isBoolean),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
    },
  });
}

export function useCreateComparisonFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, label, sortOrder }: { key: string; label: string; sortOrder?: number }) =>
      comparisonAPI.createFeature(key, label, sortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
    },
  });
}

export function useUpdateComparisonFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, label, sortOrder }: { key: string; label: string; sortOrder?: number }) =>
      comparisonAPI.updateFeature(key, label, sortOrder),
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

