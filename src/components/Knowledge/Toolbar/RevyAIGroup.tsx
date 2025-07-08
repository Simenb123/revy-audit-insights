import { logger } from '@/utils/logger';
import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Bot, Loader2 } from 'lucide-react';
import ToolbarButton from '../ToolbarButton';
import { generateEnhancedAIResponseWithVariant } from '@/services/revy/enhancedAiInteractionService';
import { toast } from '@/components/ui/use-toast';
import { Client } from '@/types/revio';
import { ClientAuditAction } from '@/types/audit-actions';
import { useCreateDocumentVersion } from '@/hooks/useCreateDocumentVersion';
import { useCreateAuditLog } from '@/hooks/useCreateAuditLog';
import AIPreviewDialog from '@/components/AuditActions/AIPreviewDialog';
import { useAIRevyVariants } from '@/hooks/useAIRevyVariants';

type Props = {
  editor: Editor;
  client: Client;
  action: ClientAuditAction;
};

const ReviAIGroup = ({ editor, client, action }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);

  const createVersion = useCreateDocumentVersion();
  const createAuditLog = useCreateAuditLog();
  const { selectedVariant } = useAIRevyVariants('audit-actions');

  const handleReviHelp = async () => {
    if (!editor || !action || !client) {
      toast({ title: "Mangler kontekst", description: "Kan ikke hente hjelp fra AI-Revy uten full kontekst.", variant: "destructive" });
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
        changeDescription: 'Automatisk lagret versjon før AI-Revy ble kjørt.',
        clientId: client.id,
        subjectArea: action.subject_area,
        actionName: action.name,
      });
    } catch (versionError) {
       logger.error("Could not save pre-AI version:", versionError);
       toast({ title: "Feil", description: "Kunne ikke lagre nåværende versjon før AI-kjøring. Handlingen ble avbrutt.", variant: "destructive" });
       setIsLoading(false);
       return;
    }
    
    const prompt = selectedVariant?.name === 'methodology' 
      ? `Du er AI-Revy Metodikk. Forbedre og utdyp følgende revisjonshandling "${action.name}" med fokus på ISA-standarder og metodikk.

VIKTIG: Inkluder konkrete ISA-referanser og prosedyrer.
- Spesifiser hvilke ISA-standarder som gjelder
- Gi detaljerte revisjonshandlinger
- Foreslå dokumentasjonskrav
- Vurder risikonivå og materialitet
- Ta hensyn til klientens dokumentstatus og fagområder

Svar kun med den oppdaterte HTML-formaterte teksten.
    
Eksisterende tekst:\n\n${currentContent}`
      : `Du er en erfaren revisor. Forbedre og utdyp følgende dokumentasjon for revisjonshandlingen "${action.name}". 

VIKTIG: Ta hensyn til klientens dokumentstatus når du gir forslag:
- Hvis klienten har mange dokumenter med høy AI-sikkerhet, kan du være mer spesifikk i anbefalingene
- Hvis klienten mangler dokumenter eller har lav dokumentkvalitet, fokuser på hva som må skaffes først
- Vurder dokumentkoblinger når du foreslår analyser

Svar kun med den oppdaterte HTML-formaterte teksten, uten ekstra kommentarer eller introduksjoner. 

Eksisterende tekst:\n\n${currentContent}`;

    try {
      const response = await generateEnhancedAIResponseWithVariant(
        prompt,
        'audit-actions',
        [], // history
        client, // clientData with enhanced document context
        'employee', // userRole
        undefined, // sessionId
        selectedVariant // Selected AI variant
      );
      
      setAiSuggestion(response);
      setIsPreviewOpen(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ukjent feil";
      logger.error("Error getting response from AI-Revy:", error);
      toast({ title: "Feil", description: `Kunne ikke få svar fra AI-Revy: ${errorMessage}`, variant: "destructive" });
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
        changeDescription: 'Innhold generert av AI-Revy og godkjent av bruker.',
        clientId: client.id,
        subjectArea: action.subject_area,
        actionName: action.name,
      });
      
      editor.chain().focus().setContent(aiSuggestion).run();
      
      toast({ title: "AI-Revy hjalp til!", description: "Innholdet i editoren ble oppdatert." });

      createAuditLog.mutate({
        clientId: client.id,
        actionType: 'ai_content_generated',
        areaName: action.subject_area,
        description: `Bruker godkjente og brukte AI-forslag for revisjonshandling: "${action.name}".`,
        metadata: { client_audit_action_id: action.id, approved: true }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ukjent feil";
      logger.error("Error approving AI suggestion:", error);
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
        tooltip={`Spør ${selectedVariant?.display_name || 'AI-Revy'} om hjelp`}
        onPressedChange={handleReviHelp}
        disabled={isLoading || isPreviewOpen}
        aria-label={`Spør ${selectedVariant?.display_name || 'AI-Revy'} om hjelp`}
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

export default ReviAIGroup;
