
import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader
} from "@/components/ui/sidebar";
import GlobalNav from "./GlobalNav";
import ClientNav from "./ClientNav";
import OrganizationNav from "./OrganizationNav";
import { useClientDetails } from '@/hooks/useClientDetails';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuditFirm } from '@/hooks/useAuditFirm';

export default function ContextualSidebar() {
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client } = useClientDetails(orgNumber || '');
  const { data: userProfile } = useUserProfile();
  const { data: auditFirm } = useAuditFirm();
  
  // Check if we're in a client context
  const isClientContext = location.pathname.includes('/klienter/') && orgNumber;
  
  // Check if we're in organization context
  const isOrganizationContext = location.pathname.match(/^\/(organisasjon|avdeling|team|kommunikasjon|brukeradministrasjon|organisasjonsinnstillinger)/);
  
  return (
    <ShadcnSidebar>
      <SidebarHeader>
        <div className="p-4">
          <h2 className="text-lg font-semibold">Revio</h2>
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
