import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Home, 
  BarChart3, 
  Book,
  Settings,
  HelpCircle
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarNavProps {
  collapsed?: boolean;
}

const SidebarNav = ({ collapsed = false }: SidebarNavProps) => {
  const location = useLocation();
  
  const navItems = [
    {
      to: "/dashboard",
      icon: Home,
      label: "Dashboard"
    },
    {
      to: "/funksjoner",
      icon: BarChart3,
      label: "Funksjoner"
    },
    {
      to: "/klienter",
      icon: Users,
      label: "Klienter"
    },
    {
      to: "/analyser",
      icon: BarChart3,
      label: "Analyser"
    },
    {
      to: "/fag",
      icon: Book,
      label: "Fag"
    }
  ];

  const settingsItems = [
    {
      to: "/innstillinger",
      icon: Settings,
      label: "Innstillinger"
    },
    {
      to: "/hjelp",
      icon: HelpCircle,
      label: "Hjelp"
    }
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    if (path === "/fag") {
      return location.pathname.startsWith("/fag") || location.pathname.startsWith("/knowledge");
    }
    if (path === "/klienter") {
      return location.pathname.startsWith("/klienter") || location.pathname.startsWith("/clients");
    }
    return location.pathname.startsWith(path) && !location.pathname.includes('/klienter/');
  };

  // Helper to render an item (icon only + tooltip when collapsed)
  const renderMenuItem = (item: { to: string, icon: any, label: string }) => {
    if (collapsed) {
      return (
        <TooltipProvider delayDuration={0} key={item.to}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild isActive={isActive(item.to)} className="justify-center">
                <Link to={item.to}>
                  <item.icon />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right" className="capitalize">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    // Expanded: icon + text label
    return (
      <SidebarMenuItem key={item.to}>
        <SidebarMenuButton asChild isActive={isActive(item.to)}>
          <Link to={item.to}>
            <item.icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarGroup>
        {!collapsed && <SidebarGroupLabel>Hovedmeny</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {navItems.map((item) =>
              collapsed
                ? (
                  // Only render icon+tooltip; one per line
                  <SidebarMenuItem key={item.to}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                )
                : renderMenuItem(item)
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        {!collapsed && <SidebarGroupLabel>System</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {settingsItems.map((item) =>
              collapsed
                ? (
                  <SidebarMenuItem key={item.to}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                )
                : renderMenuItem(item)
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export default SidebarNav;
