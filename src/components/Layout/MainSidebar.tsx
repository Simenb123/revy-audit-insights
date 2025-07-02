import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Users,
  BarChart3,
  BookOpen,
  Settings,
  HelpCircle,
  Building2
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isSystemGroup?: boolean;
}

const MainSidebar = () => {
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard'
    },
    {
      id: 'clients',
      label: 'Klienter',
      icon: Users,
      href: '/klienter'
    },
    {
      id: 'analytics',
      label: 'Analyser',
      icon: BarChart3,
      href: '/analyser'
    },
    {
      id: 'knowledge',
      label: 'Fag',
      icon: BookOpen,
      href: '/fag'
    }
  ];

  const systemItems: NavigationItem[] = [
    {
      id: 'organization',
      label: 'Organisasjon',
      icon: Building2,
      href: '/organization',
      isSystemGroup: true
    },
    {
      id: 'settings',
      label: 'Innstillinger',
      icon: Settings,
      href: '/organization-settings',
      isSystemGroup: true
    },
    {
      id: 'help',
      label: 'Hjelp',
      icon: HelpCircle,
      href: '/help',
      isSystemGroup: true
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const active = isActive(item.href);
    const IconComponent = item.icon;

    return (
      <Link
        key={item.id}
        to={item.href}
        className={`
          flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
          ${active 
            ? 'bg-revio-600 text-white' 
            : 'text-revio-100 hover:bg-revio-500 hover:text-white'
          }
        `}
      >
        <IconComponent className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col bg-revio-500">
      {/* Logo/Brand */}
      <div className="p-6">
        <h1 className="text-xl font-semibold text-white">Revio</h1>
      </div>

      {/* Main Navigation */}
      <div className="flex-1">
        <div className="space-y-1 px-2">
          <div className="mb-4">
            <h2 className="px-2 text-xs font-semibold text-revio-200 uppercase tracking-wider">
              Hovedmeny
            </h2>
            <div className="mt-2 space-y-1">
              {navigationItems.map(renderNavigationItem)}
            </div>
          </div>

          <div>
            <h2 className="px-2 text-xs font-semibold text-revio-200 uppercase tracking-wider">
              System
            </h2>
            <div className="mt-2 space-y-1">
              {systemItems.map(renderNavigationItem)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainSidebar;