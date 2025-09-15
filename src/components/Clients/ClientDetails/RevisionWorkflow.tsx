
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
  { key: 'overview' as AuditPhase, number: 0 },
  { key: 'engagement' as AuditPhase, number: 1 },
  { key: 'planning' as AuditPhase, number: 2 },
  { key: 'execution' as AuditPhase, number: 3 },
  { key: 'completion' as AuditPhase, number: 4 }
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

      {/* Phase steps - now with equal sizing and action counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(index);
          const isClickable = onPhaseClick;
          const info = phaseInfo[phase.key];
          const IconComponent = info.icon;
          const actionCount = getPhaseActionCount(phase.key);
          const completedCount = getPhaseCompletedActions(phase.key);
          
          return (
            <div key={phase.key} className="relative">
              <div
                className={`
                  relative p-3 rounded-xl border-2 transition-all duration-300 group cursor-pointer hover:scale-105 hover:shadow-xl min-h-[120px] flex flex-col justify-between
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
                  ) : IconComponent ? (
                    <IconComponent className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-white">{phase.number}</span>
                  )}
                </div>

                {/* Content */}
                <div className="pt-3 flex-1">
                  <h3 className={`font-bold text-base mb-2 ${
                    status === 'current' ? 'text-blue-900' :
                    status === 'completed' ? 'text-green-900' :
                    'text-gray-700'
                  }`}>
                    {info.label}
                  </h3>
                  <p className={`text-sm mb-3 ${
                    status === 'current' ? 'text-blue-700' :
                    status === 'completed' ? 'text-green-700' :
                    'text-gray-500'
                  }`}>
                    {info.description}
                  </p>

                  {/* Action count display */}
                  {actionCount > 0 && (
                    <div className={`text-xs font-medium ${
                      status === 'current' ? 'text-blue-600' :
                      status === 'completed' ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{completedCount}/{actionCount} handlinger</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action indicator */}
                <div className="mt-3 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={status === 'completed' ? 'text-green-600' : 'text-blue-600'}>
                    Vis detaljer
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
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
    </div>
  );
};

export default RevisionWorkflow;
