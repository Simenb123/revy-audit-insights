
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import KnowledgeStatusIndicator from '@/components/Revy/KnowledgeStatusIndicator';
import AiReviCard from './AiReviCard';

const KnowledgeSidebarSection: React.FC = () => {
  return (
    <div className="space-y-4">
      <KnowledgeStatusIndicator />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Kunnskapsbase
          </CardTitle>
          <CardDescription>
            AI Revi fagstoff og artikler
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status</span>
            <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>AI Revi kan svare på spørsmål basert på fagartiklene i kunnskapsbasen.</p>
          </div>
        </CardContent>
      </Card>

      <AiReviCard 
        context="knowledge-base"
        title="AI-Revi Assistent"
        description="Spør AI-Revi om fagstoff og artikler"
      />
    </div>
  );
};

export default KnowledgeSidebarSection;
