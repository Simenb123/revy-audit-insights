
import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Bot, Loader2 } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';
import { generateAIResponse } from '@/services/revy/aiInteractionService';
import { toast } from '@/components/ui/use-toast';
import { Client } from '@/types/revio';
import { ClientAuditAction } from '@/types/audit-actions';
import { useCreateDocumentVersion } from '@/hooks/useCreateDocumentVersion';
import { useCreateAuditLog } from '@/hooks/useCreateAuditLog';
import AIPreviewDialog from '@/components/AuditActions/AIPreviewDialog';

type Props = {
  editor: Editor;
  client: Client;
  action: ClientAuditAction;
};

const RevyAIGroup = ({ editor, client, action }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);

  const createVersion = useCreateDocumentVersion();
  const createAuditLog = useCreateAuditLog();

  const handleRevyHelp = async () => {
    if (!editor || !action || !client) {
      toast({ title: "Mangler kontekst", description: "Kan ikke hente hjelp fra Revy uten full kontekst.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const currentContent = editor.getHTML();
    setOriginalContent(currentContent);
    
    try {
      await createVersion.mutateAsync({
        clientAuditActionId: action.id,
        content: currentContent,
        versionName: `Før AI-forbedring ${new Date().toLocaleTimeString()}`,
        changeSource: 'user',
        changeDescription: 'Automatisk lagret versjon før Revy AI ble kjørt.',
        clientId: client.id,
        subjectArea: action.subject_area,
        actionName: action.name,
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
        [], // history
        { client, action }, // clientData
        'employee' // userRole
      );
      
      setAiSuggestion(response);
      setIsPreviewOpen(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ukjent feil";
      console.error("Error getting response from Revy:", error);
      toast({ title: "Feil", description: `Kunne ikke få svar fra Revy: ${errorMessage}`, variant: "destructive" });
      setOriginalContent(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSuggestion = async () => {
    if (!aiSuggestion) return;

    try {
      await createVersion.mutateAsync({
        clientAuditActionId: action.id,
        content: aiSuggestion,
        versionName: `AI-forbedring ${new Date().toLocaleTimeString()}`,
        changeSource: 'ai',
        changeDescription: 'Innhold generert av Revy AI og godkjent av bruker.',
        clientId: client.id,
        subjectArea: action.subject_area,
        actionName: action.name,
      });
      
      editor.chain().focus().setContent(aiSuggestion).run();
      
      toast({ title: "Revy hjalp til!", description: "Innholdet i editoren ble oppdatert." });

      createAuditLog.mutate({
        clientId: client.id,
        actionType: 'ai_content_generated',
        areaName: action.subject_area,
        description: `Bruker godkjente og brukte AI-forslag for revisjonshandling: "${action.name}".`,
        metadata: { client_audit_action_id: action.id, approved: true }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ukjent feil";
      console.error("Error approving AI suggestion:", error);
      toast({ title: "Feil", description: `Kunne ikke lagre AI-forslaget: ${errorMessage}`, variant: "destructive" });
    } finally {
      setAiSuggestion(null);
      setOriginalContent(null);
    }
  };

  const handleRejectSuggestion = () => {
    if (!aiSuggestion) return; // Forhindre unødvendig logging
    createAuditLog.mutate({
      clientId: client.id,
      actionType: 'ai_content_generated',
      areaName: action.subject_area,
      description: `Bruker avviste AI-forslag for revisjonshandling: "${action.name}".`,
      metadata: { client_audit_action_id: action.id, approved: false }
    });
    toast({ title: "Forslag avvist", description: "Ingen endringer ble gjort." });
    setAiSuggestion(null);
    setOriginalContent(null);
  };

  const handleClosePreview = (approved: boolean) => {
    setIsPreviewOpen(false);
    if (approved) {
      handleApproveSuggestion();
    } else {
      handleRejectSuggestion();
    }
  };

  return (
    <>
      <ToolbarButton
        tooltip="Spør Revy om hjelp"
        onPressedChange={handleRevyHelp}
        disabled={isLoading || isPreviewOpen}
        aria-label="Spør Revy om hjelp"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
      </ToolbarButton>
      {originalContent && aiSuggestion && (
        <AIPreviewDialog 
            isOpen={isPreviewOpen}
            onClose={handleClosePreview}
            originalContent={originalContent}
            suggestedContent={aiSuggestion}
        />
      )}
    </>
  );
};

export default RevyAIGroup;
