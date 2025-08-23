import React from 'react';
import { AuditPhase } from '@/types/revio';
import { phaseInfo } from '@/constants/phaseInfo';
import { cn } from '@/lib/utils';

interface CompactPhaseNavigationProps {
  currentPhase: AuditPhase;
  onPhaseClick?: (phase: AuditPhase) => void;
}

const phases: AuditPhase[] = ['overview', 'engagement', 'planning', 'execution', 'completion'];

const CompactPhaseNavigation = ({ currentPhase, onPhaseClick }: CompactPhaseNavigationProps) => {
  const getCurrentPhaseIndex = () => {
    return phases.findIndex(phase => phase === currentPhase);
  };

  const getPhaseStatus = (phaseIndex: number) => {
    const currentIndex = getCurrentPhaseIndex();
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-white border border-border rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(index);
          const info = phaseInfo[phase];
          const IconComponent = info.icon;
          const isClickable = onPhaseClick;
          
          return (
            <React.Fragment key={phase}>
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer hover:scale-105 min-w-0 flex-1",
                  status === 'current' 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : status === 'completed'
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                onClick={() => isClickable && onPhaseClick(phase)}
              >
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs",
                  status === 'current' 
                    ? 'bg-primary-foreground text-primary' 
                    : status === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-background text-muted-foreground'
                )}>
                  <IconComponent className="w-3 h-3" />
                </div>
                <span className="font-medium text-sm truncate">{info.label}</span>
              </div>
              
              {/* Connector arrow */}
              {index < phases.length - 1 && (
                <div className={cn(
                  "flex-shrink-0 w-6 h-0.5 transition-colors",
                  getPhaseStatus(index) === 'completed' ? 'bg-green-500' : 'bg-border'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CompactPhaseNavigation;