
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { 
  Users, 
  Home, 
  BarChart3, 
  Book,
  Settings,
  HelpCircle,
  Building2,
  MessageSquare,
  UserCog,
  GraduationCap,
  FileText,
  Brain,
  Database
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
      to: "/clients",
      icon: Users,
      label: "Klienter"
    },
    {
      to: "/communication",
      icon: MessageSquare,
      label: "Kommunikasjon"
    },
    {
      to: "/teams",
      icon: UserCog,
      label: "Teams"
    },
    {
      to: "/training",
      icon: GraduationCap,
      label: "Opplæring"
    },
    {
      to: "/documents",
      icon: FileText,
      label: "Dokumenter"
    },
    {
      to: "/fag",
      icon: Book,
      label: "Fagstoff"
    },
    {
      to: "/ai-usage",
      icon: BarChart3,
      label: "AI-bruk"
    },
    {
      to: "/standard-accounts",
      icon: Database,
      label: "Kontoplan"
    },
    {
      to: "/ai-revy-admin",
      icon: Brain,
      label: "AI-Revy Admin"
    }
  ];

  const settingsItems = [
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
      return location.pathname.startsWith("/clients") || location.pathname.startsWith("/klienter");
    }
    return location.pathname.startsWith(path) && !location.pathname.includes('/clients/');
  };

  const renderMenuItem = (item: { to: string, icon: any, label: string }) => {
    const Icon = item.icon;
    const active = isActive(item.to);
    
    if (collapsed) {
      return (
        <Tooltip key={item.to}>
          <TooltipTrigger asChild>
            <Link
              to={item.to}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                active 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">{item.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="capitalize">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.to}
        to={item.to}
        className={cn(
          "flex items-center gap-3 px-2 py-1 rounded-md text-sm transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main navigation */}
      <div className="space-y-2">
        {!collapsed && (
          <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
            Hovedmeny
          </h3>
        )}
        <nav aria-label="Hovedmeny" className={cn("space-y-1", collapsed && "flex flex-col items-center space-y-2")}>
          {navItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>

      {/* Settings navigation */}
      <div className="space-y-2">
        {!collapsed && (
          <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
            System
          </h3>
        )}
        <nav aria-label="System" className={cn("space-y-1", collapsed && "flex flex-col items-center space-y-2")}>
          {settingsItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>
    </div>
  );
};

export default SidebarNav;
