
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  Building2, 
  MessageSquare, 
  Settings, 
  UserCog,
  LogIn,
  User,
  Book
} from 'lucide-react';

interface NavigationItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiredRole?: string[];
  requiresAuth: boolean;
}

const MainNavigation = () => {
  const { session } = useAuth();
  const { data: userProfile, isLoading } = useUserProfile();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Hovedoversikt og navigasjon',
      requiresAuth: true
    },
    {
      to: '/profil',
      label: 'Min profil',
      icon: User,
      description: 'Personlige innstillinger og profil',
      requiresAuth: true
    },
    {
      to: '/organisasjon',
      label: 'Organisasjon',
      icon: Building2,
      description: 'Firmaoversikt og struktur',
      requiresAuth: true
    },
    {
      to: '/klienter',
      label: 'Klienter',
      icon: Users,
      description: 'Klientoversikt og administrasjon',
      requiresAuth: true
    },
    {
      to: '/kommunikasjon',
      label: 'Kommunikasjon',
      icon: MessageSquare,
      description: 'Chat og team-kommunikasjon',
      requiresAuth: true
    },
    {
      to: '/fag',
      label: 'Kunnskapsbase',
      icon: Book,
      description: 'Faglige ressurser og veiledning',
      requiresAuth: true
    },
    {
      to: '/organisasjonsinnstillinger',
      label: 'Organisasjonsinnstillinger',
      icon: Settings,
      description: 'Administrer firma og avdelinger',
      requiredRole: ['admin', 'partner'],
      requiresAuth: true
    },
    {
      to: '/brukeradministrasjon',
      label: 'Brukeradministrasjon',
      icon: UserCog,
      description: 'Administrer brukere og roller',
      requiredRole: ['admin', 'partner'],
      requiresAuth: true
    }
  ];

  const canAccessItem = (item: NavigationItem) => {
    if (!item.requiresAuth) return true;
    if (!session) return false;
    if (!item.requiredRole) return true;
    if (!userProfile) return false;
    return item.requiredRole.includes(userProfile.userRole);
  };

  const getAccessLevel = () => {
    if (!session) return 'Ikke logget inn';
    if (!userProfile) return 'Laster profil...';
    return `${userProfile.firstName} ${userProfile.lastName}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-center text-muted-foreground">Laster navigasjon...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Brukerstatus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>{getAccessLevel()}</span>
            {userProfile && (
              <Badge variant="outline" className="capitalize">
                {userProfile.userRole}
              </Badge>
            )}
          </div>
          {!session && (
            <Link to="/auth" className="mt-2 inline-block">
              <Button size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Logg inn
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {navigationItems.map((item) => {
          const isAccessible = canAccessItem(item);
          const isActive = location.pathname === item.to;
          
          return (
            <Card 
              key={item.to} 
              className={`transition-all hover:shadow-md ${
                isActive ? 'ring-2 ring-primary' : ''
              } ${!isAccessible ? 'opacity-50' : ''}`}
            >
              <CardContent className="p-4">
                {isAccessible ? (
                  <Link to={item.to} className="block">
                    <div className="flex items-center gap-3 mb-2">
                      <item.icon className="h-6 w-6 text-primary" />
                      <span className="font-semibold">{item.label}</span>
                      {isActive && <Badge variant="default">Aktiv</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </Link>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <item.icon className="h-6 w-6 text-muted-foreground" />
                      <span className="font-semibold text-muted-foreground">{item.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {item.requiredRole && (
                      <p className="text-xs text-orange-600 mt-1">
                        Krever rolle: {item.requiredRole.join(' eller ')}
                      </p>
                    )}
                    {!session && (
                      <p className="text-xs text-orange-600 mt-1">
                        Krever innlogging
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MainNavigation;
