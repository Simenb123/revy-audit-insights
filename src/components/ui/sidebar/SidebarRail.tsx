import { LayoutDashboard, Users, BarChart3 } from 'lucide-react'
import SidebarNavItem from './SidebarNavItem'

export const SidebarRail = () => (
  <nav className="flex flex-col items-center gap-2 py-4 w-14" data-sidebar="rail">
    <SidebarNavItem icon={LayoutDashboard} to="/dashboard" />
    <SidebarNavItem icon={Users} to="/clients" />
    <SidebarNavItem icon={BarChart3} to="/analyse" />
    {/* legg til flere */}
  </nav>
)

export default SidebarRail
