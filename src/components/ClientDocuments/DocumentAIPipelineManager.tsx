import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Brain, CheckCircle, Play } from 'lucide-react';
import { useDocumentAIPipeline } from '@/hooks/useDocumentAIPipeline';

interface DocumentAIPipelineManagerProps {
  onUpdate?: () => void;
}

export const DocumentAIPipelineManager: React.FC<DocumentAIPipelineManagerProps> = ({ onUpdate }) => {
  const { processAllPendingDocuments, getPendingCount, isProcessing } = useDocumentAIPipeline();
  const [pendingCount, setPendingCount] = useState<number>(0);

  const loadPendingCount = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  useEffect(() => {
    loadPendingCount();
  }, []);

  const handleProcessPending = async () => {
    const result = await processAllPendingDocuments();
    await loadPendingCount();
    onUpdate?.();
  };

  if (pendingCount === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Alle dokumenter er AI-prosesserte!</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Alle dokumenter har AI-analyse og kategorisering. Nye dokumenter prosesseres automatisk.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Brain className="w-5 h-5" />
          AI-prosessering av dokumenter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-300">
              {pendingCount} dokumenter venter på AI-prosessering
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Disse dokumentene mangler AI-analyse eller kategorisering
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {pendingCount} pending
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleProcessPending}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Prosesserer...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start AI-prosessering
              </>
            )}
          </Button>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Prosesserer dokumenter med AI-analyse og kategorisering...
              </span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Automatisk AI-pipeline aktivert! 🤖
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>• Nye dokumenter analyseres automatisk når tekstutdrag fullføres</p>
            <p>• AI genererer sammendrag og kategoriserer dokumenter</p>
            <p>• AI Revy kan nå søke og referere til dokumentinnhold</p>
            <p>• Prosessering skjer i bakgrunnen uten brukerinteraksjon</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};