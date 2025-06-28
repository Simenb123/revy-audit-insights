
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
      console.error('Error signing out:', error);
    }
  };

  const userInitials = profile?.firstName && profile?.lastName
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
    : session?.user?.email?.charAt(0).toUpperCase() || 'U';

  const userName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : session?.user?.email || 'Bruker';

  return (
    <header className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-12 flex items-center justify-between px-4 ${className}`}>
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">AI-Revi</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
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
            <DropdownMenuItem onClick={() => navigate('/user-profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/organization-settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Innstillinger</span>
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
