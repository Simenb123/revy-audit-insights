
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2,
  Users,
  Briefcase,
  MessageSquare,
  Settings,
  UserCog
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUserProfile } from '@/hooks/useUserProfile';

const OrganizationNav = () => {
  const location = useLocation();
  const { data: userProfile } = useUserProfile();
  
  const organizationNavItems = [
    {
      to: "/organisasjon",
      icon: Building2,
      label: "Oversikt"
    },
    {
      to: "/avdeling",
      icon: Users,
      label: "Min avdeling"
    },
    {
      to: "/team",
      icon: Briefcase,
      label: "Mine team"
    },
    {
      to: "/kommunikasjon",
      icon: MessageSquare,
      label: "Kommunikasjon"
    }
  ];

  const adminItems = [
    {
      to: "/brukeradministrasjon",
      icon: UserCog,
      label: "Brukeradministrasjon"
    },
    {
      to: "/organisasjonsinnstillinger",
      icon: Settings,
      label: "Organisasjonsinnstillinger"
    }
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const canAccessAdminFeatures = userProfile?.userRole === 'admin' || userProfile?.userRole === 'partner';

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Organisasjon</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {organizationNavItems.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={isActive(item.to)}>
                  <Link to={item.to}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {canAccessAdminFeatures && (
        <SidebarGroup>
          <SidebarGroupLabel>Administrasjon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to)}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
};

export default OrganizationNav;
