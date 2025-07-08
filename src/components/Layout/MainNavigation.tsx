
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  Building2, 
  MessageSquare, 
  UserCog, 
  GraduationCap, 
  FileText, 
  Settings,
  BookOpen,
  Brain,
  BarChart3
} from 'lucide-react';

const MainNavigation = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashbord', href: '/dashboard', icon: Home },
    { name: 'Klienter', href: '/clients', icon: Users },
    { name: 'Organisasjon', href: '/organization', icon: Building2 },
    { name: 'Kommunikasjon', href: '/communication', icon: MessageSquare },
    { name: 'Teams', href: '/teams', icon: UserCog },
    { name: 'Opplæring', href: '/training', icon: GraduationCap },
    { name: 'Dokumenter', href: '/documents', icon: FileText },
    { name: 'Fagstoff', href: '/fag', icon: BookOpen },
    { name: 'AI-bruk', href: '/ai-usage', icon: BarChart3 },
    { name: 'AI Revy Admin', href: '/ai-revy-admin', icon: Brain },
    { name: 'Innstillinger', href: '/organization/settings', icon: Settings },
  ];

  return (
    <nav className="space-y-1">
      {navigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <item.icon className="mr-3 h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

export default MainNavigation;
