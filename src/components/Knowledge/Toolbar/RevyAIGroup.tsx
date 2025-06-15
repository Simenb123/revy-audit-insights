
import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Bot, Loader2 } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';
import { generateAIResponse } from '@/services/revyService';
import { toast } from '@/components/ui/use-toast';
import { Client } from '@/types/revio';
import { ClientAuditAction } from '@/types/audit-actions';
import { useCreateDocumentVersion } from '@/hooks/useCreateDocumentVersion';
import { useCreateAuditLog } from '@/hooks/useCreateAuditLog';

type Props = {
  editor: Editor;
  client: Client;
  action: ClientAuditAction;
};

const RevyAIGroup = ({ editor, client, action }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const createVersion = useCreateDocumentVersion();
  const createAuditLog = useCreateAuditLog();

  const handleRevyHelp = async () => {
    if (!editor || !action || !client) {
      toast({ title: "Mangler kontekst", description: "Kan ikke hente hjelp fra Revy uten full kontekst.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const currentContent = editor.getHTML();
    
    try {
      await createVersion.mutateAsync({
        clientAuditActionId: action.id,
        content: currentContent,
        versionName: `Før AI-forbedring ${new Date().toLocaleTimeString()}`,
        changeSource: 'user',
        changeDescription: 'Automatisk lagret versjon før Revy AI ble kjørt.'
      });
    } catch (versionError) {
       console.error("Could not save pre-AI version:", versionError);
       toast({ title: "Feil", description: "Kunne ikke lagre nåværende versjon før AI-kjøring. Handlingen ble avbrutt.", variant: "destructive" });
       setIsLoading(false);
       return;
    }
    
    const prompt = `Du er en erfaren revisor. Forbedre og utdyp følgende dokumentasjon for revisjonshandlingen "${action.name}". Svar kun med den oppdaterte HTML-formaterte teksten, uten ekstra kommentarer eller introduksjoner. Eksisterende tekst:\n\n${currentContent}`;

    try {
      const response = await generateAIResponse(
        prompt,
        'audit-actions',
        { client, action },
        'employee'
      );
      
      await createVersion.mutateAsync({
        clientAuditActionId: action.id,
        content: response,
        versionName: `AI-forbedring ${new Date().toLocaleTimeString()}`,
        changeSource: 'ai',
        changeDescription: 'Innhold generert av Revy AI.'
      });
      
      editor.chain().focus().setContent('').run();
      const chunks = response.match(/.{1,10}/g) || [];
      
      for (const chunk of chunks) {
          editor.chain().focus().insertContent(chunk).run();
          await new Promise(r => setTimeout(r, 20));
      }
      
      toast({ title: "Revy hjalp til!", description: "Innholdet i editoren ble oppdatert." });

      createAuditLog.mutate({
        clientId: client.id,
        actionType: 'ai_content_generated',
        areaName: action.subject_area,
        description: `Revy AI forbedret innhold for revisjonshandling: "${action.name}".`,
        metadata: { client_audit_action_id: action.id }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ukjent feil";
      console.error("Error getting response from Revy:", error);
      toast({ title: "Feil", description: `Kunne ikke få svar fra Revy: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolbarButton
      tooltip="Spør Revy om hjelp"
      onPressedChange={handleRevyHelp}
      disabled={isLoading}
      aria-label="Spør Revy om hjelp"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
    </ToolbarButton>
  );
};

export default RevyAIGroup;
