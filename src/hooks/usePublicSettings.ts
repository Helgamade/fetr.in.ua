import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from '@/lib/api';

export interface PublicSettings {
  store_name?: string;
  store_email?: string;
  store_phone?: string;
  store_address?: string;
  store_working_hours_weekdays?: string;
  store_working_hours_weekend?: string;
  free_delivery_threshold?: string | number;
}

export function usePublicSettings() {
  return useQuery<PublicSettings>({
    queryKey: ['settings', 'public'],
    queryFn: () => settingsAPI.getPublic(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

