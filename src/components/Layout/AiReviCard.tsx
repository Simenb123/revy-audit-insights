
import React from 'react';
import { Bot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant';
import { RevyContext } from '@/types/revio';

interface AiReviCardProps {
  context: RevyContext;
  clientData?: any;
  title?: string;
  description?: string;
}

const AiReviCard = ({ 
  context, 
  clientData, 
  title = "AI-Revi Assistent",
  description = "Din smarte revisjonsassistent" 
}: AiReviCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SmartReviAssistant 
          embedded={true}
          context={context}
          clientData={clientData}
        />
      </CardContent>
    </Card>
  );
};

export default AiReviCard;
