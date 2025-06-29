import { logger } from '@/utils/logger';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateTeam } from '@/hooks/useCreateTeam';

const teamSchema = z.object({
  name: z.string().min(1, 'Teamnavn er påkrevd'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Klient er påkrevd'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface UseCreateTeamFormProps {
  onOpenChange: (open: boolean) => void;
  onTeamCreated: () => void;
}

export const useCreateTeamForm = ({ onOpenChange, onTeamCreated }: UseCreateTeamFormProps) => {
  const createTeamMutation = useCreateTeam();

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      description: '',
      clientId: '',
      startDate: '',
      endDate: '',
    },
  });

  const onSubmit = async (data: TeamFormData) => {
    try {
      await createTeamMutation.mutateAsync({
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      });
      
      form.reset();
      onOpenChange(false);
      onTeamCreated();
    } catch (error) {
      logger.error('Error creating team:', error);
    }
  };

  return { form, onSubmit, isPending: createTeamMutation.isPending };
};
