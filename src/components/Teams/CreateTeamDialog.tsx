
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useCreateTeam } from '@/hooks/useCreateTeam';
import { useClientData } from '@/components/Clients/ClientFetcher/useClientData';

const teamSchema = z.object({
  name: z.string().min(1, 'Teamnavn er påkrevd'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Klient er påkrevd'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamCreated: () => void;
}

const CreateTeamDialog = ({ open, onOpenChange, onTeamCreated }: CreateTeamDialogProps) => {
  const { data: clients = [] } = useClientData();
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
      console.error('Error creating team:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opprett nytt team</DialogTitle>
          <DialogDescription>
            Opprett et nytt team og tildel det til en klient
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teamnavn</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Revisjonsteam 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Klient</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg klient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse (valgfritt)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Beskriv teamets rolle og ansvar..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startdato (valgfritt)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sluttdato (valgfritt)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                disabled={createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? 'Oppretter...' : 'Opprett team'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamDialog;
