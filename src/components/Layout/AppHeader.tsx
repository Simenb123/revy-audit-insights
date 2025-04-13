
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, Settings, User } from "lucide-react";
import Logo from './Logo';

const AppHeader = () => {
  return (
    <header className="w-full bg-revio-500 px-4 py-2 flex items-center justify-between">
      <Logo />
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-revio-600">
          <Bell size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-revio-600">
          <HelpCircle size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-revio-600">
          <Settings size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-revio-600">
          <User size={20} />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
