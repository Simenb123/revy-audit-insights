
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, AlertCircle } from 'lucide-react';
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useUserProfile } from '@/hooks/useUserProfile';

interface StreamlinedClientSidebarProps {
  clientId: string;
}

const StreamlinedClientSidebar: React.FC<StreamlinedClientSidebarProps> = ({ clientId }) => {
  const { data: client } = useClientDetails(clientId);
  const { data: userProfile } = useUserProfile();

  const userRole = userProfile?.userRole || 'employee';

  if (!client) return null;

  return (
    <div className="space-y-4">
      {/* Compact Client Status */}
      <div className="px-3 py-2 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={client.phase === 'completion' ? 'default' : 'secondary'} className="text-xs">
            {client.phase === 'overview' && 'Oversikt'}
            {client.phase === 'engagement' && 'Oppdrag'}
            {client.phase === 'planning' && 'Planlegging'}
            {client.phase === 'risk_assessment' && 'Risikovurdering'}
            {client.phase === 'execution' && 'Gjennomføring'}
            {client.phase === 'completion' && 'Fullføring'}
            {client.phase === 'reporting' && 'Rapportering'}
          </Badge>
        </div>
        {client.progress !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Fremdrift</span>
              <span className="text-muted-foreground">{client.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${client.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* AI-Revy Assistant - Always Open */}
      <Card className="border-0 shadow-none bg-background/50">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            AI-Revy Assistent
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-3 pb-3">
            <SmartReviAssistant
              embedded
              clientData={client}
              userRole={userRole}
              context="client-detail"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamlinedClientSidebar;
