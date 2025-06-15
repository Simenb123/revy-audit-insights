
import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Bot, Loader2 } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';
import { generateAIResponse } from '@/services/revyService';
import { toast } from '@/components/ui/use-toast';
import { Client } from '@/types/revio';
import { ClientAuditAction } from '@/types/audit-actions';

type Props = {
  editor: Editor;
  client: Client;
  action: ClientAuditAction;
};

const RevyAIGroup = ({ editor, client, action }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRevyHelp = async () => {
    if (!editor || !action || !client) {
      toast({ title: "Mangler kontekst", description: "Kan ikke hente hjelp fra Revy uten full kontekst.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const currentContent = editor.getHTML();
    const prompt = `Du er en erfaren revisor. Forbedre og utdyp følgende dokumentasjon for revisjonshandlingen "${action.name}". Svar kun med den oppdaterte HTML-formaterte teksten, uten ekstra kommentarer eller introduksjoner. Eksisterende tekst:\n\n${currentContent}`;

    try {
      const response = await generateAIResponse(
        prompt,
        'audit-actions',
        { client, action },
        'employee'
      );
      
      // Simulate streaming into the editor by progressively adding content
      editor.chain().focus().setContent('').run();
      const chunks = response.match(/.{1,10}/g) || []; // Split into small chunks
      
      for (const chunk of chunks) {
          editor.chain().focus().insertContent(chunk).run();
          await new Promise(r => setTimeout(r, 20)); // A short delay for effect
      }
      
      toast({ title: "Revy hjalp til!", description: "Innholdet i editoren ble oppdatert." });

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
