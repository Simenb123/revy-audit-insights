
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ContextAwareRevyChat from './ContextAwareRevyChat';
import { Client } from '@/types/revio';

interface EmbeddedContextChatProps {
  client: Client;
  context: string;
  title?: string;
  height?: string;
}

const EmbeddedContextChat: React.FC<EmbeddedContextChatProps> = ({
  client,
  context,
  title = "AI-Revi Assistanse",
  height = "400px"
}) => {
  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardContent className="p-4" style={{ height }}>
        <ContextAwareRevyChat
          client={client}
          className="h-full"
        />
      </CardContent>
    </Card>
  );
};

export default EmbeddedContextChat;
