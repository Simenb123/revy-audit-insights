
import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useClientTeams } from '@/hooks/useClientTeams';
import { useDepartments } from '@/hooks/useDepartments';
import { ClientTeam } from '@/types/organization';

export const useTeamManagement = () => {
  const { data: userProfile } = useUserProfile();
  const { data: teams = [], isLoading, refetch } = useClientTeams();
  const { data: departments = [] } = useDepartments();
  const [selectedTeam, setSelectedTeam] = useState<ClientTeam | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const canCreateTeams = userProfile?.userRole === 'admin' || userProfile?.userRole === 'partner' || userProfile?.userRole === 'manager';

  return {
    teams,
    isLoading,
    departments,
    selectedTeam,
    setSelectedTeam,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    canCreateTeams,
    refetchTeams: refetch,
  };
};
