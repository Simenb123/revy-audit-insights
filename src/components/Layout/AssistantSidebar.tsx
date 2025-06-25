import React from 'react'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import ResizableRightSidebar from './ResizableRightSidebar'

interface AssistantSidebarProps {
  isMobileSidebarOpen: boolean
  closeMobileSidebar: () => void
}

const AssistantSidebar = ({ isMobileSidebarOpen, closeMobileSidebar }: AssistantSidebarProps) => {
  const isMobile = useIsMobile()

  const sidebarContent = <ResizableRightSidebar />

  if (isMobile) {
    return (
      <Drawer open={isMobileSidebarOpen} onOpenChange={open => { if (!open) closeMobileSidebar() }}>
        <DrawerContent className="max-h-screen">
          {sidebarContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return sidebarContent
}

export default AssistantSidebar
