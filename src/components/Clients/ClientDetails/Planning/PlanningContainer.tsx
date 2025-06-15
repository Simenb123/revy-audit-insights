
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, PlanningModule, PlanningModuleKey, PlanningModuleStatus } from '@/types/revio';
import { planningModules } from './planningModuleConfig';
import { PlanningSidebar } from './PlanningSidebar';
import { PlanningModuleWrapper } from './PlanningModuleWrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { MaterialityModule } from './modules/MaterialityModule';
import { FraudRiskModule } from './modules/FraudRiskModule';

interface PlanningContainerProps {
  client: Client;
}

const fetchModuleStatuses = async (clientId: string): Promise<PlanningModuleStatus[]> => {
  const { data, error } = await supabase
    .from('planning_module_statuses')
    .select('*')
    .eq('client_id', clientId);
  if (error) throw new Error(error.message);
  return data || [];
};

const ModuleContent = ({ moduleKey }: { moduleKey: PlanningModuleKey }) => {
  switch (moduleKey) {
    case 'MATERIALITY':
      return <MaterialityModule />;
    case 'FRAUD_RISK':
      return <FraudRiskModule />;
    default:
      return <div>Innhold for {moduleKey} kommer snart.</div>;
  }
};

export const PlanningContainer = ({ client }: PlanningContainerProps) => {
  const [activeModuleKey, setActiveModuleKey] = useState<PlanningModuleKey>('ANALYTICAL_REVIEW');

  const { data: statuses, isLoading } = useQuery({
    queryKey: ['planning_statuses', client.id],
    queryFn: () => fetchModuleStatuses(client.id),
  });

  const modulesWithStatus: PlanningModule[] = useMemo(() => {
    return planningModules.map(moduleInfo => {
      const statusInfo = statuses?.find(s => s.module_key === moduleInfo.key);
      return {
        ...moduleInfo,
        status: statusInfo?.status as PlanningModule['status'] || 'not_started',
      };
    });
  }, [statuses]);

  const activeModule = modulesWithStatus.find(m => m.key === activeModuleKey);

  if (isLoading) {
    return (
      <div className="flex h-full">
        <Skeleton className="w-80 flex-shrink-0 border-r" />
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-1/2 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-white h-full">
      <PlanningSidebar
        modules={modulesWithStatus}
        activeModuleKey={activeModuleKey}
        setActiveModuleKey={(key) => setActiveModuleKey(key as PlanningModuleKey)}
      />
      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        {activeModule && (
          <PlanningModuleWrapper module={activeModule}>
            <ModuleContent moduleKey={activeModule.key} />
          </PlanningModuleWrapper>
        )}
      </main>
    </div>
  );
};
