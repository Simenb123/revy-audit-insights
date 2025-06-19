
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ContextAwareRevyChat from './ContextAwareRevyChat';

interface EmbeddedContextChatProps {
  clientId?: string;
  clientData?: any;
  context: string;
  title?: string;
  height?: string;
}

const EmbeddedContextChat: React.FC<EmbeddedContextChatProps> = ({
  clientId,
  clientData,
  context,
  title = "AI-Assistanse",
  height = "400px"
}) => {
  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardContent className="p-4" style={{ height }}>
        <ContextAwareRevyChat
          clientId={clientId}
          clientData={clientData}
          context={context}
          embedded={true}
          showVariantSelector={false}
        />
      </CardContent>
    </Card>
  );
};

export default EmbeddedContextChat;
