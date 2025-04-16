
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, Settings, User } from "lucide-react";
import { useSidebar } from '@/components/ui/sidebar';

const AppHeader = () => {
  const { state, toggleSidebar } = useSidebar();
  
  return (
    <header className="w-full bg-revio-500 px-4 py-3 flex items-center justify-between border-b border-revio-600 z-10">
      <div className="flex items-center">
        {/* Empty space where the logo would go in a separate component */}
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
