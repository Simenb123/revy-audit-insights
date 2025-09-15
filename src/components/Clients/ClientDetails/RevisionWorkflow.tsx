
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, TrendingUp, ArrowRight, Target } from 'lucide-react';
import { AuditPhase } from '@/types/revio';
import { useClientAuditActions } from '@/hooks/useAuditActions';
import { phaseInfo } from '@/constants/phaseInfo';

interface RevisionWorkflowProps {
  currentPhase: AuditPhase;
  progress: number;
  onPhaseClick?: (phase: AuditPhase) => void;
  clientId?: string;
}

const phases = [
  { key: 'engagement' as AuditPhase, number: 1 },
  { key: 'planning' as AuditPhase, number: 2 },
  { key: 'risk_assessment' as AuditPhase, number: 3 },
  { key: 'execution' as AuditPhase, number: 4 },
  { key: 'completion' as AuditPhase, number: 5 },
  { key: 'reporting' as AuditPhase, number: 6 }
];

const RevisionWorkflow = ({ currentPhase, progress, onPhaseClick, clientId }: RevisionWorkflowProps) => {
  const { data: clientActions = [] } = useClientAuditActions(clientId || '');

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

  const getPhaseActionCount = (phaseKey: AuditPhase) => {
    return clientActions.filter(action => action.phase === phaseKey).length;
  };

  const getPhaseCompletedActions = (phaseKey: AuditPhase) => {
    return clientActions.filter(action => action.phase === phaseKey && action.status === 'completed').length;
  };

  return (
    <div className="bg-white">
      {/* Header and progress bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
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
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>
      </div>

      {/* Stepper Design - Smaller, More Connected */}
      <div className="relative">
        {/* Main connector line */}
        <div className="hidden md:block absolute top-10 left-8 right-8 h-1 bg-gray-200 z-0">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000"
            style={{ width: `${getProgressWidth()}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {phases.map((phase, index) => {
            const status = getPhaseStatus(index);
            const isClickable = onPhaseClick;
            const info = phaseInfo[phase.key];
            const IconComponent = info.icon;
            const actionCount = getPhaseActionCount(phase.key);
            const completedCount = getPhaseCompletedActions(phase.key);
            
            return (
              <div key={phase.key} className="relative flex flex-col items-center">
                {/* Stepper Circle */}
                <div 
                  className={`
                    relative z-10 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300 cursor-pointer group
                    ${status === 'current' 
                      ? 'border-blue-500 bg-blue-500 shadow-xl transform scale-110' 
                      : status === 'completed'
                      ? 'border-green-500 bg-green-500 shadow-lg'
                      : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
                    }
                  `}
                  onClick={() => isClickable && onPhaseClick(phase.key)}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : status === 'current' ? (
                    <IconComponent className="w-8 h-8 text-white" />
                  ) : (
                    <span className={`text-lg font-bold ${status === 'upcoming' ? 'text-gray-400' : 'text-white'}`}>
                      {phase.number}
                    </span>
                  )}
                  
                  {/* Step number badge for current/completed */}
                  <div className={`
                    absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center
                    ${status === 'current' ? 'bg-blue-600 text-white' :
                      status === 'completed' ? 'bg-green-600 text-white' :
                      'bg-gray-400 text-white'
                    }
                  `}>
                    {phase.number}
                  </div>
                </div>

                {/* Content Card - Smaller and Compact */}
                <div 
                  className={`
                    mt-3 p-2 rounded-lg border transition-all duration-200 cursor-pointer group-hover:shadow-md min-h-[80px] w-full
                    ${status === 'current' 
                      ? 'border-blue-200 bg-blue-50' 
                      : status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => isClickable && onPhaseClick(phase.key)}
                >
                  <h3 className={`font-semibold text-sm mb-1 text-center ${
                    status === 'current' ? 'text-blue-900' :
                    status === 'completed' ? 'text-green-900' :
                    'text-gray-700'
                  }`}>
                    {info.label}
                  </h3>
                  
                  <p className={`text-xs text-center mb-2 leading-tight ${
                    status === 'current' ? 'text-blue-700' :
                    status === 'completed' ? 'text-green-700' :
                    'text-gray-500'
                  }`}>
                    {info.description}
                  </p>

                  {/* Compact action count */}
                  {actionCount > 0 && (
                    <div className={`text-xs font-medium text-center ${
                      status === 'current' ? 'text-blue-600' :
                      status === 'completed' ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {completedCount}/{actionCount}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RevisionWorkflow;
