
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart2, 
  FileText, 
  FolderOpen, 
  Home,
  Users,
  Settings,
  HelpCircle
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <Home size={20} />,
  },
  {
    label: 'Analyser',
    href: '/analyser',
    icon: <BarChart2 size={20} />,
  },
  {
    label: 'Dokumenter',
    href: '/dokumenter',
    icon: <FileText size={20} />,
  },
  {
    label: 'Prosjekter',
    href: '/prosjekter',
    icon: <FolderOpen size={20} />,
  },
  {
    label: 'Klienter',
    href: '/klienter',
    icon: <Users size={20} />,
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: 'Innstillinger',
    href: '/innstillinger',
    icon: <Settings size={20} />,
  },
  {
    label: 'Hjelp',
    href: '/hjelp',
    icon: <HelpCircle size={20} />,
  },
];

const Sidebar = () => {
  const location = useLocation();
  
  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    
    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary-foreground",
          isActive 
            ? "bg-sidebar-accent text-primary-foreground" 
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-sidebar py-4 w-56">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold text-sidebar-foreground">
          Navigasjon
        </h2>
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </div>
      <div className="mt-auto px-3 py-2">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
