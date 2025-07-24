
import { logger } from '@/utils/logger';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Settings, User } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
// Removed the Revi icon logo from the header. The "Revio" text will act as the
// main logo and link to the dashboard instead.
import GlobalSearch from './GlobalSearch';

interface AppHeaderProps {
  className?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ className = '' }) => {
  const { session } = useAuth();
  const { data: profile } = useUserProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      logger.error('Error signing out:', error);
    }
  };

  const userInitials = profile?.firstName && profile?.lastName
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
    : session?.user?.email?.charAt(0).toUpperCase() || 'U';

  const userName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : session?.user?.email || 'Bruker';

  return (
    <header className="sticky top-0 z-50 bg-revio-500 border-b border-revio-600 flex items-center justify-between px-6 py-3 text-white h-16 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <Link
            to="/"
            className="text-2xl font-extrabold tracking-wide text-white hover:opacity-90"
          >
            Revio
          </Link>
        </div>
        
        {/* Global Search */}
        <div className="hidden md:block">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-white hover:bg-revio-600">
          <Bell className="h-5 w-5" />
        </Button>
        
        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-revio-600">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>Innstillinger</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/organization/settings')}>
              Organisasjonsinnstillinger
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/organization')}>
              Organisasjonsoversikt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/organization/roles')}>
              Rolleadministrasjon
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-gray-100 text-gray-700">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              Logg ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
