
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
import React from 'react';
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant';

const AssistantSidebar = () => {
  return (
    <div className="h-full p-2 overflow-y-auto">
      <SmartReviAssistant />
    </div>

import { motion, AnimatePresence } from 'framer-motion';
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant';
import RevyAvatar from '@/components/Revy/RevyAvatar';

interface AssistantSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const sidebarVariants = {
  open: { x: 0 },
  closed: { x: '100%' }
};

const AssistantSidebar: React.FC<AssistantSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          className="fixed right-0 top-0 h-full w-80 bg-white border-l shadow-lg z-50"
          variants={sidebarVariants}
          initial="closed"
          animate="open"
          exit="closed"
          transition={{ type: 'tween', duration: 0.3 }}
        >
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <RevyAvatar size="sm" variant="chat" />
                <h2 className="font-medium text-sm">AI‑Revi</h2>
              </div>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Online</span>
              </span>
            </header>
            <div className="flex flex-col h-full">
              <SmartReviAssistant embedded />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>

  );
};

export default AssistantSidebar;