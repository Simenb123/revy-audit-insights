
import { useState } from 'react';

export function useMobileSidebar() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);

  return {
    isMobileSidebarOpen,
    openMobileSidebar,
    closeMobileSidebar,
    toggleMobileSidebar,
  };
}
