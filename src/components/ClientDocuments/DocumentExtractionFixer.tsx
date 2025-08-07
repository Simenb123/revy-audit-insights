import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useDocumentTextExtractionFixer } from '@/hooks/useDocumentTextExtractionFixer';

interface DocumentExtractionFixerProps {
  onUpdate?: () => void;
}

export const DocumentExtractionFixer: React.FC<DocumentExtractionFixerProps> = ({ onUpdate }) => {
  const { resetStuckDocuments, retryFailedDocuments, getProblematicDocuments, isFixing } = useDocumentTextExtractionFixer();
  const [problematicDocs, setProblematicDocs] = useState<{
    stuck: Array<{ id: string; file_name: string; updated_at: string }>;
    failed: Array<{ id: string; file_name: string; extracted_text?: string }>;
  }>({ stuck: [], failed: [] });

  const loadProblematicDocuments = async () => {
    const docs = await getProblematicDocuments();
    setProblematicDocs(docs);
  };

  useEffect(() => {
    loadProblematicDocuments();
  }, []);

  const handleResetStuck = async () => {
    const result = await resetStuckDocuments();
    await loadProblematicDocuments();
    onUpdate?.();
  };

  const handleRetryFailed = async () => {
    const result = await retryFailedDocuments();
    await loadProblematicDocuments();
    onUpdate?.();
  };

  const handleRetrySpecific = async (documentIds: string[]) => {
    const result = await retryFailedDocuments(documentIds);
    await loadProblematicDocuments();
    onUpdate?.();
  };

  const totalProblematic = problematicDocs.stuck.length + problematicDocs.failed.length;

  if (totalProblematic === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Alle dokumenter ser bra ut!</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Ingen dokumenter trenger reparasjon akkurat nå.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5" />
          Dokumenter som trenger oppmerksomhet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stuck Documents */}
        {problematicDocs.stuck.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h4 className="font-medium text-amber-700 dark:text-amber-300">
                  Stuck i "prosessering" ({problematicDocs.stuck.length})
                </h4>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetStuck}
                disabled={isFixing}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                {isFixing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Tilbakestill'}
              </Button>
            </div>
            <div className="space-y-2">
              {problematicDocs.stuck.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div>
                    <p className="text-sm font-medium">{doc.file_name}</p>
                    <p className="text-xs text-gray-500">
                      Stuck siden: {new Date(doc.updated_at).toLocaleString('nb-NO')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    Processing
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        {problematicDocs.stuck.length > 0 && problematicDocs.failed.length > 0 && (
          <Separator />
        )}

        {/* Failed Documents */}
        {problematicDocs.failed.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h4 className="font-medium text-red-700 dark:text-red-300">
                  Feilede dokumenter ({problematicDocs.failed.length})
                </h4>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetryFailed}
                disabled={isFixing}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                {isFixing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Prøv alle på nytt'}
              </Button>
            </div>
            <div className="space-y-2">
              {problematicDocs.failed.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.file_name}</p>
                    {doc.extracted_text && (
                      <p className="text-xs text-red-600 dark:text-red-400 truncate max-w-md">
                        {doc.extracted_text.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Failed</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRetrySpecific([doc.id])}
                      disabled={isFixing}
                      className="text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isFixing && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Reparerer dokumenter...</span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tips:</strong> Stuck dokumenter tilbakestilles til "pending" status. 
            Feilede dokumenter sendes til avansert backend-prosessering.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};