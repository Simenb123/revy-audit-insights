
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
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Revisjonsprosess</h2>
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          {progress}% fullført
        </Badge>
      </div>
      
      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
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
                  ? 'border-blue-400 bg-blue-50' 
                  : status === 'completed'
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
                }
                ${isClickable ? 'hover:shadow-sm' : 'cursor-default'}
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
