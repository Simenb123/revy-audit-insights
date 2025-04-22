import React from 'react';
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, Settings, User, Menu, LogOut } from "lucide-react";
import Logo from './Logo';
import { useSidebar } from '@/components/ui/sidebar';
import { useLocation, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClientDetails } from '@/hooks/useClientDetails';
import ClientBreadcrumb from '../Clients/ClientDetails/ClientBreadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AppHeader = () => {
  const { toggleSidebar } = useSidebar();
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
    const routes: Record<string, string> = {
      '/': 'Dashboard',
      '/analyser': 'Analyser',
      '/dokumenter': 'Dokumenter',
      '/prosjekter': 'Prosjekter',
      '/klienter': 'Klienter',
      '/innstillinger': 'Innstillinger',
      '/hjelp': 'Hjelp'
    };
    return routes[pathname] || client?.companyName || 'Dashboard';
  };

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center bg-primary-600 px-6 text-white shadow">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white hover:bg-primary-700 rounded-md" 
          onClick={toggleSidebar}
        >
          <Menu size={20} />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Logo />
      </div>

      <div className="hidden md:flex items-center justify-center">
        <h1 className="text-2xl font-bold text-white relative px-8 py-2">
          {getPageTitle(location.pathname)}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-white rounded-full opacity-60" />
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-primary-700 rounded-md">
          <Bell size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-primary-700 rounded-md">
          <HelpCircle size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-primary-700 rounded-md">
          <Settings size={20} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-primary-700 rounded-md">
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
    </header>
  );
};
export default AppHeader;
