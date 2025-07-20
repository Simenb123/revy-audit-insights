
import React from 'react'
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
  Database
} from 'lucide-react'

const navigationItems = [
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
  {
    title: 'Organisasjon',
    url: '/organization',
    icon: Building,
  },
  {
    title: 'Innstillinger',
    url: '/organization/settings',
    icon: Settings,
  },
]

const ResizableLeftSidebar = () => {
  const { state } = useSidebar()
  const location = useLocation()
  const isCollapsed = state === 'collapsed'

  return (
    <ShadcnSidebar
      collapsible="icon"
      className="bg-sidebar border-0"
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url !== '/' && location.pathname.startsWith(item.url))
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={isCollapsed ? "justify-center px-2" : "justify-start px-3"}
                      tooltip={isCollapsed ? item.title : undefined}
                    >
                      <Link to={item.url} className={isCollapsed ? "flex items-center justify-center" : "flex items-center gap-3"}>
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
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
