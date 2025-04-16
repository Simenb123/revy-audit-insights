
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
      '/dokumenter': 'Dokumenter',
      '/prosjekter': 'Prosjekter',
      '/klienter': 'Klienter',
      '/innstillinger': 'Innstillinger',
      '/hjelp': 'Hjelp'
    };
    return routes[pathname] || 'Dashboard';
  };

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

      <div className="hidden md:flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-20 animate-pulse" />
        <h1 className="text-2xl font-semibold text-white tracking-wide relative px-6 py-1 rounded-lg">
          {getPageTitle(location.pathname)}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-white/30 rounded-full" />
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
