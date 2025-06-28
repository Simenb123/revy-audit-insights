import React from 'react'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant'
import { useChatUI } from '@/store/chatUI'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { X } from 'lucide-react'
import { useRightSidebar } from '@/components/Layout/RightSidebarContext'


const SidebarHeader = () => {
  const { setIsHidden } = useRightSidebar()
  const hide = () => setIsHidden(v => !v)
  return (
    <div className="flex items-center justify-between h-10 px-2 border-b bg-gray-50">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">Assistent</span>
      </div>
      <button onClick={hide} className="p-2" aria-label="Close sidebar">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

const AssistantBody = () => (
  <div className="flex-grow overflow-y-auto p-0">
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

  const classes = `flex h-full flex-col w-full bg-white border-l border-gray-200 transition-transform ${collapsed ? 'translate-x-full' : ''}`

  if (!lg) {
    return (
      <Drawer open={!collapsed} onOpenChange={open => { if (!open) toggle() }}>
        <DrawerContent className="max-h-screen p-0">
          <aside className="flex h-full flex-col w-full bg-white">
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
