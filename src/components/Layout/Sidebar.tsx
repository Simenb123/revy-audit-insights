import { cn } from '@/lib/utils';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Home, BarChart2, FileText, FolderOpen, Settings, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';

type SidebarProps = {
  /** Ekstra Tailwind / clsx klasser */
  className?: string;
  /** På mobil skjules sidebar automatisk av «MobileNav» */
};

export default function Sidebar({ className = '' }: SidebarProps) {
  return (
    <aside
      className={cn(
        'w-64 shrink-0 border-r bg-white flex flex-col',
        className,
      )}
    >
      <div className="p-2 flex items-center justify-between border-b">
        <h2 className="text-lg font-semibold text-revio-900 px-2">Navigasjon</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {}}
          className="h-8 w-8 text-revio-900 hover:bg-revio-100 rounded-md"
          aria-label="Skjul sidemeny"
        >
          <ChevronLeft size={20} />
        </Button>
      </div>
      
      <ScrollArea className="h-full pb-10">
        <div className="flex flex-col h-full justify-between p-2">
          <div className="space-y-1">
            <Link 
              to="/klienter" 
              className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100"
            >
              <span className="text-revio-900"><Users size={20} /></span>
              <span className="text-revio-900 truncate">Klienter</span>
            </Link>
            <Link 
              to="/regnskap" 
              className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100"
            >
              <span className="text-revio-900"><FileText size={20} /></span>
              <span className="text-revio-900 truncate">Regnskap</span>
            </Link>
            <Link 
              to="/" 
              className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100"
            >
              <span className="text-revio-900"><Home size={20} /></span>
              <span className="text-revio-900 truncate">Dashboard</span>
            </Link>
            <Link 
              to="/analyser" 
              className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100"
            >
              <span className="text-revio-900"><BarChart2 size={20} /></span>
              <span className="text-revio-900 truncate">Analyser</span>
            </Link>
            <Link 
              to="/dokumenter" 
              className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100"
            >
              <span className="text-revio-900"><FileText size={20} /></span>
              <span className="text-revio-900 truncate">Dokumenter</span>
            </Link>
            <Link 
              to="/prosjekter" 
              className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100"
            >
              <span className="text-revio-900"><FolderOpen size={20} /></span>
              <span className="text-revio-900 truncate">Prosjekter</span>
            </Link>
          </div>
          
          <div className="space-y-1 pt-2 border-t">
            <Link 
              to="/innstillinger" 
              className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100"
            >
              <span className="text-revio-900"><Settings size={20} /></span>
              <span className="text-revio-900 truncate">Innstillinger</span>
            </Link>
            <Link 
              to="/hjelp" 
              className="flex h-10 items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-revio-100"
            >
              <span className="text-revio-900"><HelpCircle size={20} /></span>
              <span className="text-revio-900 truncate">Hjelp</span>
            </Link>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
