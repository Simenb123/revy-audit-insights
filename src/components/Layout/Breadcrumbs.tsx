import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const Breadcrumbs = () => {
  const location = useLocation();
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Hjem', href: '/' }];
    
    // Mapping av ruter til norske navn
    const routeMapping: Record<string, string> = {
      'dashboard': 'Dashboard',
      'clients': 'Klienter',
      'klienter': 'Klienter',
      'organization': 'Organisasjon',
      'communication': 'Kommunikasjon',
      'teams': 'Teams',
      'training': 'Opplæring',
      'documents': 'Dokumenter',
      'fag': 'Fagstoff',
      'knowledge': 'Fagstoff',
      'ai-usage': 'AI-bruk',
      'ai-revy-admin': 'AI-Revy Admin',
      'standard-accounts': 'Kontoplan',
      'profile': 'Profil',
      'settings': 'Innstillinger',
      'hjelp': 'Hjelp'
    };
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeMapping[segment] || segment;
      
      // Ikke lag link for siste element (current page)
      const isLast = index === pathSegments.length - 1;
      breadcrumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: isLast ? undefined : currentPath
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  
  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {crumb.href ? (
            <Link
              to={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {index === 0 ? <Home className="h-4 w-4" /> : crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {crumb.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;