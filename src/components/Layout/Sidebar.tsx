
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart2, 
  FileText, 
  FolderOpen, 
  Home,
  Users,
  Settings,
  HelpCircle,
  ChevronsLeft
} from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar";

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
  
  return (
    <ShadcnSidebar 
      className="border-r border-border" 
      collapsible="icon"
    >
      <SidebarHeader className="py-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Navigasjon</h2>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link to={item.href} className="flex items-center w-full gap-3">
                      {item.icon}
                      <span>{item.label}</span>
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
                  >
                    <Link to={item.href} className="flex items-center w-full gap-3">
                      {item.icon}
                      <span>{item.label}</span>
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
