
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
  Users,
  Receipt
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ClientNav = () => {
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  
  const clientNavItems = [
    {
      to: `/klienter/${orgNumber}`,
      icon: Home,
      label: "Oversikt"
    },
    {
      to: `/klienter/${orgNumber}/regnskap`,
      icon: FileText,
      label: "Regnskap"
    },
    {
      to: `/klienter/${orgNumber}/analyser`,
      icon: BarChart3,
      label: "Analyser"
    }
  ];

  const dataItems = [
    {
      to: `/klienter/${orgNumber}/regnskapsdata`,
      icon: Database,
      label: "Grunnlagsdata",
      description: "Kontoplan, Saldobalanse, Hovedbok"
    },
    {
      to: `/klienter/${orgNumber}/spesialdata`,
      icon: Package,
      label: "Spesialdata",
      description: "Varelager, Kunde/Leverandørreskontro"
    },
    {
      to: `/klienter/${orgNumber}/transaksjoner`,
      icon: Receipt,
      label: "Transaksjoner",
      description: "Salgsordre, Fakturaer"
    },
    {
      to: `/klienter/${orgNumber}/import`,
      icon: Upload,
      label: "SAF-T Import",
      description: "Komplett import"
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/klienter">
                  <ArrowLeft />
                  <span>Tilbake til klienter</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Klientmeny</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {clientNavItems.map((item) => (
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

      <SidebarGroup>
        <SidebarGroupLabel>Dataopplasting</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {dataItems.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={isActive(item.to)}>
                  <Link to={item.to} className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <item.icon />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6">
                      {item.description}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

export default ClientNav;
