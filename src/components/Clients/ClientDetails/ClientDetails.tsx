
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Client } from '@/types/revio';
import ClientHeader from './ClientHeader';
import ClientNavigation from './ClientNavigation';
import Overview from './ClientDashboard/Overview';
import AuditActionsTab from './AuditActionsTab';
import RevisionWorkflow from './RevisionWorkflow';
import PhaseContent from './PhaseContent';

interface ClientDetailsProps {
  client: Client;
}

const ClientDetails = ({ client }: ClientDetailsProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview client={client} />;
      case 'audit-actions':
        return <AuditActionsTab clientId={client.id} phase={client.phase} />;
      case 'workflow':
        return <RevisionWorkflow client={client} />;
      case 'team':
        return (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Team</h3>
              <p className="text-gray-600">Teamfunksjonalitet kommer snart...</p>
            </CardContent>
          </Card>
        );
      case 'communication':
        return (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Kommunikasjon</h3>
              <p className="text-gray-600">Kommunikasjonsfunksjonalitet kommer snart...</p>
            </CardContent>
          </Card>
        );
      case 'analysis':
        return (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analyse</h3>
              <p className="text-gray-600">Analysefunksjonalitet kommer snart...</p>
            </CardContent>
          </Card>
        );
      case 'schedule':
        return (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Tidsplan</h3>
              <p className="text-gray-600">Tidsplanfunksjonalitet kommer snart...</p>
            </CardContent>
          </Card>
        );
      case 'settings':
        return (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Innstillinger</h3>
              <p className="text-gray-600">Innstillinger kommer snart...</p>
            </CardContent>
          </Card>
        );
      default:
        return <Overview client={client} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <ClientHeader client={client} />
      <ClientNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ClientDetails;
