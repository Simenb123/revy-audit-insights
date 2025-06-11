
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Client } from '@/types/revio';
import ClientHeader from './ClientHeader';
import ClientNavigation from './ClientNavigation';
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
        return (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Oversikt</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Fase</h4>
                  <p className="text-lg">{client.phase}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Fremgang</h4>
                  <p className="text-lg">{client.progress}%</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Organisasjonsnummer</h4>
                  <p className="text-lg">{client.org_number}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'audit-actions':
        return <AuditActionsTab clientId={client.id} phase={client.phase} />;
      case 'workflow':
        return (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Arbeidsflyt</h3>
              <p className="text-gray-600">Arbeidsflytfunksjonalitet kommer snart...</p>
            </CardContent>
          </Card>
        );
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
        return (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Oversikt</h3>
              <p className="text-gray-600">Oversiktsfunksjonalitet kommer snart...</p>
            </CardContent>
          </Card>
        );
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
