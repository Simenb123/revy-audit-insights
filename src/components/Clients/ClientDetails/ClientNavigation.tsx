
import React from 'react';
import { AuditPhase } from '@/types/revio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { phaseLabels } from '@/constants/phaseLabels';
import { 
  FileText, 
  ClipboardCheck,
  Search,
  AlertTriangle,
  Play,
  CheckCircle,
  FileOutput,
  ChevronRight
} from "lucide-react";

interface ClientNavigationProps {
  currentPhase: AuditPhase;
  selectedPhase: AuditPhase;
  onPhaseSelect: (phase: AuditPhase) => void;
  clientId: string;
}

const phaseConfig = {
  overview: {
    icon: Search,
    color: 'bg-slate-500',
    description: 'Oversikt og generell informasjon'
  },
  engagement: {
    icon: FileText,
    color: 'bg-blue-500',
    description: 'Klientaksept og etablering av oppdragsvilkår'
  },
  planning: {
    icon: ClipboardCheck,
    color: 'bg-purple-500',
    description: 'Revisjonsstrategi og saldobalanse-opplastning'
  },
  risk_assessment: {
    icon: AlertTriangle,
    color: 'bg-orange-500',
    description: 'Vurdering av iboende og kontrollrisiko'
  },
  execution: {
    icon: Play,
    color: 'bg-green-500',
    description: 'Hovedbok-opplastning og utførelse av tester'
  },
  completion: {
    icon: CheckCircle,
    color: 'bg-teal-500',
    description: 'Avslutning av arbeidsprogrammer'
  },
  reporting: {
    icon: FileOutput,
    color: 'bg-indigo-500',
    description: 'Utstedelse av revisjonsberetning'
  }
} as const;

const phases: AuditPhase[] = ['overview', 'engagement', 'planning', 'risk_assessment', 'execution', 'completion', 'reporting'];

// Additional navigation items for client-specific functionality
const additionalNavItems = [
  {
    id: 'regnskapsdata',
    label: 'Regnskapsdata',
    icon: FileText,
    description: 'Saldobalanse, hovedbok og lønnsdata',
    color: 'bg-blue-600'
  }
];

const ClientNavigation = ({ currentPhase, selectedPhase, onPhaseSelect, clientId }: ClientNavigationProps) => {
  const getPhaseStatus = (phase: AuditPhase) => {
    const currentIndex = phases.indexOf(currentPhase);
    const phaseIndex = phases.indexOf(phase);
    
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Revisjonsfaser
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {phases.map((phase, index) => {
            const config = phaseConfig[phase];
            const Icon = config.icon;
            const status = getPhaseStatus(phase);
            const isSelected = selectedPhase === phase;
            
            return (
              <div key={phase} className="relative">
                {index < phases.length - 1 && (
                  <div 
                    className={cn(
                      "absolute left-6 top-12 w-0.5 h-6 transition-colors",
                      status === 'completed' ? 'bg-green-500' : 'bg-border'
                    )}
                  />
                )}
                
                <Button
                  variant={isSelected ? "default" : "ghost"}
                  className={cn(
                    "w-full h-auto p-4 justify-start text-left",
                    !isSelected && "hover:bg-accent"
                  )}
                  onClick={() => onPhaseSelect(phase)}
                >
                  <div className="flex items-start gap-4 w-full">
                    <div className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0",
                      status === 'completed' ? 'bg-green-500 text-white' :
                      status === 'current' ? config.color + ' text-white' :
                      'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{phaseLabels[phase]}</h3>
                        {status === 'completed' && (
                          <Badge variant="secondary" className="text-xs">
                            Fullført
                          </Badge>
                        )}
                        {status === 'current' && (
                          <Badge variant="default" className="text-xs">
                            Aktiv
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                    
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      isSelected && "rotate-90"
                    )} />
                  </div>
                </Button>
              </div>
            );
          })}
          
          {/* Separator line */}
          <div className="my-4 border-t" />
          
          {/* Additional navigation items */}
          {additionalNavItems.map((item) => (
            <div key={item.id}>
              <Button
                variant="ghost"
                className="w-full h-auto p-4 justify-start text-left hover:bg-accent"
                onClick={() => window.location.href = `/clients/${clientId}/accounting-data`}
              >
                <div className="flex items-start gap-4 w-full">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0",
                    item.color + ' text-white'
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.label}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientNavigation;
