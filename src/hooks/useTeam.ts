import { useQuery } from '@tanstack/react-query';
import { teamAPI } from '@/lib/api';
import { TeamMember } from '@/types/store';

export function useTeam() {
  return useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: () => teamAPI.getAll(),
  });
}

