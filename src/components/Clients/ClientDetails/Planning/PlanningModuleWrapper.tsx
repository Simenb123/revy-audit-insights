
import React from 'react';
import { PlanningModule } from '@/types/revio';

interface PlanningModuleWrapperProps {
  module: PlanningModule;
  children: React.ReactNode;
}

export const PlanningModuleWrapper = ({ module, children }: PlanningModuleWrapperProps) => {
  return (
    <div className="p-6 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{module.number} {module.title}</h1>
        <p className="text-md text-gray-600 mt-1">{module.subtitle}</p>
      </header>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        {children}
      </div>
    </div>
  );
};
