
import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, AlertCircle, ChevronRight, ChevronLeft, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import AdminSidebarContent from '@/components/AIRevyAdmin/AdminSidebarContent';
import KnowledgeStatusIndicator from '@/components/Revy/KnowledgeStatusIndicator';
import AiReviCard from './AiReviCard';
import { detectPageType, extractClientId } from './pageDetectionHelpers';

interface ResizableRightSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  initialWidth?: number;
}

const ResizableRightSidebar = ({ 
  isCollapsed, 
  onToggle, 
  initialWidth = 320 
}: ResizableRightSidebarProps) => {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const location = useLocation();
  const pageType = detectPageType(location.pathname);
  const clientId = extractClientId(location.pathname);

  const {
    documentsCount,
    categoriesCount,
    isLoading,
    error
  } = useClientDocuments(clientId);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newWidth = Math.max(280, Math.min(600, window.innerWidth - e.clientX));
    setWidth(newWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle collapsed state
  if (isCollapsed) {
    return (
      <div className="w-16 border-l bg-background flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const sidebarStyle = {
    width: `${width}px`,
    minWidth: '280px',
    maxWidth: '600px'
  };

  return (
    <div className="relative flex">
      {/* Resize handle */}
      <div
        className="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center group"
        onMouseDown={handleMouseDown}
      >
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Sidebar content */}
      <div className="border-l bg-background p-4" style={sidebarStyle}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">
            {pageType === 'admin' ? 'Admin' : 
             pageType === 'knowledge' ? 'Kunnskapsbase' :
             clientId ? 'Klient' : 'Assistent'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Admin page content */}
        {pageType === 'admin' && <AdminSidebarContent />}

        {/* Knowledge page content */}
        {pageType === 'knowledge' && (
          <div className="space-y-4">
            <KnowledgeStatusIndicator />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Kunnskapsbase
                </CardTitle>
                <CardDescription>
                  AI Revi fagstoff og artikler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>AI Revi kan svare på spørsmål basert på fagartiklene i kunnskapsbasen.</p>
                </div>
              </CardContent>
            </Card>

            <AiReviCard 
              context="knowledge-base"
              title="AI-Revi Assistent"
              description="Spør AI-Revi om fagstoff og artikler"
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading && pageType === 'general' && (
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                Feil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Kunne ikke laste dokumentinformasjon
              </p>
            </CardContent>
          </Card>
        )}

        {/* Client-specific or general content */}
        {!isLoading && !error && pageType === 'general' && (
          <div className="space-y-4">
            {clientId && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Dokumenter
                    </CardTitle>
                    <CardDescription>
                      Dokumentstatus for klient
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Totalt dokumenter</span>
                      <Badge variant="secondary">{documentsCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Kategorier</span>
                      <Badge variant="outline">{categoriesCount}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <AiReviCard 
                  context="client-detail"
                  clientData={{ id: clientId }}
                  title="AI-Revi Assistent"
                  description="Klientspesifikk revisjonsassistanse"
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 w-4" />
                      Aktivitet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Ingen nylig aktivitet
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Ingen teammedlemmer tilordnet
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {!clientId && (
              <AiReviCard 
                context="general"
                title="AI-Revi Assistent"
                description="Din smarte revisjonsassistent"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResizableRightSidebar;
