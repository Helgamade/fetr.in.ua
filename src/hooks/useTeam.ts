import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamAPI } from '@/lib/api';

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  photo: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useTeam(activeOnly: boolean = false) {
  return useQuery<TeamMember[]>({
    queryKey: ['team', activeOnly ? 'active' : 'all'],
    queryFn: async () => {
      const url = activeOnly ? '/api/team?active=true' : '/api/team';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    },
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TeamMember>) => teamAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TeamMember> }) => teamAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => teamAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

