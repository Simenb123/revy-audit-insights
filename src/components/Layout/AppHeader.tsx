
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, Settings, User, LogOut } from "lucide-react";
import { SidebarTrigger } from '@/components/ui/sidebar';
import Logo from './Logo';
import { useLocation, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClientDetails } from '@/hooks/useClientDetails';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AppHeader = () => {
  const location = useLocation();
  const { toast } = useToast();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client } = useClientDetails(orgNumber || '');
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Feil ved utlogging",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logget ut",
        description: "Du er nå logget ut av systemet.",
      });
    }
  };
  
  const getPageTitle = (pathname: string) => {
    // Debug logging
    console.log('AppHeader - pathname:', pathname);
    console.log('AppHeader - orgNumber:', orgNumber);
    console.log('AppHeader - client:', client);
    
    // If we're on a client page and have client data, show client name
    if (client && orgNumber && pathname.includes(`/klienter/${orgNumber}`)) {
      console.log('AppHeader - Returning client name:', client.companyName);
      return client.companyName;
    }
    
    const routes: Record<string, string> = {
      '/': 'Dashboard',
      '/analyser': 'Analyser',
      '/dokumenter': 'Dokumenter',
      '/prosjekter': 'Prosjekter',
      '/klienter': 'Klienter',
      '/innstillinger': 'Innstillinger',
      '/hjelp': 'Hjelp'
    };
    
    // Check if we're on a client page but don't have client data yet
    if (pathname.includes('/klienter/') && orgNumber && !client) {
      return 'Laster klient...';
    }
    
    return routes[pathname] || 'Dashboard';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header 
      data-cy="app-header" 
      className="sticky top-0 w-full bg-revio-500 flex flex-col z-30"
    >
      <div className="h-14 flex items-center justify-between px-4 border-b border-revio-600">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-white hover:bg-revio-600" />
          <Logo />
        </div>

        <div className="hidden md:flex items-center justify-center">
          <h1 className="text-2xl font-bold text-white relative px-8 py-2">
            {pageTitle}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-white rounded-full opacity-60" />
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-revio-600 rounded-md">
            <Bell size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-revio-600 rounded-md">
            <HelpCircle size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-revio-600 rounded-md">
            <Settings size={20} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-revio-600 rounded-md">
                <User size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
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

export default AppHeader;
