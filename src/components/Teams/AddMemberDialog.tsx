import { logger } from '@/utils/logger';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddTeamMember } from '@/hooks/useAddTeamMember';
import { useEmployees } from '@/hooks/useEmployees';

const memberSchema = z.object({
  userId: z.string().min(1, 'Ansatt er påkrevd'),
  role: z.string().min(1, 'Rolle er påkrevd'),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onMemberAdded: () => void;
}

const AddMemberDialog = ({ open, onOpenChange, teamId, onMemberAdded }: AddMemberDialogProps) => {
  const addMemberMutation = useAddTeamMember();
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees();

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      userId: '',
      role: 'member',
    },
  });

  const onSubmit = async (data: MemberFormData) => {
    try {
      await addMemberMutation.mutateAsync({
        teamId,
        userId: data.userId,
        role: data.role,
      });
      
      form.reset();
      onOpenChange(false);
      onMemberAdded();
    } catch (error) {
      logger.error('Error adding team member:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til teammedlem</DialogTitle>
          <DialogDescription>
            Legg til et nytt medlem i teamet
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ansatt</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isLoadingEmployees}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingEmployees ? "Laster..." : "Velg ansatt"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees
                        .filter(emp => emp.is_active)
                        .map((employee) => {
                          const displayName = employee.first_name && employee.last_name
                            ? `${employee.first_name} ${employee.last_name}`
                            : employee.email || 'Ukjent';
                          const roleText = employee.user_role ? ` (${employee.user_role})` : '';
                          
                          return (
                            <SelectItem key={employee.id} value={employee.id}>
                              {displayName}{roleText}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teamrolle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg rolle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Medlem</SelectItem>
                      <SelectItem value="lead">Teamleder</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Avbryt
              </Button>
              <Button 
                type="submit" 
                disabled={addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? 'Legger til...' : 'Legg til'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
