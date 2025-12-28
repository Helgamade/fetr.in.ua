import { useQuery } from '@tanstack/react-query';
import { faqsAPI } from '@/lib/api';
import { FAQ } from '@/types/store';

export function useFAQs() {
  return useQuery<FAQ[]>({
    queryKey: ['faqs'],
    queryFn: () => faqsAPI.getAll(),
  });
}


