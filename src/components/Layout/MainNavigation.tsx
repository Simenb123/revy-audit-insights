
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  FileText, 
  Settings, 
  Brain,
  MessageSquare,
  Video,
  BarChart3,
  BookOpen,
  Building2,
  GraduationCap,
  Upload,
  UserCheck,
  Briefcase
} from 'lucide-react';

const MainNavigation = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Klienter', href: '/clients', icon: Users },
    { name: 'Samarbeid', href: '/collaboration', icon: Video, badge: 'NY' },
    { name: 'Kommunikasjon', href: '/communication', icon: MessageSquare },
    { name: 'Regnskapsdata', href: '/accounting-data', icon: BarChart3 },
    { name: 'Dataimport', href: '/data-import', icon: Upload },
    { name: 'Kunnskap', href: '/knowledge', icon: BookOpen },
    { name: 'Opplæring', href: '/training', icon: GraduationCap },
    { name: 'Teams', href: '/teams', icon: Briefcase },
    { name: 'Organisasjon', href: '/organization', icon: Building2 },
    { name: 'Brukeradministrasjon', href: '/user-admin', icon: UserCheck }
  ];

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => (
        <Link key={item.name} to={item.href}>
          <Button 
            variant={location.pathname.startsWith(item.href) ? "default" : "ghost"} 
            className="w-full justify-start gap-3"
          >
            <item.icon size={18} />
            <span>{item.name}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </Button>
        </Link>
      ))}
    </nav>
  );
};

export default MainNavigation;
