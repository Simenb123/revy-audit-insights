
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { AuditPhase } from '@/types/revio';

interface RevisionWorkflowProps {
  currentPhase: AuditPhase;
  progress: number;
  onPhaseClick?: (phase: AuditPhase) => void;
}

const phases = [
  { 
    key: 'engagement' as AuditPhase, 
    label: 'Oppdragsvurdering', 
    description: 'Klientaksept og oppdragsbrev',
    number: 1
  },
  { 
    key: 'planning' as AuditPhase, 
    label: 'Planlegging', 
    description: 'Materialitet og revisjonsstrategi',
    number: 2
  },
  { 
    key: 'execution' as AuditPhase, 
    label: 'Utførelse', 
    description: 'Testing og dokumentasjon',
    number: 3
  },
  { 
    key: 'conclusion' as AuditPhase, 
    label: 'Avslutning', 
    description: 'Rapporter og konklusjon',
    number: 4
  }
];

const RevisionWorkflow = ({ currentPhase, progress, onPhaseClick }: RevisionWorkflowProps) => {
  const getCurrentPhaseIndex = () => {
    return phases.findIndex(phase => phase.key === currentPhase);
  };

  const getPhaseStatus = (phaseIndex: number) => {
    const currentIndex = getCurrentPhaseIndex();
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getProgressWidth = () => {
    const currentIndex = getCurrentPhaseIndex();
    const baseProgress = (currentIndex / (phases.length - 1)) * 100;
    const phaseProgress = (progress / 100) * (100 / phases.length);
    return Math.min(baseProgress + phaseProgress, 100);
  };

  return (
    <div className="bg-white">
      {/* Phase steps - now the most prominent element at the very top */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(index);
          const isClickable = onPhaseClick && (status === 'completed' || status === 'current');
          
          return (
            <div key={phase.key} className="relative">
              <div
                className={`
                  relative p-5 rounded-xl border-2 transition-all duration-300 
                  ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : 'cursor-default'}
                  ${status === 'current' 
                    ? 'border-blue-500 bg-blue-50 shadow-xl transform scale-105' 
                    : status === 'completed'
                    ? 'border-green-500 bg-green-50 shadow-lg hover:shadow-xl'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }
                `}
                onClick={() => isClickable && onPhaseClick(phase.key)}
              >
                {/* Phase number badge */}
                <div className={`
                  absolute -top-3 -left-3 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-lg
                  ${status === 'current' 
                    ? 'bg-blue-500' 
                    : status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-400'
                  }
                `}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-white">{phase.number}</span>
                  )}
                </div>

                {/* Content */}
                <div className="pt-3">
                  <h3 className={`font-bold text-lg mb-3 ${
                    status === 'current' ? 'text-blue-900' :
                    status === 'completed' ? 'text-green-900' :
                    'text-gray-700'
                  }`}>
                    {phase.label}
                  </h3>
                  <p className={`text-sm ${
                    status === 'current' ? 'text-blue-700' :
                    status === 'completed' ? 'text-green-700' :
                    'text-gray-500'
                  }`}>
                    {phase.description}
                  </p>

                  {/* Action indicator for clickable phases */}
                  {isClickable && (
                    <div className="mt-4 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className={status === 'completed' ? 'text-green-600' : 'text-blue-600'}>
                        Vis detaljer
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                {status === 'current' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                )}
              </div>

              {/* Connector line between phases */}
              {index < phases.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-1 bg-gray-300 transform -translate-y-1/2 z-0">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      getPhaseStatus(index) === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Header and progress bar - now below the phase boxes */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Revisjonsprosess</h2>
            <p className="text-gray-600 text-sm">Følg fremgangen gjennom hele revisjonen</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-base font-bold px-3 py-1">
            {Math.round(getProgressWidth())}% fullført
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default RevisionWorkflow;
