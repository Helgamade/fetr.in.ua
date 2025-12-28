import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '@/lib/api';

export function useSettings() {
  return useQuery<Record<string, any>>({
    queryKey: ['settings'],
    queryFn: () => settingsAPI.getAll(),
  });
}

export function useSetting(key: string) {
  return useQuery<{ key: string; value: any }>({
    queryKey: ['settings', key],
    queryFn: () => settingsAPI.getByKey(key),
    enabled: !!key,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      settingsAPI.update(key, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings', variables.key] });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Record<string, any>) =>
      settingsAPI.updateMultiple(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}


