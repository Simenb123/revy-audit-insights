
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const CreateTestDataButton = () => {
  const { toast } = useToast();

  const createTestData = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ikke autentisert');

      // Sjekk om brukeren allerede har et firma
      const { data: profile } = await supabase
        .from('profiles')
        .select('audit_firm_id')
        .eq('id', user.id)
        .single();

      if (profile?.audit_firm_id) {
        // Opprett bare test chat-rom for eksisterende firma
        const { error: firmRoomError } = await supabase
          .from('chat_rooms')
          .insert({
            room_type: 'firm',
            reference_id: profile.audit_firm_id,
            name: 'Firma-chat',
            description: 'Generell chat for hele firmaet'
          });

        if (firmRoomError) throw firmRoomError;
        return;
      }

      // Opprett testfirma
      const { data: firm, error: firmError } = await supabase
        .from('audit_firms')
        .insert({
          name: 'Test Revisjonsfirma AS',
          org_number: '999999999',
          city: 'Oslo',
          email: 'test@revisjon.no'
        })
        .select()
        .single();

      if (firmError) throw firmError;

      // Opprett avdeling
      const { data: department, error: deptError } = await supabase
        .from('departments')
        .insert({
          audit_firm_id: firm.id,
          name: 'Revisjonsavdelingen',
          description: 'Hovedavdeling for revisjon'
        })
        .select()
        .single();

      if (deptError) throw deptError;

      // Oppdater brukerens profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          audit_firm_id: firm.id,
          department_id: department.id,
          user_role: 'partner'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Opprett team
      const { data: team, error: teamError } = await supabase
        .from('client_teams')
        .insert({
          client_id: firm.id, // Bruker firma-id som placeholder
          department_id: department.id,
          team_lead_id: user.id,
          name: 'Test Team',
          description: 'Et test-team for å demonstrere chat-funksjonalitet'
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Legg til bruker som teammedlem
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'lead'
        });

      if (memberError) throw memberError;

      // Opprett firma-chat
      const { error: firmRoomError } = await supabase
        .from('chat_rooms')
        .insert({
          room_type: 'firm',
          reference_id: firm.id,
          name: 'Firma-chat',
          description: 'Generell chat for hele firmaet'
        });

      if (firmRoomError) throw firmRoomError;

      // Opprett avdelings-chat
      const { error: deptRoomError } = await supabase
        .from('chat_rooms')
        .insert({
          room_type: 'department',
          reference_id: department.id,
          name: 'Revisjonsavdelingen - Chat',
          description: 'Chat for revisjonsavdelingen'
        });

      if (deptRoomError) throw deptRoomError;
    },
    onSuccess: () => {
      toast({
        title: "Testdata opprettet",
        description: "Chat-systemet er nå klart for testing. Gå til Kommunikasjon-siden for å teste.",
      });
      // Refresh siden for å oppdatere brukerdata
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved oppretting av testdata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <Button 
      onClick={() => createTestData.mutate()}
      disabled={createTestData.isPending}
      className="flex items-center gap-2"
    >
      <Plus className="h-4 w-4" />
      {createTestData.isPending ? 'Oppretter...' : 'Opprett testdata for chat'}
    </Button>
  );
};

export default CreateTestDataButton;
