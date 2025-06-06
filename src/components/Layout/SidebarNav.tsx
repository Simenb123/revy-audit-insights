
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Users, 
  FileText, 
  Home, 
  BarChart3, 
  Folder, 
  Book,
  Settings,
  HelpCircle
} from 'lucide-react';

const SidebarNav = () => {
  const location = useLocation();
  
  const navItems = [
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
      to: "/dashboard",
      icon: Home,
      label: "Dashboard"
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
    <nav className="space-y-1 p-4">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isActive(item.to)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default SidebarNav;
