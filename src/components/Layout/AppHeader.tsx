
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PanelRightOpen, 
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
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 shrink-0 items-center justify-between bg-gradient-to-r from-revio-500 to-revio-600 text-white px-4 shadow-lg">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-white hover:bg-white/20 h-8 w-8" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold">R</span>
            </div>
            <span className="font-bold text-lg">Revio</span>
          </div>
          <div className="h-6 w-px bg-white/30"></div>
          <h1 className="text-lg font-semibold">Prosjekter</h1>
        </div>
      </div>
      
      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input 
            type="text"
            placeholder="Søk i prosjekter..."
            className="w-full pl-10 pr-4 py-2 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50"
          />
        </div>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20"
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20"
        >
          <Bell className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/20"
        >
          <User className="h-4 w-4" />
        </Button>
        
        {onRightSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRightSidebarToggle}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
