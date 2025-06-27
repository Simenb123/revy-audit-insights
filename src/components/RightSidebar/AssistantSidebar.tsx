import React from 'react'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import RevyAvatar from '@/components/Revy/RevyAvatar'
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant'
import { useChatUI } from '@/store/chatUI'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { ChevronRight, ChevronLeft } from 'lucide-react'

const ToggleCollapseButton = () => {
  const { collapsed, toggle } = useChatUI()
  return (
    <button
      onClick={toggle}
      className="p-2"
      aria-label="Toggle sidebar"
    >
      {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </button>
  )
}

const SidebarHeader = () => (
  <div className="flex items-center justify-between p-3 border-b bg-gray-50">
    <div className="flex items-center gap-2">
      <RevyAvatar size="sm" variant="chat" />
      <span className="font-semibold text-sm">Assistent</span>
    </div>
    <ToggleCollapseButton />
  </div>
)

const AssistantBody = () => (
  <div className="flex-grow overflow-y-auto">
    {/* thought: embed chat */}
    <SmartReviAssistant embedded />
  </div>
)

const SidebarFooter = () => (
  <div className="p-2 border-t text-xs text-gray-500">Status: Online</div>
)

const SidebarContent = () => (
  <>
    <SidebarHeader />
    <AssistantBody />
    <SidebarFooter />
  </>
)

const AssistantSidebar = () => {
  const { collapsed, toggle } = useChatUI()
  const { lg } = useBreakpoint()

  const classes = `fixed top-0 right-0 h-screen w-80 border-l border-gray-200 bg-gray-50 flex flex-col shadow-md z-40 transition-transform ${collapsed ? 'translate-x-full' : ''}`

  if (!lg) {
    return (
      <Drawer open={!collapsed} onOpenChange={open => { if (!open) toggle() }}>
        <DrawerContent className="max-h-screen p-0">
          <aside className="h-full w-full flex flex-col">
            <SidebarContent />
          </aside>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <aside className={classes} role="complementary">
      <SidebarContent />
    </aside>
  )
}

export default AssistantSidebar
