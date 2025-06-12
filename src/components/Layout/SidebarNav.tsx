
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Home, 
  BarChart3, 
  Folder, 
  Book,
  Settings,
  HelpCircle,
  Building2,
  Scale,
  Shield,
  Calculator,
  CheckSquare
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const SidebarNav = () => {
  const location = useLocation();
  
  const navItems = [
    {
      to: "/dashboard",
      icon: Home,
      label: "Dashboard"
    },
    {
      to: "/organisasjon",
      icon: Building2,
      label: "Organisasjon"
    },
    {
      to: "/klienter",
      icon: Users,
      label: "Klienter"
    },
    {
      to: "/regnskap",
      icon: FileText,
      label: "Regnskap"
    },
    {
      to: "/analyser",
      icon: BarChart3,
      label: "Analyser"
    },
    {
      to: "/fag",
      icon: Book,
      label: "Fagområder",
      submenu: [
        { to: "/fag", label: "Oversikt", icon: Book },
        { to: "/fag/lover", label: "Lover & Forskrifter", icon: Scale },
        { to: "/fag/revisjonsstandarder", label: "Revisjonsstandarder", icon: Shield },
        { to: "/fag/regnskapsstandarder", label: "Regnskapsstandarder", icon: Calculator },
        { to: "/fag/sjekklister", label: "Sjekklister", icon: CheckSquare }
      ]
    },
    {
      to: "/dokumenter",
      icon: FileText,
      label: "Dokumenter"
    },
    {
      to: "/prosjekter",
      icon: Folder,
      label: "Prosjekter"
    },
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
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton asChild isActive={isActive(item.to)}>
                <Link to={item.to}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
              {item.submenu && isActive(item.to) && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <SidebarMenuButton 
                      key={subItem.to} 
                      asChild 
                      size="sm"
                      isActive={location.pathname === subItem.to}
                    >
                      <Link to={subItem.to} className="flex items-center gap-2">
                        <subItem.icon className="h-3 w-3" />
                        <span className="text-xs">{subItem.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  ))}
                </div>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarNav;
