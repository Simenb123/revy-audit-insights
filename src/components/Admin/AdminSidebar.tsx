import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Shield, 
  Activity, 
  Settings,
  BookOpen,
  ChevronLeft,
  Database,
  Brain
} from 'lucide-react';

const adminItems = [
  { title: "Oversikt", url: "/admin", icon: LayoutDashboard },
  { title: "Brukere", url: "/admin/users", icon: Users },
  { title: "Tilgangsforespørsler", url: "/admin/access-requests", icon: UserCheck },
  { title: "Roller & Tilgang", url: "/admin/roles", icon: Shield },
  { title: "Aktivitetslogg", url: "/admin/audit", icon: Activity },
  { title: "Revisorskolen", url: "/admin/training", icon: BookOpen },
  { title: "Systeminnstillinger", url: "/admin/settings", icon: Settings },
];

const ragItems = [
  { title: "Juridisk Relasjonskart", url: "/admin/rag/juridisk", icon: Database },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const getNavCls = (path: string) => 
    isActive(path) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-sidebar-foreground">
            Administrasjon
          </h2>
        )}
        <SidebarTrigger className="ml-auto" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Hovedmeny
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            <Brain className="h-4 w-4 inline mr-2" />
            RAG & Kunnskapsstyring
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ragItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;