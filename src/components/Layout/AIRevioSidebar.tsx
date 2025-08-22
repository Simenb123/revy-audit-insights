import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Brain, 
  FileText, 
  BarChart3, 
  Search, 
  Settings, 
  Users, 
  Database,
  Activity,
  Bot,
  Zap,
  TrendingUp,
  Shield,
  Globe,
  ArrowRightLeft,
  DollarSign
} from 'lucide-react';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: BarChart3, badge: null },
  { title: 'Klienter', url: '/clients', icon: Users, badge: null },
  { title: 'AI Command Center', url: '/ai-command', icon: Brain, badge: 'NY' },
  { title: 'Dokumenter', url: '/documents', icon: FileText, badge: null },
];

const resourceNavItems: NavItem[] = [
  { title: 'Valutakurser', url: '/resources/currencies', icon: ArrowRightLeft, badge: null },
  { title: 'Verdipapirkurser', url: '/resources/securities/prices', icon: TrendingUp, badge: null },
  { title: 'Verdipapirer', url: '/resources/securities/catalog', icon: Shield, badge: null },
  { title: 'PDF Creator', url: '/resources/pdf-creator', icon: FileText, badge: null },
];

const aiNavItems: NavItem[] = [
  { title: 'Smart Dokumentanalyse', url: '/ai/documents', icon: FileText, badge: null },
  { title: 'Prediktiv Analyse', url: '/ai/predictive', icon: TrendingUp, badge: null },
  { title: 'Intelligent Søk', url: '/ai/search', icon: Search, badge: null },
  { title: 'AI-assistert Chat', url: '/ai/chat', icon: Bot, badge: null },
  { title: 'Risikovurdering', url: '/ai/risk', icon: Shield, badge: 'BETA' },
];

const systemNavItems: NavItem[] = [
  { title: 'Ytelsesmonitor', url: '/system/performance', icon: Activity, badge: null },
  { title: 'Dataadministrasjon', url: '/system/data', icon: Database, badge: null },
  { title: 'Innstillinger', url: '/settings', icon: Settings, badge: null },
];

export function AIRevioSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const getNavClasses = (isActive: boolean) => 
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-primary/10 text-primary font-medium border-l-4 border-primary' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`;

  const renderNavItem = (item: typeof mainNavItems[0]) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink 
          to={item.url} 
          end={item.url === '/'}
          className={({ isActive }) => getNavClasses(isActive)}
        >
          <item.icon className={`h-4 w-4 ${isActive(item.url) ? 'text-primary' : ''}`} />
          {!collapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 border-r`}
      collapsible="icon"
    >
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h2 className="font-bold text-lg">AI Revio</h2>
              <p className="text-xs text-muted-foreground">Intelligent Revisjon</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="p-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Hovedmeny
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources */}
        <SidebarGroup>
          <SidebarGroupLabel className={`${collapsed ? "sr-only" : ""} flex items-center gap-2`}>
            <Globe className="h-4 w-4 text-primary" />
            {!collapsed && "Ressurser"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {resourceNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Features */}
        <SidebarGroup>
          <SidebarGroupLabel className={`${collapsed ? "sr-only" : ""} flex items-center gap-2`}>
            <Brain className="h-4 w-4 text-primary" />
            {!collapsed && "AI-funksjoner"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {aiNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System & Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {systemNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar trigger for mini mode */}
      {collapsed && (
        <div className="absolute top-4 right-2">
          <SidebarTrigger className="h-6 w-6" />
        </div>
      )}
    </Sidebar>
  );
}