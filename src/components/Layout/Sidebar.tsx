
// Denne filen er nå kun en _wrapper_, og peker til SidebarNav.
import SidebarNav from "./SidebarNav";
import { cn } from '@/lib/utils';

type SidebarProps = {
  className?: string;
};
export default function Sidebar({ className = '' }: SidebarProps) {
  return (
    <aside className={cn('w-64 shrink-0 border-r bg-white flex flex-col', className)}>
      <SidebarNav />
    </aside>
  );
}
