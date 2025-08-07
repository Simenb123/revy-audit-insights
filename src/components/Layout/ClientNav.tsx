
import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { 
  Home,
  FileText, 
  Upload,
  BarChart3,
  ArrowLeft,
  Database,
  Package,
  Receipt
} from 'lucide-react';
import { cn } from "@/lib/utils";

const ClientNav = () => {
  const location = useLocation();
  const { clientId } = useParams<{ clientId: string }>();
  
  // Debug logging to see what we're getting
  console.log('🔍 [CLIENT_NAV] Debug info:', {
    pathname: location.pathname,
    clientId,
    clientIdType: typeof clientId,
    hasClientId: !!clientId
  });
  
  const clientNavItems = [
    {
      to: `/clients/${clientId}`,
      icon: Home,
      label: "Oversikt"
    },
    {
      to: `/clients/${clientId}/analysis`,
      icon: FileText,
      label: "Regnskap"
    },
    {
      to: `/clients/${clientId}/analysis`,
      icon: BarChart3,
      label: "Analyser"
    },
    {
      to: `/clients/${clientId}/documents`,
      icon: FileText,
      label: "Dokumenter"
    }
  ];

  const dataItems = [
    {
      to: `/clients/${clientId}/trial-balance`,
      icon: Database,
      label: "Saldobalanse",
      description: "Last opp saldobalanse"
    },
    {
      to: `/clients/${clientId}/general-ledger`,
      icon: Package,
      label: "Hovedbok",
      description: "Last opp hovedbok"
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="space-y-6">
      {/* Back to clients */}
      <div className="space-y-2">
        <Link
          to="/clients"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tilbake til klienter</span>
        </Link>
      </div>

      {/* Client navigation */}
      <div className="space-y-2">
        <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
          Klientmeny
        </h3>
        <nav className="space-y-1">
          {clientNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Data upload section */}
      <div className="space-y-2">
        <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
          Dataopplasting
        </h3>
        <nav className="space-y-1">
          {dataItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-start gap-1 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-6">
                  {item.description}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default ClientNav;
