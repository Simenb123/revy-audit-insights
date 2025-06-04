
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FileText, Database, BarChart3, UserCheck } from 'lucide-react';

interface ClientNavigationProps {
  orgNumber: string;
}

const ClientNavigation = ({ orgNumber }: ClientNavigationProps) => {
  const location = useLocation();
  
  const navItems = [
    {
      to: `/klienter/${orgNumber}`,
      label: 'Oversikt',
      icon: BarChart3,
      exact: true,
    },
    {
      to: `/klienter/${orgNumber}/oppdragsvurdering`,
      label: 'Oppdragsvurdering',
      icon: UserCheck,
    },
    {
      to: `/klienter/${orgNumber}/regnskap`,
      label: 'Regnskap',
      icon: FileText,
    },
    {
      to: `/klienter/${orgNumber}/regnskapsdata`,
      label: 'Regnskapsdata',
      icon: Database,
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="flex space-x-1 bg-gray-50 p-1 rounded-lg">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive(item.to, item.exact)
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          )}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default ClientNavigation;
