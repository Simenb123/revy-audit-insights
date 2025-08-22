import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit, ExternalLink, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { useLegalCrossReferences, useDeleteCrossReference } from '@/hooks/knowledge/useLegalCrossReferences';
import type { LegalCrossRef } from '@/types/legal-knowledge';

const REF_TYPE_LABELS: Record<LegalCrossRef['ref_type'], string> = {
  clarifies: 'Utdyper',
  enabled_by: 'Hjemles i',
  implements: 'Implementerer',
  cites: 'Viser til',
  interprets: 'Tolker',
  applies: 'Anvender',
  mentions: 'Nevner'
};

const REF_TYPE_OPTIONS = Object.entries(REF_TYPE_LABELS).map(([value, label]) => ({
  value,
  label
}));

interface CrossReferencesListProps {
  demoMode?: boolean;
}

const CrossReferencesList: React.FC<CrossReferencesListProps> = ({
  demoMode = false
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRefType, setSelectedRefType] = useState<string>('');
  const [limit, setLimit] = useState(50);
  
  // Fetch cross-references with filters
  const { 
    data: crossReferences = [], 
    isLoading, 
    error 
  } = useLegalCrossReferences({
    refType: selectedRefType || undefined,
    limit
  });

  // Delete mutation
  const deleteMutation = useDeleteCrossReference();

  // Filter cross-references based on search term
  const filteredCrossReferences = crossReferences.filter(ref => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      ref.to_anchor?.toLowerCase().includes(searchLower) ||
      ref.to_document_number?.toLowerCase().includes(searchLower) ||
      ref.ref_text?.toLowerCase().includes(searchLower) ||
      ref.from_provision_id.toString().includes(searchLower)
    );
  });

  const handleDelete = async (id: number) => {
    if (demoMode) {
      toast({
        title: 'Demo-modus',
        description: 'Sletting er ikke tillatt i demo-modus.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: 'Kryssreferanse slettet',
        description: 'Kryssreferansen ble slettet fra databasen.',
      });
    } catch (error) {
      console.error('Error deleting cross-reference:', error);
      toast({
        title: 'Feil ved sletting',
        description: 'Det oppstod en feil ved sletting av kryssreferansen.',
        variant: 'destructive'
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRefType('');
  };

  if (demoMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Eksisterende kryssreferanser
            <Badge variant="secondary">Demo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Demo-modus: Kryssreferanser vises ikke i demo-modus.
            <br />
            Koble til database for å se eksisterende relasjoner.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Feil ved lasting</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Kunne ikke laste kryssreferanser: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Eksisterende kryssreferanser ({filteredCrossReferences.length})
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i kryssreferanser..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedRefType} onValueChange={setSelectedRefType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Alle relasjonstyper" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alle relasjonstyper</SelectItem>
              {REF_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(searchTerm || selectedRefType) && (
            <Button variant="outline" onClick={clearFilters}>
              Tøm filter
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Laster kryssreferanser...</p>
          </div>
        ) : filteredCrossReferences.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {crossReferences.length === 0 
                ? 'Ingen kryssreferanser funnet.'
                : 'Ingen kryssreferanser matcher dine søkekriterier.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredCrossReferences.map((ref) => (
              <div
                key={ref.id}
                className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
              >
                {/* From provision */}
                <div className="text-sm">
                  <p className="font-medium text-primary">Fra:</p>
                  <p className="text-sm text-muted-foreground">
                    Provision ID: {ref.from_provision_id}
                  </p>
                </div>

                {/* Relation type */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {REF_TYPE_LABELS[ref.ref_type]}
                  </Badge>
                  <div className="h-px bg-border flex-1" />
                </div>

                {/* To document/anchor */}
                <div className="text-sm">
                  <p className="font-medium text-primary">Til:</p>
                  <p className="text-sm">
                    {ref.to_document_number} {ref.to_anchor && `§ ${ref.to_anchor}`}
                  </p>
                </div>

                {/* Reference text */}
                {ref.ref_text && (
                  <div className="text-sm">
                    <p className="font-medium">Referansetekst:</p>
                    <p className="text-muted-foreground italic">
                      "{ref.ref_text}"
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-muted-foreground">
                  <span>
                    Opprettet: {new Date(ref.created_at).toLocaleDateString('no-NO')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      disabled
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      disabled
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Slett kryssreferanse</AlertDialogTitle>
                        <AlertDialogDescription>
                          Er du sikker på at du vil slette denne kryssreferansen? 
                          Dette kan ikke angres.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(ref.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Slett
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Load more button */}
        {crossReferences.length >= limit && (
          <div className="pt-4 border-t text-center">
            <Button
              variant="outline"
              onClick={() => setLimit(limit + 50)}
              disabled={isLoading}
            >
              Last flere
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrossReferencesList;