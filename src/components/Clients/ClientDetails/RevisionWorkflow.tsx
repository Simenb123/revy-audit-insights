
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, TrendingUp } from 'lucide-react';
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
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'current') return <Clock className="w-5 h-5 text-blue-600" />;
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const getProgressWidth = () => {
    const currentIndex = getCurrentPhaseIndex();
    const baseProgress = (currentIndex / (phases.length - 1)) * 100;
    const phaseProgress = (progress / 100) * (100 / phases.length);
    return Math.min(baseProgress + phaseProgress, 100);
  };

  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
      {/* Header with title and progress */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Revisjonsprosess</h2>
        </div>
        <Badge variant="outline" className="text-base bg-blue-50 text-blue-800 border-blue-300 font-semibold px-4 py-2">
          {progress}% fullført
        </Badge>
      </div>
      
      {/* Enhanced progress bar */}
      <div className="relative mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>
        <div className="absolute -top-1 right-0 text-xs text-gray-500 font-medium">
          {Math.round(getProgressWidth())}%
        </div>
      </div>

      {/* Phase steps */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(index);
          const isClickable = onPhaseClick && status !== 'upcoming';
          
          return (
            <div
              key={phase.key}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer text-center
                ${status === 'current' 
                  ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105' 
                  : status === 'completed'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
                }
                ${isClickable ? 'hover:shadow-lg hover:scale-105' : 'cursor-default'}
              `}
              onClick={() => isClickable && onPhaseClick(phase.key)}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {getPhaseIcon(index)}
                <span className={`font-semibold text-sm ${
                  status === 'current' ? 'text-blue-900' :
                  status === 'completed' ? 'text-green-900' :
                  'text-gray-600'
                }`}>
                  {phase.label}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${
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
