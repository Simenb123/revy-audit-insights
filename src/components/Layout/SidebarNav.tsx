
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SidebarNav = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
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

  const renderMenuItem = (item: typeof navItems[0]) => {
    const menuButton = (
      <SidebarMenuButton asChild isActive={isActive(item.to)}>
        <Link to={item.to} className="flex items-center gap-3">
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>{item.label}</span>}
        </Link>
      </SidebarMenuButton>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider key={item.to}>
          <Tooltip>
            <TooltipTrigger asChild>
              {menuButton}
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return menuButton;
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.to}>
              {renderMenuItem(item)}
              {item.submenu && isActive(item.to) && !isCollapsed && (
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
