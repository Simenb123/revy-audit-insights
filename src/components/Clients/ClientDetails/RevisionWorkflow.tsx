
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
      {/* Compact header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Revisjonsprosess</h2>
            <p className="text-gray-600 text-sm">Følg fremgangen gjennom hele revisjonen</p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm font-bold px-3 py-1">
          {Math.round(getProgressWidth())}% fullført
        </Badge>
      </div>

      {/* Compact progress bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700"
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>
      </div>

      {/* Compact phase steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(index);
          const isClickable = onPhaseClick && status !== 'upcoming';
          
          return (
            <div key={phase.key} className="relative">
              <div
                className={`
                  relative p-3 rounded-lg border transition-all duration-300 cursor-pointer group
                  ${status === 'current' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : status === 'completed'
                    ? 'border-green-500 bg-green-50 shadow-sm hover:shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }
                  ${isClickable ? 'hover:scale-102' : 'cursor-default'}
                `}
                onClick={() => isClickable && onPhaseClick(phase.key)}
              >
                {/* Compact phase number badge */}
                <div className={`
                  absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${status === 'current' 
                    ? 'bg-blue-500' 
                    : status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-400'
                  }
                `}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-3 h-3 text-white" />
                  ) : (
                    <span className="text-white">{phase.number}</span>
                  )}
                </div>

                {/* Compact content */}
                <div className="pt-1">
                  <h3 className={`font-semibold text-sm mb-1 ${
                    status === 'current' ? 'text-blue-900' :
                    status === 'completed' ? 'text-green-900' :
                    'text-gray-700'
                  }`}>
                    {phase.label}
                  </h3>
                  <p className={`text-xs ${
                    status === 'current' ? 'text-blue-700' :
                    status === 'completed' ? 'text-green-700' :
                    'text-gray-500'
                  }`}>
                    {phase.description}
                  </p>

                  {/* Action indicator for clickable phases */}
                  {isClickable && (
                    <div className="mt-2 flex items-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className={status === 'completed' ? 'text-green-600' : 'text-blue-600'}>
                        Vis detaljer
                      </span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line between phases */}
              {index < phases.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-1.5 w-3 h-0.5 bg-gray-300 transform -translate-y-1/2 z-0">
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
    </div>
  );
};

export default RevisionWorkflow;
