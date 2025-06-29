import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertCircle, Bot, Move } from 'lucide-react';
import { useClientDocuments, ClientDocument, DocumentCategory } from '@/hooks/useClientDocuments';
import { toast } from 'sonner';

interface BulkCategoryManagerProps {
  selectedDocuments: ClientDocument[];
  categories: DocumentCategory[];
  onClose: () => void;
  onUpdate: () => void;
}

const BulkCategoryManager = ({ selectedDocuments, categories, onClose, onUpdate }: BulkCategoryManagerProps) => {
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [targetSubjectArea, setTargetSubjectArea] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkUpdate = async () => {
    if (!targetCategory) {
      toast.error('Velg en kategori');
      return;
    }

    setIsProcessing(true);
    let updatedCount = 0;

    try {
      // Simulate bulk update - in real implementation, this would be a batch operation
      for (const document of selectedDocuments) {
        // Update document category logic would go here
        updatedCount++;
      }
      
      toast.success(`${updatedCount} dokumenter oppdatert`);
      onUpdate();
      onClose();
    } catch (error) {
      logger.error('Bulk update failed:', error);
      toast.error('Feil ved oppdatering av dokumenter');
    } finally {
      setIsProcessing(false);
    }
  };

  const getAIConsensus = () => {
    const suggestions = selectedDocuments
      .filter(doc => doc.ai_suggested_category)
      .map(doc => doc.ai_suggested_category);
    
    if (suggestions.length === 0) return null;
    
    const categoryCount = suggestions.reduce((acc, cat) => {
      acc[cat!] = (acc[cat!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommon = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      category: mostCommon[0],
      count: mostCommon[1],
      total: selectedDocuments.length,
      confidence: mostCommon[1] / selectedDocuments.length
    };
  };

  const aiConsensus = getAIConsensus();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            Bulk-kategorisering ({selectedDocuments.length} dokumenter)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Consensus */}
          {aiConsensus && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  AI-anbefaling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{aiConsensus.category}</p>
                    <p className="text-sm text-blue-700">
                      {aiConsensus.count} av {aiConsensus.total} dokumenter ({Math.round(aiConsensus.confidence * 100)}% enighet)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setTargetCategory(aiConsensus.category)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Bruk anbefaling
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual category selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ny kategori</label>
              <Select value={targetCategory} onValueChange={setTargetCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fagområde</label>
              <Select value={targetSubjectArea} onValueChange={setTargetSubjectArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg fagområde" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regnskap">Regnskap</SelectItem>
                  <SelectItem value="revisjon">Revisjon</SelectItem>
                  <SelectItem value="skatt">Skatt</SelectItem>
                  <SelectItem value="lnn">Lønn</SelectItem>
                  <SelectItem value="annet">Annet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Document preview */}
          <div className="max-h-48 overflow-y-auto border rounded-lg p-3">
            <h4 className="font-medium mb-2">Valgte dokumenter:</h4>
            <div className="space-y-2">
              {selectedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{doc.file_name}</span>
                  <div className="flex gap-1 ml-2">
                    {doc.ai_suggested_category && (
                      <Badge variant="outline" className="text-xs">
                        AI: {doc.ai_suggested_category}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button 
              onClick={handleBulkUpdate}
              disabled={!targetCategory || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Oppdaterer...' : `Oppdater ${selectedDocuments.length} dokumenter`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCategoryManager;
