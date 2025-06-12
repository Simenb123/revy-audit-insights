
import React from 'react';
import { 
  Sidebar as SidebarContainer, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  BookOpen, 
  GraduationCap,
  Building2,
  Settings,
  FileText,
  BarChart3,
  Shield,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  
  const mainNavItems = [
    { 
      title: "Dashboard", 
      url: "/dashboard", 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      title: "Klienter", 
      url: "/klienter", 
      icon: Users,
      badge: null
    },
    { 
      title: "Kommunikasjon", 
      url: "/communication", 
      icon: MessageSquare,
      badge: null
    },
    { 
      title: "Kunnskapsbase", 
      url: "/knowledge", 
      icon: BookOpen,
      badge: null
    },
    { 
      title: "RevisionAkademiet", 
      url: "/training", 
      icon: GraduationCap,
      badge: "Ny"
    },
  ];

  const dataNavItems = [
    { 
      title: "Data Import", 
      url: "/data-import", 
      icon: FileText 
    },
    { 
      title: "Regnskapsdata", 
      url: "/accounting-data", 
      icon: BarChart3 
    },
  ];

  const adminNavItems = [
    { 
      title: "Klientadmin", 
      url: "/client-admin", 
      icon: Users 
    },
    { 
      title: "Teamledelse", 
      url: "/teams", 
      icon: UserCheck 
    },
    { 
      title: "Revisjonslogg", 
      url: "/audit-logs", 
      icon: Shield 
    },
    { 
      title: "Organisasjon", 
      url: "/organization", 
      icon: Building2 
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <SidebarContainer className="h-full border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sidebar-foreground">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 hover:bg-accent"
            title={state === "collapsed" ? "Utvid sidebar" : "Trekk inn sidebar"}
          >
            {state === "collapsed" ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Hovedmeny</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="w-full justify-start"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto bg-revio-500 text-white text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Data & Analyse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dataNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="w-full justify-start"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administrasjon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="w-full justify-start"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;
