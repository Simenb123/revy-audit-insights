import React from 'react';
import { useLocation } from 'react-router-dom';
import SimplifiedSidebarSection from './SimplifiedSidebarSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDollarSign, Users, Building2, Briefcase } from 'lucide-react';

const ClientSidebarSection = () => {
  const location = useLocation();
  
  // Extract client ID from the URL path
  const pathSegments = location.pathname.split('/');
  const clientIdIndex = pathSegments.findIndex(segment => segment === 'client') + 1;
  const clientId = pathSegments[clientIdIndex];

  if (!clientId) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Klientstatus
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          <div className="flex items-center text-xs text-muted-foreground">
            <CircleDollarSign className="w-3 h-3 mr-1" />
            Omsetning: <span className="ml-auto font-medium">1.2M</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Users className="w-3 h-3 mr-1" />
            Ansatte: <span className="ml-auto font-medium">25</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Briefcase className="w-3 h-3 mr-1" />
            Bransje: <span className="ml-auto font-medium">Teknologi</span>
          </div>
        </CardContent>
      </Card>
      
      <SimplifiedSidebarSection
        clientData={{ id: clientId }}
        title="AI-Revy for klient"
        description="Spør om denne klienten"
        className="border-l-4 border-l-blue-500"
        context="client-detail"
      />
    </div>
  );
};

export default ClientSidebarSection;
