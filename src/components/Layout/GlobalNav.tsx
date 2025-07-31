
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

const GlobalNav = () => {
  const location = useLocation();
  
  const globalNavItems = [
    {
      to: "/dashboard",
      icon: Home,
      label: "Dashboard"
    },
    {
      to: "/clients",
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
    if (path === "/clients") {
      return location.pathname.startsWith("/klienter") || location.pathname.startsWith("/clients");
    }
    return location.pathname.startsWith(path) && !location.pathname.includes('/klienter/');
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Hovedmeny</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {globalNavItems.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={isActive(item.to)}>
                  <Link to={item.to}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>System</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {settingsItems.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={isActive(item.to)}>
                  <Link to={item.to}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export default GlobalNav;
