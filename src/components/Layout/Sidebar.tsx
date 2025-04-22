
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Home, BarChart2, FileText, FolderOpen, Settings, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const mainNavItems: NavItem[] = [
  {
    label: 'Klienter',
    href: '/klienter',
    icon: <Users size={20} />,
  },
  {
    label: 'Regnskap',
    href: '/klienter/:orgNumber/regnskap',
    icon: <FileText size={20} />,
  },
  {
    label: 'Dashboard',
    href: '/',
    icon: <Home size={20} />,
  },
  {
    label: 'Analyser',
    href: '/analyser',
    icon: <BarChart2 size={20} />,
  },
  {
    label: 'Dokumenter',
    href: '/dokumenter',
    icon: <FileText size={20} />,
  },
  {
    label: 'Prosjekter',
    href: '/prosjekter',
    icon: <FolderOpen size={20} />,
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: 'Innstillinger',
    href: '/innstillinger',
    icon: <Settings size={20} />,
  },
  {
    label: 'Hjelp',
    href: '/hjelp',
    icon: <HelpCircle size={20} />,
  },
];

const Sidebar = () => {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  const NavItem = ({ item, isActive }: { item: NavItem; isActive: boolean }) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            to={item.href} 
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100",
              isActive && "bg-revio-100 font-medium",
              isCollapsed && "justify-center px-2"
            )}
          >
            <span className="text-revio-900">{item.icon}</span>
            {!isCollapsed && <span className="text-revio-900 truncate">{item.label}</span>}
          </Link>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
      </Tooltip>
    );
  };

  return (
    <div 
      className={cn(
        "h-[calc(100vh-3.5rem)] border-r border-border bg-white transition-all duration-300",
        isCollapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      <div className="p-2 flex items-center justify-between border-b">
        {!isCollapsed && <h2 className="text-lg font-semibold text-revio-900 px-2">Navigasjon</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "h-8 w-8 text-revio-900 hover:bg-revio-100 rounded-md",
            isCollapsed && "mx-auto"
          )}
          aria-label={isCollapsed ? "Utvid sidemeny" : "Skjul sidemeny"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>
      
      <ScrollArea className="h-full pb-10">
        <div className="flex flex-col h-full justify-between p-2">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItem 
                key={item.href} 
                item={item} 
                isActive={location.pathname === item.href} 
              />
            ))}
          </div>
          
          <div className="space-y-1 pt-2 border-t">
            {bottomNavItems.map((item) => (
              <NavItem 
                key={item.href} 
                item={item} 
                isActive={location.pathname === item.href} 
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
