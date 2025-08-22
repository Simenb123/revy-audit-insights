import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Link, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLegalProvisions } from '@/hooks/knowledge/useLegalProvisions';

import { suggestRefType } from './helpers';
import type { LegalDocument, LegalProvision, DraftRelation, LegalCrossRef, DocumentNodeType } from '@/types/legal-knowledge';

interface ProvisionsPickerProps {
  sourceDocument: LegalDocument;
  targetDocument: LegalDocument;
  selectedProvisions: {
    source?: LegalProvision;
    target?: LegalProvision;
  };
  demoMode: boolean;
  autoSuggest: boolean;
  onProvisionSelect: (type: 'source' | 'target', provision: LegalProvision) => void;
  onAddToDraft: (relation: DraftRelation) => void;
  canCreateRelation: boolean;
}

// Mock provisions for demo mode (fallback)
const MOCK_PROVISIONS: Record<string, LegalProvision[]> = {
  'rskl-1998': [ // Regnskapsloven
    {
      id: '1',
      provision_type: 'paragraph',
      provision_number: '3-1',
      title: 'Bokføringspliktige',
      content: 'Bokføringspliktige etter denne lov er...',
      law_identifier: 'regnskapsloven',
      law_full_name: 'Lov om årsregnskap m.v.',
      anchor: 'regnskapsloven.§3-1',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      provision_type: 'paragraph',
      provision_number: '3-2',
      title: 'Regnskapsplikt',
      content: 'Regnskapsplikt følger av...',
      law_identifier: 'regnskapsloven',
      law_full_name: 'Lov om årsregnskap m.v.',
      anchor: 'regnskapsloven.§3-2',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

const REF_TYPE_LABELS: Record<LegalCrossRef['ref_type'], string> = {
  clarifies: 'Utdyper',
  enabled_by: 'Hjemles i',
  implements: 'Implementerer',
  cites: 'Viser til',
  interprets: 'Tolker',
  applies: 'Anvender',
  mentions: 'Nevner'
};

const ProvisionsPicker: React.FC<ProvisionsPickerProps> = ({
  sourceDocument,
  targetDocument,
  selectedProvisions,
  demoMode,
  autoSuggest,
  onProvisionSelect,
  onAddToDraft,
  canCreateRelation
}) => {
  const { toast } = useToast();
  
  // Local state
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [refType, setRefType] = useState<LegalCrossRef['ref_type']>('cites');
  const [refText, setRefText] = useState('');

  // Fetch provisions for source document
  const { data: sourceProvisions = [], isLoading: sourceLoading, error: sourceError } = useLegalProvisions({
    documentId: sourceDocument.id,
    searchTerm: sourceSearch,
    limit: 200,
    enabled: !demoMode
  });

  // Fetch provisions for target document  
  const { data: targetProvisions = [], isLoading: targetLoading, error: targetError } = useLegalProvisions({
    documentId: targetDocument.id,
    searchTerm: targetSearch,
    limit: 200,
    enabled: !demoMode
  });

  // Use mock data in demo mode
  const finalSourceProvisions = demoMode ? (MOCK_PROVISIONS[sourceDocument.id] || []) : sourceProvisions;
  const finalTargetProvisions = demoMode ? (MOCK_PROVISIONS[targetDocument.id] || []) : targetProvisions;

  // Auto-suggest relation type when provisions are selected
  React.useEffect(() => {
    if (autoSuggest && selectedProvisions.source && selectedProvisions.target) {
      const suggested = suggestRefType(
        sourceDocument.document_type_id as DocumentNodeType,
        targetDocument.document_type_id as DocumentNodeType
      );
      setRefType(suggested);
    }
  }, [selectedProvisions.source?.id, selectedProvisions.target?.id, autoSuggest, sourceDocument.document_type_id, targetDocument.document_type_id]);

  const handleAddToDraft = () => {
    if (!selectedProvisions.source || !selectedProvisions.target) {
      toast({
        title: 'Manglende valg',
        description: 'Du må velge bestemmelser på begge sider.',
        variant: 'destructive'
      });
      return;
    }

    const relation: DraftRelation = {
      fromProvision: selectedProvisions.source,
      toProvision: selectedProvisions.target,
      fromDocument: sourceDocument,
      toDocument: targetDocument,
      refType,
      refText: refText.trim() || undefined,
      tempId: `${Date.now()}-${Math.random()}`
    };

    onAddToDraft(relation);
    
    // Clear selections for next relation
    onProvisionSelect('source', selectedProvisions.source);
    onProvisionSelect('target', selectedProvisions.target);
    setRefText('');
    
    toast({
      title: 'Relasjon lagt til',
      description: 'Relasjonen er lagt til i kladden.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Document headers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Kilde: {sourceDocument.title}
            </CardTitle>
            <Badge variant="outline" className="w-fit">
              {sourceDocument.document_number}
            </Badge>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Mål: {targetDocument.title}
            </CardTitle>
            <Badge variant="outline" className="w-fit">
              {targetDocument.document_number}
            </Badge>
          </CardHeader>
        </Card>
      </div>

      {/* Provisions selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source provisions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Velg kildebestemmelse</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i nummer eller tittel..."
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading state */}
            {!demoMode && sourceLoading && (
              <div className="flex items-center gap-2 p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Laster bestemmelser...</span>
              </div>
            )}
            
            {/* Error state */}
            {!demoMode && sourceError && (
              <div className="text-sm text-red-600 p-4 border border-red-200 bg-red-50 rounded-md mb-4">
                Feil ved lasting: {sourceError.message}
              </div>
            )}
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {finalSourceProvisions.map((provision) => (
                <div
                  key={provision.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProvisions.source?.id === provision.id
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => onProvisionSelect('source', provision)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">§ {provision.provision_number}</p>
                      <p className="text-sm text-muted-foreground">{provision.title}</p>
                      {provision.anchor && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Anker: {provision.anchor}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {finalSourceProvisions.length === 0 && !sourceLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {demoMode ? 'Ingen bestemmelser i demo-modus' : 'Ingen bestemmelser funnet'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Target provisions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Velg målbestemmelse</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i nummer eller tittel..."
                value={targetSearch}
                onChange={(e) => setTargetSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading state */}
            {!demoMode && targetLoading && (
              <div className="flex items-center gap-2 p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Laster bestemmelser...</span>
              </div>
            )}
            
            {/* Error state */}
            {!demoMode && targetError && (
              <div className="text-sm text-red-600 p-4 border border-red-200 bg-red-50 rounded-md mb-4">
                Feil ved lasting: {targetError.message}
              </div>
            )}
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {finalTargetProvisions.map((provision) => (
                <div
                  key={provision.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProvisions.target?.id === provision.id
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => onProvisionSelect('target', provision)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">§ {provision.provision_number}</p>
                      <p className="text-sm text-muted-foreground">{provision.title}</p>
                      {provision.anchor && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Anker: {provision.anchor}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {finalTargetProvisions.length === 0 && !targetLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {demoMode ? 'Ingen bestemmelser i demo-modus' : 'Ingen bestemmelser funnet'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relation definition */}
      {canCreateRelation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Definer Relasjon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected provisions summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Fra:</p>
                <p className="text-sm">
                  {selectedProvisions.source?.anchor || `§ ${selectedProvisions.source?.provision_number}`} - {selectedProvisions.source?.title}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Til:</p>
                <p className="text-sm">
                  {selectedProvisions.target?.anchor || `§ ${selectedProvisions.target?.provision_number}`} - {selectedProvisions.target?.title}
                </p>
              </div>
            </div>

            {/* Relation type */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Relasjonstype {autoSuggest && <Badge variant="outline" className="ml-2 text-xs">Auto-foreslått</Badge>}
              </label>
              <Select
                value={refType}
                onValueChange={(value: LegalCrossRef['ref_type']) => setRefType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REF_TYPE_LABELS).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Optional note */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Notat (valgfritt)
              </label>
              <Textarea
                placeholder="Legg til beskrivelse av relasjonen..."
                value={refText}
                onChange={(e) => setRefText(e.target.value)}
                rows={3}
              />
            </div>

            {/* Add to draft button */}
            <Button onClick={handleAddToDraft} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Legg til i kladd
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProvisionsPicker;