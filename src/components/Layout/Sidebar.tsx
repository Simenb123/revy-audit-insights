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
} from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
      className="border-r border-border h-full bg-white"
      collapsible="icon"
    >
      <div className="p-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-revio-900 px-2">Navigasjon</h2>
        <SidebarTrigger className="h-8 w-8 text-revio-900 hover:bg-revio-100 rounded-md" />
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
