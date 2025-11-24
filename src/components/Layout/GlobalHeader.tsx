
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { 
  Settings, 
  LogOut, 
  User, 
  Building, 
  Users, 
  Shield,
  FileText,
  Calculator,
  GraduationCap,
  BookOpen,
  UserCog,
  Brain,
  BarChart3,
  LayoutDashboard,
  ListChecks
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { usePageTitle } from './PageTitleContext';
import { Badge } from '@/components/ui/badge';
import { RecentClientsDropdown } from './RecentClientsDropdown';

/**
 * GlobalHeader - Nivå 1: Øverste navigasjonsbar i applikasjonen
 * 
 * Denne komponenten vises alltid øverst på siden og inneholder:
 * - Logo og appnavn (Revio)
 * - Global søkefunksjon
 * - Nylig besøkte klienter (RecentClientsDropdown)
 * - Innstillinger-dropdown med tilgang til admin og verktøy
 * - Bruker-dropdown med profil og logg ut
 * 
 * Layout:
 * - Posisjon: sticky top-0, z-50
 * - Høyde: 56px (h-14)
 * - Token: --brand-header (--revio-500) - mørkere teal, matcher sidebar
 * - Styling: bg-brand-header/95 backdrop-blur
 * 
 * VIKTIG: Dette er IKKE sub-headeren. Sub-header rendres under denne
 * via GlobalSubHeader.tsx eller ClientSubHeader.tsx.
 * 
 * @see GlobalSubHeader.tsx - Sub-header (Nivå 2)
 * @see ClientSubHeader.tsx - Klient-spesifikk sub-header
 * @see docs/design/layout-architecture.md - Full arkitektur-dokumentasjon
 */
const GlobalHeader = () => {
  const { signOut } = useAuth();
  const { data: userProfile } = useUserProfile();
  const navigate = useNavigate();
  const { pageTitle } = usePageTitle();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!userProfile?.firstName || !userProfile?.lastName) return 'U';
    return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
  };

  const getDisplayName = () => {
    if (!userProfile?.firstName || !userProfile?.lastName) {
      return userProfile?.email || 'Bruker';
    }
    return `${userProfile.firstName} ${userProfile.lastName}`;
  };

  const handleSettingsItemClick = (path: string) => {
    navigate(path);
    setIsSettingsOpen(false);
  };

  const { data: isSuperAdmin } = useIsSuperAdmin();

  // Administrative areas - role-based access
  const adminItems = [
    {
      title: 'Klientadmin',
      url: '/client-admin',
      icon: Building,
      roles: ['admin', 'partner', 'manager'] as const,
    },
    {
      title: 'Brukeradmin',
      url: '/user-admin',
      icon: Users,
      roles: ['admin', 'partner', 'employee'] as const,
    },
    {
      title: 'AI Admin',
      url: '/ai-revy-admin',
      icon: Brain,
      roles: ['admin'] as const,
    },
    {
      title: 'Revisjonshandlinger',
      url: '/admin/audit-action-library',
      icon: ListChecks,
      roles: ['admin', 'partner', 'manager'] as const,
    },
  ];

  const canAccessAdminItem = (roles: readonly string[]) => {
    if (!userProfile?.userRole) return false;
    return roles.includes(userProfile.userRole);
  };

  const filteredAdminItems = adminItems.filter(item => 
    !item.roles || canAccessAdminItem(item.roles)
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-brand-header/95 backdrop-blur supports-[backdrop-filter]:bg-brand-header/60">
      <div className="flex h-14 items-center px-4">
        {/* Logo og tittel */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <Link 
            to="/" 
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline-block text-white">Revio</span>
          </Link>
          
          {pageTitle && (
            <>
              <div className="hidden sm:block text-white/60">/</div>
              <h1 className="font-semibold truncate text-sm sm:text-base text-white">{pageTitle}</h1>
            </>
          )}
        </div>

        {/* Global søk */}
        <div className="flex items-center space-x-4">
          <div className="hidden lg:block w-80">
            <GlobalSearch />
          </div>

          {/* Nylig besøkte klienter */}
          <RecentClientsDropdown />

          {/* Innstillinger dropdown */}
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative text-white hover:bg-white/10">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Innstillinger & Verktøy</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Organisasjon & Innstillinger */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Organisasjonsinnstillinger
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/admin/organization-overview')}>
                <Building className="mr-2 h-4 w-4" />
                Organisasjonsoversikt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/admin/role-administration')}>
                <Users className="mr-2 h-4 w-4" />
                Rolleadministrasjon
              </DropdownMenuItem>

              {/* Administrasjon - kun hvis brukeren har tilgang til minst ett element */}
              {filteredAdminItems.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Administrasjon</DropdownMenuLabel>
                  {filteredAdminItems.map((item) => (
                    <DropdownMenuItem key={item.title} onClick={() => handleSettingsItemClick(item.url)}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.title}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Verktøy & Ressurser</DropdownMenuLabel>
              
              {/* Dashboard */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              
              {/* Team */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/teams')}>
                <Users className="mr-2 h-4 w-4" />
                Team
              </DropdownMenuItem>
              
              {/* Budsjett */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/resource-planner')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Budsjett
              </DropdownMenuItem>
              
              {/* PDF-filer */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/admin/pdf-files')}>
                <FileText className="mr-2 h-4 w-4" />
                PDF-filer
              </DropdownMenuItem>
              
              {/* Standard kontoer */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/standard-accounts')}>
                <Calculator className="mr-2 h-4 w-4" />
                Standard kontoer
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Læring & Utdanning</DropdownMenuLabel>
              
              {/* Revisorskolen */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/revisorskolen')}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Revisorskolen
              </DropdownMenuItem>
              
              {/* Revisjons Akademiet */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/learning/audit-academy')}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Revisjons Akademiet
              </DropdownMenuItem>
              
              {/* Læring */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/learning')}>
                <BookOpen className="mr-2 h-4 w-4" />
                Læring
              </DropdownMenuItem>
              
              {/* Superadmin - kun synlig for super_admin */}
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>System</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleSettingsItemClick('/superadmin')}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Superadmin</span>
                    <Badge variant="destructive" className="ml-2 text-xs">
                      ADMIN
                    </Badge>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bruker dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full text-white hover:bg-white/10">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={getDisplayName()} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.email}
                  </p>
                  {userProfile?.workplaceCompanyName && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile.workplaceCompanyName}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logg ut</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
