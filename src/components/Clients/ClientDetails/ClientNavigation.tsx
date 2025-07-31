
import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  Upload
} from "lucide-react";

interface ClientNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ClientNavigation = ({ activeTab, onTabChange }: ClientNavigationProps) => {
  const { clientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  
  const tabs = [
    { id: 'dashboard', label: 'Oversikt', icon: TrendingUp, path: `/clients/${clientId}/dashboard` },
    { id: 'trial-balance', label: 'Saldobalanse', icon: BarChart3, path: `/clients/${clientId}/trial-balance` },
    { id: 'general-ledger', label: 'Hovedbok', icon: FileText, path: `/clients/${clientId}/general-ledger` },
  ];
  
  const currentPath = location.pathname;

  return (
    <div className="sticky top-[var(--client-header-height)] z-40 bg-background border-b">
      <div className="flex space-x-1 overflow-x-auto px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path || 
                          (tab.id === 'dashboard' && currentPath === `/clients/${clientId}`);
          
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={cn(
                "flex items-center space-x-2 whitespace-nowrap py-4 px-3 rounded-t-lg border-b-2 text-sm font-medium transition-colors",
                isActive 
                  ? "border-primary bg-primary/5 text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => onTabChange?.(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ClientNavigation;
