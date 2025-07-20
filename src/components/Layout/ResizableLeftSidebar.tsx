
import React from 'react'
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/sidebar/SidebarContext'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  Building,
  BookOpen,
  MessageSquare,
  Database,
  Brain,
  UserCog
} from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'

// Klientspesifikke områder - tilgjengelig for alle
const clientWorkItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Klienter',
    url: '/clients',
    icon: Users,
  },
  {
    title: 'Analyse',
    url: '/analysis',
    icon: BarChart3,
  },
  {
    title: 'Dokumenter',
    url: '/documents',
    icon: FileText,
  },
  {
    title: 'Regnskap',
    url: '/accounting',
    icon: Database,
  },
]

// Administrative områder - rollebasert tilgang
const adminItems = [
  {
    title: 'Organisasjon',
    url: '/organization',
    icon: Building,
    roles: ['admin', 'partner', 'manager', 'employee'] as const,
  },
  {
    title: 'Brukeradministrasjon',
    url: '/organization/roles',
    icon: UserCog,
    roles: ['admin', 'partner'] as const,
  },
  {
    title: 'Innstillinger',
    url: '/organization/settings',
    icon: Settings,
    roles: ['admin', 'partner', 'manager'] as const,
  },
  {
    title: 'AI Revy Admin',
    url: '/ai-revy-admin',
    icon: Brain,
    roles: ['admin'] as const,
  },
  {
    title: 'Standard kontoer',
    url: '/standard-accounts',
    icon: Database,
    roles: ['admin'] as const,
  },
]

// Ressurser - tilgjengelig for alle
const resourceItems = [
  {
    title: 'Kunnskapsbase',
    url: '/fag',
    icon: BookOpen,
  },
  {
    title: 'Kommunikasjon',
    url: '/communication',
    icon: MessageSquare,
  },
]

const ResizableLeftSidebar = () => {
  const { state } = useSidebar()
  const location = useLocation()
  const { data: userProfile } = useUserProfile()
  const isCollapsed = state === 'collapsed'

  const isActive = (url: string) => {
    if (url === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname === url || 
      (url !== '/' && location.pathname.startsWith(url))
  }

  const canAccessAdminItem = (roles: readonly string[]) => {
    if (!userProfile?.userRole) return false
    return roles.includes(userProfile.userRole)
  }

  const filteredAdminItems = adminItems.filter(item => canAccessAdminItem(item.roles))

  return (
    <ShadcnSidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
      style={{ 
        width: isCollapsed 
          ? 'var(--sidebar-width-collapsed)' 
          : 'var(--sidebar-width)' 
      }}
    >
      <SidebarHeader className="p-2">
        <div className="flex items-center justify-center">
          {!isCollapsed && (
            <h3 className="text-sm font-medium text-sidebar-foreground px-2">Navigation</h3>
          )}
          <SidebarTrigger className="h-8 w-8 ml-auto" />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Klientarbeid seksjon */}
        <SidebarGroup>
          <SidebarGroupLabel>Klientarbeid</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {clientWorkItems.map((item) => {
                const isItemActive = isActive(item.url)
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isItemActive}
                      className={isCollapsed ? "justify-center px-1" : "justify-start px-2"}
                      tooltip={isCollapsed ? item.title : undefined}
                    >
                      <Link to={item.url} className={isCollapsed ? "flex items-center justify-center w-full h-full" : "flex items-center gap-2"}>
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-xs">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administrasjon seksjon - kun hvis brukeren har tilgang til minst ett element */}
        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administrasjon</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredAdminItems.map((item) => {
                  const isItemActive = isActive(item.url)
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isItemActive}
                        className={isCollapsed ? "justify-center px-1" : "justify-start px-2"}
                        tooltip={isCollapsed ? item.title : undefined}
                      >
                        <Link to={item.url} className={isCollapsed ? "flex items-center justify-center w-full h-full" : "flex items-center gap-2"}>
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!isCollapsed && <span className="text-xs">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Ressurser seksjon */}
        <SidebarGroup>
          <SidebarGroupLabel>Ressurser</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {resourceItems.map((item) => {
                const isItemActive = isActive(item.url)
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isItemActive}
                      className={isCollapsed ? "justify-center px-1" : "justify-start px-2"}
                      tooltip={isCollapsed ? item.title : undefined}
                    >
                      <Link to={item.url} className={isCollapsed ? "flex items-center justify-center w-full h-full" : "flex items-center gap-2"}>
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-xs">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  )
}

export default ResizableLeftSidebar
