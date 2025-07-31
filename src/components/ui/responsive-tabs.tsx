import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface ResponsiveTabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface ResponsiveTabsProps {
  items: ResponsiveTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'underline';
  sticky?: boolean;
}

const ResponsiveTabs = ({ 
  items, 
  activeTab, 
  onTabChange, 
  className,
  variant = 'default',
  sticky = false
}: ResponsiveTabsProps) => {
  return (
    <div className={cn(
      "border-b bg-background",
      sticky && "sticky top-[var(--client-header-height)] z-40",
      className
    )}>
      <div className="flex space-x-2 overflow-x-auto px-4 py-2 scrollbar-hide">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center space-x-2 whitespace-nowrap transition-all duration-200",
                variant === 'underline' && [
                  "border-b-2 rounded-none",
                  isActive 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-transparent hover:border-border hover:bg-muted/50"
                ],
                variant === 'default' && [
                  isActive && "bg-primary text-primary-foreground",
                  !isActive && "hover:bg-muted"
                ]
              )}
              onClick={() => onTabChange(item.id)}
            >
              {Icon && <Icon size={16} />}
              <span>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ResponsiveTabs;