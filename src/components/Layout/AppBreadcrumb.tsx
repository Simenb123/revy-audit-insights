import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const AppBreadcrumb = () => {
  const location = useLocation();
  
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Don't show breadcrumb on home page
  if (pathSegments.length === 0) {
    return null;
  }

  const breadcrumbItems: Array<{ name: string; path: string; icon?: React.ComponentType<any> }> = [
    { name: 'Hjem', path: '/', icon: Home }
  ];

  // Build breadcrumb items from path segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Map path segments to readable names
    const segmentName = getSegmentName(segment, pathSegments, index);
    if (segmentName) {
      breadcrumbItems.push({
        name: segmentName,
        path: currentPath
      });
    }
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <React.Fragment key={item.path}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1">
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.path} className="flex items-center gap-1">
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.name}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

function getSegmentName(segment: string, allSegments: string[], index: number): string | null {
  const segmentMap: Record<string, string> = {
    'dashboard': 'Dashboard',
    'clients': 'Klienter',
    'klienter': 'Klienter',
    'client-admin': 'Klientadministrasjon',
    'user-admin': 'Brukeradministrasjon',
    'profile': 'Profil',
    'organization': 'Organisasjon',
    'settings': 'Innstillinger',
    'teams': 'Team',
    'communication': 'Kommunikasjon',
    'collaboration': 'Samarbeid',
    'training': 'Opplæring',
    'ledger': 'Hovedbok',
    'accounting': 'Regnskap',
    'data-import': 'Dataimport',
    'documents': 'Dokumenter',
    'audit-logs': 'Revisjonslogger',
    'ai-usage': 'AI-bruk',
    'fag': 'Kunnskapsbase',
    'ai-revy-admin': 'AI-Revy Admin',
    'regnskap': 'Regnskap',
    'analyser': 'Analyser',
    'regnskapsdata': 'Regnskapsdata',
    'spesialdata': 'Spesialdata',
    'transaksjoner': 'Transaksjoner',
    'import': 'Import',
    // Knowledge Base specific paths
    'kategori': 'Kategori',
    'artikkel': 'Artikkel',
    'ny': 'Ny artikkel',
    'ny-artikkel': 'Ny artikkel',
    'rediger': 'Rediger',
    'mine': 'Mine artikler',
    'favoritter': 'Mine favoritter',
    'sok': 'Søkeresultater',
    'upload': 'Last opp PDF',
    'admin': 'Administrasjon',
    'hemmelig-ai-trening': 'AI-trening',
    'revisjonshandlinger': 'Revisjonshandlinger'
  };

  // Handle org numbers (9-digit numbers)
  if (/^\d{9}$/.test(segment)) {
    return `Org.nr ${segment}`;
  }

  // Handle UUIDs or other IDs
  if (segment.length > 20 && (segment.includes('-') || /^[a-f0-9]+$/i.test(segment))) {
    return null; // Skip showing UUIDs in breadcrumb
  }

  return segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default AppBreadcrumb;
