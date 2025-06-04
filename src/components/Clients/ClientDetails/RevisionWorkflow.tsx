
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { AuditPhase } from '@/types/revio';

interface RevisionWorkflowProps {
  currentPhase: AuditPhase;
  progress: number;
  onPhaseClick?: (phase: AuditPhase) => void;
}

const phases = [
  { 
    key: 'engagement' as AuditPhase, 
    label: '1. Oppdragsvurdering', 
    description: 'Start'
  },
  { 
    key: 'planning' as AuditPhase, 
    label: '2. Planlegging', 
    description: 'Strategi & Materialitet'
  },
  { 
    key: 'execution' as AuditPhase, 
    label: '3. Utførelse', 
    description: 'Testing & Dokumentasjon'
  },
  { 
    key: 'conclusion' as AuditPhase, 
    label: '4. Avslutning', 
    description: 'Rapporter & Konklusjon'
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
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'current') return <Clock className="w-4 h-4 text-blue-600" />;
    return <Circle className="w-4 h-4 text-gray-400" />;
  };

  const getProgressWidth = () => {
    const currentIndex = getCurrentPhaseIndex();
    const baseProgress = (currentIndex / (phases.length - 1)) * 100;
    const phaseProgress = (progress / 100) * (100 / phases.length);
    return Math.min(baseProgress + phaseProgress, 100);
  };

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-blue-900">Revisjonsprosess</h2>
        <Badge variant="outline" className="text-sm bg-blue-100 text-blue-800 border-blue-300 font-medium">
          {progress}% fullført
        </Badge>
      </div>
      
      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>
      </div>

      {/* Phase steps */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(index);
          const isClickable = onPhaseClick && status !== 'upcoming';
          
          return (
            <div
              key={phase.key}
              className={`
                p-3 rounded-md border transition-all cursor-pointer text-center
                ${status === 'current' 
                  ? 'border-blue-500 bg-blue-100 shadow-sm' 
                  : status === 'completed'
                  ? 'border-green-500 bg-green-100 shadow-sm'
                  : 'border-gray-300 bg-white'
                }
                ${isClickable ? 'hover:shadow-md transform hover:scale-105' : 'cursor-default'}
              `}
              onClick={() => isClickable && onPhaseClick(phase.key)}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {getPhaseIcon(index)}
                <span className={`font-medium text-xs ${
                  status === 'current' ? 'text-blue-900' :
                  status === 'completed' ? 'text-green-900' :
                  'text-gray-600'
                }`}>
                  {phase.label}
                </span>
              </div>
              <p className={`text-xs ${
                status === 'current' ? 'text-blue-700' :
                status === 'completed' ? 'text-green-700' :
                'text-gray-500'
              }`}>
                {phase.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RevisionWorkflow;
