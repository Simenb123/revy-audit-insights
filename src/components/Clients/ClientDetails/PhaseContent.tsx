
import React from 'react';
import { AuditPhase, Client } from '@/types/revio';
import ClientOverviewDashboard from './ClientOverviewDashboard';
import EngagementPhase from './Phases/EngagementPhase';
import PlanningPhase from './Phases/PlanningPhase';
import RiskAssessmentPhase from './Phases/RiskAssessmentPhase';
import ExecutionPhase from './Phases/ExecutionPhase';
import CompletionPhase from './Phases/CompletionPhase';
import ReportingPhase from './Phases/ReportingPhase';

interface PhaseContentProps {
  phase: AuditPhase;
  client: Client;
}

const PhaseContent = ({ phase, client }: PhaseContentProps) => {
  switch (phase) {
    case 'overview':
      return <ClientOverviewDashboard client={client} />;
    case 'engagement':
      return <EngagementPhase client={client} />;
    case 'planning':
      return <PlanningPhase client={client} />;
    case 'risk_assessment':
      return <RiskAssessmentPhase client={client} />;
    case 'execution':
      return <ExecutionPhase client={client} />;
    case 'completion':
      return <CompletionPhase client={client} />;
    case 'reporting':
      return <ReportingPhase client={client} />;
    default:
      return <ClientOverviewDashboard client={client} />;
  }
};

export default PhaseContent;
