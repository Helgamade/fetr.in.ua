import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsAPI } from '@/lib/api';
import { Review } from '@/types/store';

export function useReviews() {
  return useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: () => reviewsAPI.getAll(),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Review>) => reviewsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}


