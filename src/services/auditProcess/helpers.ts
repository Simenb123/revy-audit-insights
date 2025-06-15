
import { AuditPhase, Client } from '@/types/revio';
import { AuditProcessInsight } from '@/types/auditProcess';

export const getNextSteps = (phase: AuditPhase, actions: any[], client: Client): string[] => {
  const nextSteps: string[] = [];
  
  // Get incomplete actions in current phase
  const currentPhaseActions = actions.filter(a => 
    a.phase === phase && a.status !== 'completed'
  );
  
  if (currentPhaseActions.length > 0) {
    nextSteps.push(`Fullfør ${currentPhaseActions.length} gjenstående handlinger i ${phase}-fasen`);
  }
  
  // Phase-specific next steps
  switch (phase) {
    case 'planning':
      nextSteps.push('Ferdigstill materialitetsvurdering og risikoanalyse');
      break;
    case 'risk_assessment':
      nextSteps.push('Planlegg testing basert på identifiserte risikoer');
      break;
    case 'execution':
      nextSteps.push('Gjennomfør substansielle tester og evaluer funn');
      break;
    case 'completion':
      nextSteps.push('Utarbeid utkast til revisjonsberetning');
      break;
  }
  
  return nextSteps;
};

export const getRequiredActions = (phase: AuditPhase, actions: any[], client: Client): string[] => {
  const required: string[] = [];
  
  // Check for missing critical actions per phase
  const phaseRequirements = {
    'planning': ['materialitet', 'risikovurdering', 'revisjonsplan'],
    'risk_assessment': ['kontrollmiljø', 'IT-kontroller', 'prosessforståelse'],
    'execution': ['substansiell testing', 'kontrolltest', 'analytiske handlinger'],
    'completion': ['evaluering', 'konklusjon', 'kvalitetskontroll']
  };
  
  const requirements = phaseRequirements[phase as keyof typeof phaseRequirements] || [];
  
  requirements.forEach(req => {
    const hasAction = actions.some(a => 
      a.name.toLowerCase().includes(req) || 
      a.description?.toLowerCase().includes(req)
    );
    
    if (!hasAction) {
      required.push(`Opprett handling for ${req}`);
    }
  });
  
  return required;
};

export const assessRiskAreas = (client: Client, actions: any[]): string[] => {
  const risks: string[] = [];
  
  // Industry-specific risks
  if (client.industry?.includes('finans')) {
    risks.push('Kredittrisiko', 'Markedsrisiko', 'Regulatorisk risiko');
  }
  
  // Progress-based risks
  if (client.progress < 25) {
    risks.push('Forsinkelsesrisiko');
  }
  
  // Action-based risks
  const overdueActions = actions.filter(a => 
    a.due_date && new Date(a.due_date) < new Date() && a.status !== 'completed'
  );
  
  if (overdueActions.length > 0) {
    risks.push('Overskridelse av frister');
  }
  
  return risks;
};

export const generateDeadlines = (phase: AuditPhase, actions: any[], client: Client): any[] => {
  const deadlines: any[] = [];
  
  // Add action deadlines
  actions
    .filter(a => a.due_date && a.status !== 'completed')
    .forEach(action => {
      deadlines.push({
        task: action.name,
        date: action.due_date,
        priority: action.risk_level === 'high' ? 'high' : 'medium'
      });
    });
  
  // Add phase-specific deadlines
  if (client.year_end_date) {
    const yearEnd = new Date(client.year_end_date);
    deadlines.push({
      task: 'Ferdigstill revisjon',
      date: new Date(yearEnd.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days after year end
      priority: 'high'
    });
  }
  
  return deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const generateRecommendations = (phase: AuditPhase, client: Client, actions: any[], userRole: string): string[] => {
  const recommendations: string[] = [];
  
  // Role-specific recommendations
  if (userRole === 'partner') {
    recommendations.push('Gjennomfør strategisk review av tilnærming og risiko');
  } else if (userRole === 'manager') {
    recommendations.push('Overvåk teamets fremdrift og ressursbruk');
  } else {
    recommendations.push('Diskuter komplekse områder med ansvarlig manager');
  }
  
  // Progress-based recommendations
  if (client.progress < 50) {
    recommendations.push('Vurder ekstra ressurser for å overholde tidsplan');
  }
  
  return recommendations;
};

export const getDefaultInsight = (phase: AuditPhase): AuditProcessInsight => ({
  currentPhase: phase,
  nextSteps: ['Gjennomgå revisjonsplan og identifiser neste aktiviteter'],
  requiredActions: ['Sørg for at alle nødvendige handlinger er planlagt'],
  riskAreas: ['Vurder tidsplan og ressurser'],
  deadlines: [],
  completionRate: 0,
  recommendations: ['Kontakt manager for veiledning om revisjonsfremdrift']
});
