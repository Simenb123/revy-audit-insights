import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import React from 'react'

interface SidebarNavItemProps {
  icon: React.ElementType
  to: string
  label?: string
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ icon: Icon, to, label }) => {
  const location = useLocation()
  const active = location.pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        active && 'bg-sidebar-accent text-sidebar-accent-foreground',
        'sidebar-rail:flex-col sidebar-rail:p-0'
      )}
    >
      <Icon className="h-4 w-4" />
      {label && <span className={cn('ml-2', 'sidebar-rail:hidden')}>{label}</span>}
    </Link>
  )
}

export default SidebarNavItem
