import React from 'react'
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import SidebarRail from '@/components/ui/sidebar/SidebarRail'
import { useSidebar } from '@/components/ui/sidebar/SidebarContext'

const ResizableLeftSidebar = () => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <ShadcnSidebar
      collapsible="icon"
      style={!isCollapsed ? { minWidth: '280px', maxWidth: '280px' } : undefined}
    >
      <SidebarHeader>
        <SidebarTrigger className="absolute top-3 right-3" />
      </SidebarHeader>
      {isCollapsed ? <SidebarRail /> : <SidebarContent />}
    </ShadcnSidebar>
  )
}

export default ResizableLeftSidebar
