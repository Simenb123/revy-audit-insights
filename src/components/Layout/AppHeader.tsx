
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Bell, 
  Settings,
  User
} from 'lucide-react';

interface AppHeaderProps {
  onRightSidebarToggle?: () => void;
}

const AppHeader = ({ onRightSidebarToggle }: AppHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 shrink-0 items-center justify-between bg-gradient-to-r from-revio-500 to-revio-600 text-white px-4 shadow-lg">
      {/* Left Section - SidebarTrigger removed */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold">R</span>
          </div>
          <span className="font-bold text-xl">Revio</span>
        </div>
        <div className="h-6 w-px bg-white/30"></div>
        <h1 className="text-lg font-semibold">RevisionAkademiet</h1>
      </div>
      
      {/* Center Section - Search */}
      <div className="flex-1 max-w-lg mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input 
            type="text"
            placeholder="Søk i opplæring og ressurser..."
            className="w-full pl-10 pr-4 py-2 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50"
          />
        </div>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/20"
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/20"
        >
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/20"
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/20"
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
