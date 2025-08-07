
import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger
} from "@/components/ui/sidebar";
import GlobalNav from "./GlobalNav";
import ClientNav from "./ClientNav";
import OrganizationNav from "./OrganizationNav";
import { useClientDetails } from '@/hooks/useClientDetails';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuditFirm } from '@/hooks/useAuditFirm';

export default function ContextualSidebar() {
  const location = useLocation();
  const { orgNumber, clientId } = useParams<{ orgNumber: string; clientId: string }>();
  
  // Extract clientId from URL path more robustly for nested routes
  const extractClientIdFromPath = (pathname: string): string | null => {
    const clientsMatch = pathname.match(/\/clients\/([a-f0-9-]{36})/);
    if (clientsMatch) return clientsMatch[1];
    
    const klienterMatch = pathname.match(/\/klienter\/(\d+)/);
    if (klienterMatch) return klienterMatch[1];
    
    return null;
  };
  
  // Determine client identifier - use extracted from URL, then params
  const extractedClientId = extractClientIdFromPath(location.pathname);
  const clientIdentifier = extractedClientId || clientId || orgNumber;
  
  const { data: client } = useClientDetails(clientIdentifier || '');
  const { data: userProfile } = useUserProfile();
  const { data: auditFirm } = useAuditFirm();
  
  // Improved client context detection using regex patterns
  const isClientContext = !!(
    location.pathname.match(/\/clients\/[a-f0-9-]{36}/) || 
    (location.pathname.includes('/klienter/') && orgNumber) ||
    extractedClientId
  );
  
  // Check if we're in organization context
  const isOrganizationContext = location.pathname.match(/^\/(organisasjon|avdeling|team|kommunikasjon|brukeradministrasjon|organisasjonsinnstillinger)/);
  
  return (
    <ShadcnSidebar>
      <SidebarHeader>
        <SidebarTrigger className="absolute top-3 right-3" />
        <div className="p-4">
          {isClientContext && client && (
            <div className="mt-2 p-2 bg-revio-50 rounded-md">
              <p className="text-sm font-medium text-revio-900">{client.company_name}</p>
              <p className="text-xs text-revio-700">Org.nr: {client.org_number}</p>
            </div>
          )}
          {isOrganizationContext && auditFirm && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900">{auditFirm.name}</p>
              {userProfile && (
                <p className="text-xs text-blue-700 capitalize">{userProfile.userRole}</p>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isClientContext ? (
          <ClientNav />
        ) : isOrganizationContext ? (
          <OrganizationNav />
        ) : (
          <GlobalNav />
        )}
      </SidebarContent>
    </ShadcnSidebar>
  );
}
