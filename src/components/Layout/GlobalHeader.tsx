
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
  UserCog
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { usePageTitle } from './PageTitleContext';
import { Badge } from '@/components/ui/badge';

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

  const isSuperAdmin = userProfile?.userRole === 'super_admin';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <span className="font-bold text-lg hidden sm:inline-block">Revio</span>
          </Link>
          
          {pageTitle && (
            <>
              <div className="hidden sm:block text-muted-foreground">/</div>
              <h1 className="font-semibold truncate text-sm sm:text-base">{pageTitle}</h1>
            </>
          )}
        </div>

        {/* Global søk */}
        <div className="flex items-center space-x-4">
          <div className="hidden lg:block w-80">
            <GlobalSearch />
          </div>

          {/* Innstillinger dropdown */}
          <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Innstillinger & Verktøy</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Organisasjon */}
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
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Verktøy & Ressurser</DropdownMenuLabel>
              
              {/* PDF-filer */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/admin/pdf-files')}>
                <FileText className="mr-2 h-4 w-4" />
                PDF-filer
              </DropdownMenuItem>
              
              {/* Standard kontoer */}
              <DropdownMenuItem onClick={() => handleSettingsItemClick('/admin/standard-accounts')}>
                <Calculator className="mr-2 h-4 w-4" />
                Standard kontoer
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Læring & Utdanning</DropdownMenuLabel>
              
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
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
