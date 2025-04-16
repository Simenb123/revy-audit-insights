
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, Settings, User, Menu } from "lucide-react";
import Logo from './Logo';
import { useSidebar } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';

const AppHeader = () => {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  
  // Map routes to display names
  const getPageTitle = (pathname: string) => {
    const routes: Record<string, string> = {
      '/': 'Dashboard',
      '/analyser': 'Analyser',
      '/analyser/transaksjoner': 'Transaksjonsutvalg',
      '/dokumenter': 'Dokumenter',
      '/prosjekter': 'Prosjekter',
      '/klienter': 'Klienter',
      '/innstillinger': 'Innstillinger',
      '/hjelp': 'Hjelp'
    };
    return routes[pathname] || 'Dashboard';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 w-full bg-revio-500 h-14 flex items-center justify-between px-4 border-b border-revio-600 z-20">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white hover:bg-revio-600 rounded-md" 
          onClick={toggleSidebar}
        >
          <Menu size={20} />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Logo />
      </div>

      <div className="flex items-center justify-center">
        <h1 className="text-2xl font-bold text-white relative px-8 py-2">
          {pageTitle}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full opacity-60" />
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
        <Button variant="ghost" size="icon" className="text-white hover:bg-revio-600 rounded-md">
          <User size={20} />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
