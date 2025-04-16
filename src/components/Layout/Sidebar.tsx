import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart2, 
  FileText, 
  FolderOpen, 
  Home,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const mainNavItems: NavItem[] = [
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
  {
    label: 'Klienter',
    href: '/klienter',
    icon: <Users size={20} />,
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
  
  return (
    <ShadcnSidebar 
      className="border-r border-border h-full bg-white"
      collapsible="icon"
    >
      <div className="p-2 flex items-center justify-between border-b">
        <h2 className="text-lg font-semibold text-revio-900 px-2">Navigasjon</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-revio-900 hover:bg-revio-100 rounded-md"
        >
          {state === 'collapsed' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.href}
                    tooltip={item.label}
                    className="h-10"
                  >
                    <Link to={item.href} className="flex items-center w-full gap-3">
                      <span className="text-revio-900">{item.icon}</span>
                      <span className="text-revio-900 truncate">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.href}
                    tooltip={item.label}
                    className="h-10"
                  >
                    <Link to={item.href} className="flex items-center w-full gap-3">
                      <span className="text-revio-900">{item.icon}</span>
                      <span className="text-revio-900 truncate">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  );
};

export default Sidebar;
