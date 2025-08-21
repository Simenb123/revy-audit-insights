import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeftRight, Eye, Settings, Database } from 'lucide-react';

import Selectors from './Selectors';
import ProvisionsPicker from './ProvisionsPicker';
import DraftList from './DraftList';
import GraphView from './GraphView';

import type { LegalDocument, LegalProvision, DraftRelation, DocumentNodeType } from '@/types/legal-knowledge';

interface SelectedDocuments {
  source?: LegalDocument;
  target?: LegalDocument;
}

interface SelectedProvisions {
  source?: LegalProvision;
  target?: LegalProvision;
}

const LegalRelationsAdmin: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<string>('select');
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocuments>({});
  const [selectedProvisions, setSelectedProvisions] = useState<SelectedProvisions>({});
  const [draftRelations, setDraftRelations] = useState<DraftRelation[]>([]);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [autoSuggest, setAutoSuggest] = useState<boolean>(true);

  // Document type state
  const [sourceDocType, setSourceDocType] = useState<DocumentNodeType>('lov');
  const [targetDocType, setTargetDocType] = useState<DocumentNodeType>('forskrift');

  // Handlers
  const handleSwapDirection = () => {
    setSelectedDocuments(prev => ({
      source: prev.target,
      target: prev.source
    }));
    setSelectedProvisions(prev => ({
      source: prev.target,
      target: prev.source
    }));
    setSourceDocType(targetDocType);
    setTargetDocType(sourceDocType);
  };

  const handleDocumentSelect = (type: 'source' | 'target', document: LegalDocument) => {
    setSelectedDocuments(prev => ({ ...prev, [type]: document }));
    // Clear provisions when document changes
    setSelectedProvisions(prev => ({ ...prev, [type]: undefined }));
  };

  const handleProvisionSelect = (type: 'source' | 'target', provision: LegalProvision) => {
    setSelectedProvisions(prev => ({ ...prev, [type]: provision }));
  };

  const addToDraft = (relation: DraftRelation) => {
    setDraftRelations(prev => [...prev, relation]);
  };

  const removeFromDraft = (tempId: string) => {
    setDraftRelations(prev => prev.filter(rel => rel.tempId !== tempId));
  };

  const clearDraft = () => {
    setDraftRelations([]);
  };

  const canProceedToProvisions = selectedDocuments.source && selectedDocuments.target;
  const canCreateRelation = selectedProvisions.source && selectedProvisions.target;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                RAG Admin - Juridisk Relasjonskart
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Administrer relasjoner mellom juridiske kilder og bestemmelser
              </p>
            </div>
            
            {/* Settings toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="demo-mode"
                  checked={demoMode}
                  onCheckedChange={setDemoMode}
                />
                <Label htmlFor="demo-mode" className="text-sm">
                  Demo-modus
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-suggest"
                  checked={autoSuggest}
                  onCheckedChange={setAutoSuggest}
                />
                <Label htmlFor="auto-suggest" className="text-sm">
                  Auto-forslag
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main workflow */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="select" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Velg Dokumenter
          </TabsTrigger>
          <TabsTrigger 
            value="provisions" 
            disabled={!canProceedToProvisions}
            className="flex items-center gap-2"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Velg Bestemmelser
          </TabsTrigger>
          <TabsTrigger value="visualize" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visualiser ({draftRelations.length})
          </TabsTrigger>
        </TabsList>

        {/* Step 1: Document Selection */}
        <TabsContent value="select" className="space-y-4">
          <Selectors
            sourceDocType={sourceDocType}
            targetDocType={targetDocType}
            selectedDocuments={selectedDocuments}
            demoMode={demoMode}
            onDocTypeChange={(type, docType) => {
              if (type === 'source') setSourceDocType(docType);
              else setTargetDocType(docType);
            }}
            onDocumentSelect={handleDocumentSelect}
            onSwapDirection={handleSwapDirection}
          />
          
          {canProceedToProvisions && (
            <div className="flex justify-center pt-4">
              <Button onClick={() => setActiveTab('provisions')}>
                Fortsett til Bestemmelser
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Step 2: Provisions Selection */}
        <TabsContent value="provisions" className="space-y-4">
          {canProceedToProvisions && (
            <ProvisionsPicker
              sourceDocument={selectedDocuments.source!}
              targetDocument={selectedDocuments.target!}
              selectedProvisions={selectedProvisions}
              demoMode={demoMode}
              autoSuggest={autoSuggest}
              onProvisionSelect={handleProvisionSelect}
              onAddToDraft={addToDraft}
              canCreateRelation={canCreateRelation}
            />
          )}
        </TabsContent>

        {/* Step 3: Visualization & Management */}
        <TabsContent value="visualize" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Draft Relations List */}
            <div className="lg:col-span-1">
              <DraftList
                draftRelations={draftRelations}
                onRemoveFromDraft={removeFromDraft}
                onClearDraft={clearDraft}
                demoMode={demoMode}
              />
            </div>
            
            {/* Graph Visualization */}
            <div className="lg:col-span-2">
              <GraphView
                draftRelations={draftRelations}
                demoMode={demoMode}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalRelationsAdmin;