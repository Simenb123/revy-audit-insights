
import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, CircleDashed, Loader } from 'lucide-react';
import { PlanningModule } from '@/types/revio';

interface PlanningSidebarProps {
  modules: PlanningModule[];
  activeModuleKey: string;
  setActiveModuleKey: (key: string) => void;
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'completed') {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (status === 'in_progress') {
    return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
  }
  return <CircleDashed className="h-4 w-4 text-gray-400" />;
};

export const PlanningSidebar = ({ modules, activeModuleKey, setActiveModuleKey }: PlanningSidebarProps) => {
  return (
    <aside className="w-80 flex-shrink-0 border-r bg-gray-50/50">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800">2. Planlegging</h2>
        <p className="text-sm text-gray-500">Risikovurdering og strategi</p>
      </div>
      <nav className="flex flex-col">
        {modules.map((module) => (
          <button
            key={module.key}
            onClick={() => setActiveModuleKey(module.key)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150',
              activeModuleKey === module.key ? 'bg-blue-50 border-r-4 border-blue-500' : 'border-r-4 border-transparent'
            )}
          >
            <StatusIcon status={module.status} />
            <div className="flex-1">
              <p className={cn(
                "font-medium text-sm",
                activeModuleKey === module.key ? 'text-blue-700' : 'text-gray-700'
              )}>
                {module.number} {module.title}
              </p>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
};
