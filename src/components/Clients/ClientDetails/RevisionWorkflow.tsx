
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

  const getPhaseIcon = (phaseIndex: number) => {
    const status = getPhaseStatus(phaseIndex);
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-white" />;
    if (status === 'current') return <Clock className="w-5 h-5 text-white" />;
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const getProgressWidth = () => {
    const currentIndex = getCurrentPhaseIndex();
    const baseProgress = (currentIndex / (phases.length - 1)) * 100;
    const phaseProgress = (progress / 100) * (100 / phases.length);
    return Math.min(baseProgress + phaseProgress, 100);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Revisjonsprosess</h2>
              <p className="text-blue-100 text-sm">Følg fremgangen gjennom hele revisjonen</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 text-lg font-bold px-4 py-2 backdrop-blur-sm">
            {Math.round(getProgressWidth())}% fullført
          </Badge>
        </div>
        
        {/* Enhanced progress bar */}
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${getProgressWidth()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Phase steps */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(index);
            const isClickable = onPhaseClick && status !== 'upcoming';
            
            return (
              <div key={phase.key} className="relative">
                <div
                  className={`
                    relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer group
                    ${status === 'current' 
                      ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105 ring-2 ring-blue-200' 
                      : status === 'completed'
                      ? 'border-green-500 bg-green-50 shadow-md hover:shadow-lg'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }
                    ${isClickable ? 'hover:scale-102 hover:shadow-xl' : 'cursor-default'}
                  `}
                  onClick={() => isClickable && onPhaseClick(phase.key)}
                >
                  {/* Phase number badge */}
                  <div className={`
                    absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${status === 'current' 
                      ? 'bg-blue-500' 
                      : status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                    }
                  `}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white">{phase.number}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-2">
                    <h3 className={`font-bold text-sm mb-2 ${
                      status === 'current' ? 'text-blue-900' :
                      status === 'completed' ? 'text-green-900' :
                      'text-gray-700'
                    }`}>
                      {phase.label}
                    </h3>
                    <p className={`text-xs leading-relaxed ${
                      status === 'current' ? 'text-blue-700' :
                      status === 'completed' ? 'text-green-700' :
                      'text-gray-500'
                    }`}>
                      {phase.description}
                    </p>

                    {/* Action indicator for clickable phases */}
                    {isClickable && (
                      <div className="mt-3 flex items-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-300 transform -translate-y-1/2 z-0">
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
    </div>
  );
};

export default RevisionWorkflow;
