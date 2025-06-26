
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar } from 'lucide-react';
import AiReviCard from './AiReviCard';

interface ClientSidebarSectionProps {
  clientId: string;
  documentsCount: number;
  categoriesCount: number;
}

const ClientSidebarSection: React.FC<ClientSidebarSectionProps> = ({
  clientId,
  documentsCount,
  categoriesCount
}) => {
  return (
    <div className="flex flex-col h-full space-y-4 pb-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Dokumenter
          </CardTitle>
          <CardDescription>
            Dokumentstatus for klient
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Totalt dokumenter</span>
            <Badge variant="secondary">{documentsCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Kategorier</span>
            <Badge variant="outline">{categoriesCount}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Aktivitet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ingen nylig aktivitet
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ingen teammedlemmer tilordnet
          </p>
        </CardContent>
      </Card>

      <AiReviCard
        context="client-detail"
        clientData={{ id: clientId }}
        title="AI-Revi Assistent"
        description="Klientspesifikk revisjonsassistanse"
        className="mt-auto"
      />
    </div>
  );
};

export default ClientSidebarSection;
