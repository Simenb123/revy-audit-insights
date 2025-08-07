
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
  
  // Determine client identifier - use clientId for new routes, orgNumber for legacy routes
  const clientIdentifier = clientId || orgNumber;
  console.log('🔍 [CONTEXTUAL_SIDEBAR] Debug info:', {
    pathname: location.pathname,
    orgNumber,
    clientId,
    clientIdentifier,
    isClientContext: (location.pathname.includes('/klienter/') && orgNumber) || 
                     (location.pathname.includes('/clients/') && clientId)
  });
  const { data: client } = useClientDetails(clientIdentifier || '');
  const { data: userProfile } = useUserProfile();
  const { data: auditFirm } = useAuditFirm();
  
  // Check if we're in a client context (both legacy and new routes)
  const isClientContext = (location.pathname.includes('/klienter/') && orgNumber) || 
                          (location.pathname.includes('/clients/') && clientId);
  
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
