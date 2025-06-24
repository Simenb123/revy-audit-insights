
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import AdminSidebarContent from '@/components/AIRevyAdmin/AdminSidebarContent';
import KnowledgeStatusIndicator from '@/components/Revy/KnowledgeStatusIndicator';
import AiReviCard from './AiReviCard';
import { detectPageType, extractClientId } from './pageDetectionHelpers';

interface RightSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  width?: number;
  onWidthChange?: (newWidth: number) => void;
}

const RightSidebar = ({ isCollapsed, onToggle, width = 320, onWidthChange }: RightSidebarProps) => {
  const location = useLocation();
  const pageType = detectPageType(location.pathname);
  const clientId = extractClientId(location.pathname);

  // Always call useClientDocuments hook to avoid conditional hooks
  const {
    documentsCount,
    categoriesCount,
    isLoading,
    error
  } = useClientDocuments(clientId);

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

  // Apply width from props
  const sidebarStyle = {
    width: `${width}px`,
    minWidth: '280px',
    maxWidth: '600px'
  };

  // Admin page content
  if (pageType === 'admin') {
    return (
      <div className="border-l bg-background p-4" style={sidebarStyle}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Admin</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <AdminSidebarContent />
      </div>
    );
  }

  // Knowledge page content
  if (pageType === 'knowledge') {
    return (
      <div className="border-l bg-background p-4" style={sidebarStyle}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Kunnskapsbase</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
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
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="border-l bg-background p-4" style={sidebarStyle}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Laster...</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="border-l bg-background p-4" style={sidebarStyle}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Feil</h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
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
      </div>
    );
  }

  // Client-specific content or general content
  const isClientContext = clientId && clientId.length > 0;
  
  return (
    <div className="border-l bg-background p-4" style={sidebarStyle}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">
          {isClientContext ? 'Klient' : 'Assistent'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {isClientContext && (
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
                  <Calendar className="w-4 h-4" />
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

        {!isClientContext && (
          <AiReviCard 
            context="general"
            title="AI-Revi Assistent"
            description="Din smarte revisjonsassistent"
          />
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
