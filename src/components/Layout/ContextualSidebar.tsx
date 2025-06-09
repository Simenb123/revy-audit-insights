
import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader
} from "@/components/ui/sidebar";
import GlobalNav from "./GlobalNav";
import ClientNav from "./ClientNav";
import { useClientDetails } from '@/hooks/useClientDetails';

export default function ContextualSidebar() {
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client } = useClientDetails(orgNumber || '');
  
  // Check if we're in a client context
  const isClientContext = location.pathname.includes('/klienter/') && orgNumber;
  
  return (
    <ShadcnSidebar>
      <SidebarHeader>
        <div className="p-4">
          <h2 className="text-lg font-semibold">Revio</h2>
          {isClientContext && client && (
            <div className="mt-2 p-2 bg-revio-50 rounded-md">
              <p className="text-sm font-medium text-revio-900">{client.companyName}</p>
              <p className="text-xs text-revio-700">Org.nr: {client.orgNumber}</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isClientContext ? <ClientNav /> : <GlobalNav />}
      </SidebarContent>
    </ShadcnSidebar>
  );
}
