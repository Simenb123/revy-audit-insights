import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AIRevioSidebar } from './AIRevioSidebar';
import { Button } from '@/components/ui/button';
import { Bell, User, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIRevioLayoutProps {
  children: React.ReactNode;
}

export function AIRevioLayout({ children }: AIRevioLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AIRevioSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 h-full">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden" />
                <div className="hidden lg:block">
                  <h1 className="text-lg font-semibold">AI Revio Platform</h1>
                  <p className="text-sm text-muted-foreground">Intelligent revisjon med kunstig intelligens</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    3
                  </Badge>
                </Button>
                
                {/* Quick Settings */}
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                
                {/* User Profile */}
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:block">Bruker</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 animate-fade-in">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-card/30 py-4 px-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>© 2024 AI Revio Platform</span>
                <span>v2.1.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Sist oppdatert: {new Date().toLocaleDateString('nb-NO')}</span>
                <Badge variant="success" className="animate-pulse">
                  AI Aktiv
                </Badge>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}