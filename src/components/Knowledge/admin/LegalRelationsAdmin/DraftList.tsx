import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, X, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { buildCrossRefPayload } from './helpers';
import type { DraftRelation, LegalCrossRef } from '@/types/legal-knowledge';

interface DraftListProps {
  draftRelations: DraftRelation[];
  onRemoveFromDraft: (tempId: string) => void;
  onClearDraft: () => void;
  demoMode: boolean;
}

const REF_TYPE_LABELS: Record<LegalCrossRef['ref_type'], string> = {
  clarifies: 'Utdyper',
  enabled_by: 'Hjemles i',
  implements: 'Implementerer',
  cites: 'Viser til',
  interprets: 'Tolker',
  applies: 'Anvender',
  mentions: 'Nevner'
};

const DraftList: React.FC<DraftListProps> = ({
  draftRelations,
  onRemoveFromDraft,
  onClearDraft,
  demoMode
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Mutation for saving relations to database
  const saveRelationsMutation = useMutation({
    mutationFn: async (relations: DraftRelation[]) => {
      if (demoMode) {
        // Simulate API call in demo mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, count: relations.length };
      }

      const payloads = relations.map(relation => 
        buildCrossRefPayload(relation, parseInt(relation.fromProvision.id))
      );

      const { data, error } = await supabase
        .from('legal_cross_refs')
        .insert(payloads)
        .select();

      if (error) throw error;
      return { success: true, count: data.length };
    },
    onSuccess: (result) => {
      toast({
        title: 'Relasjoner lagret',
        description: `${result.count} relasjoner ble lagret til databasen.`,
      });
      onClearDraft();
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['legal-cross-refs'] });
    },
    onError: (error) => {
      console.error('Error saving relations:', error);
      toast({
        title: 'Feil ved lagring',
        description: demoMode 
          ? 'Demo-modus: Lagring simulert men ikke utført.'
          : 'Det oppstod en feil ved lagring av relasjoner.',
        variant: 'destructive'
      });
    }
  });

  const handleSaveRelations = async () => {
    if (draftRelations.length === 0) {
      toast({
        title: 'Ingen relasjoner',
        description: 'Det er ingen relasjoner i kladden å lagre.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveRelationsMutation.mutateAsync(draftRelations);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Kladd ({draftRelations.length})
          </CardTitle>
          {draftRelations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearDraft}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Tøm
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {draftRelations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Ingen relasjoner i kladden
          </p>
        ) : (
          <>
            {/* Relations list */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {draftRelations.map((relation) => (
                <div
                  key={relation.tempId}
                  className="p-3 border rounded-lg space-y-2"
                >
                  {/* From */}
                  <div className="text-sm">
                    <p className="font-medium text-primary">Fra:</p>
                    <p className="text-xs text-muted-foreground">
                      {relation.fromDocument.title}
                    </p>
                    <p className="text-sm">
                      § {relation.fromProvision.provision_number} - {relation.fromProvision.title}
                    </p>
                  </div>

                  {/* Relation type */}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {REF_TYPE_LABELS[relation.refType]}
                    </Badge>
                    <div className="h-px bg-border flex-1" />
                  </div>

                  {/* To */}
                  <div className="text-sm">
                    <p className="font-medium text-primary">Til:</p>
                    <p className="text-xs text-muted-foreground">
                      {relation.toDocument.title}
                    </p>
                    <p className="text-sm">
                      § {relation.toProvision.provision_number} - {relation.toProvision.title}
                    </p>
                  </div>

                  {/* Note */}
                  {relation.refText && (
                    <div className="text-sm">
                      <p className="font-medium">Notat:</p>
                      <p className="text-muted-foreground italic">
                        "{relation.refText}"
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {relation.fromDocument.source_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 px-2"
                        >
                          <a
                            href={relation.fromDocument.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFromDraft(relation.tempId)}
                      className="h-8 px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Save button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSaveRelations}
                disabled={isSaving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Lagrer...' : `Lagre ${draftRelations.length} relasjoner`}
              </Button>
              
              {demoMode && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Demo-modus: Lagring vil kun simuleres
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DraftList;