
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Calendar,
  CheckSquare,
  BarChart3,
  Settings
} from "lucide-react";

interface ClientNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ClientNavigation = ({ activeTab, onTabChange }: ClientNavigationProps) => {
  const tabs = [
    { id: 'overview', label: 'Oversikt', icon: TrendingUp },
    { id: 'audit-actions', label: 'Revisjonshandlinger', icon: CheckSquare },
    { id: 'workflow', label: 'Arbeidsflyt', icon: FileText },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'communication', label: 'Kommunikasjon', icon: MessageSquare },
    { id: 'analysis', label: 'Analyse', icon: BarChart3 },
    { id: 'schedule', label: 'Tidsplan', icon: Calendar },
    { id: 'settings', label: 'Innstillinger', icon: Settings },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex space-x-8 overflow-x-auto px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`flex items-center space-x-2 whitespace-nowrap py-4 ${
                activeTab === tab.id 
                  ? "border-b-2 border-revio-500 bg-revio-50 text-revio-700" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ClientNavigation;
