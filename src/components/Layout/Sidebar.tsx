import React from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import GeneralSidebarSection from './GeneralSidebarSection';
import ClientSidebarSection from './ClientSidebarSection';
import KnowledgeSidebarSection from './KnowledgeSidebarSection';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col border-r bg-background">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <GeneralSidebarSection />
          <ClientSidebarSection />
          <KnowledgeSidebarSection />
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
