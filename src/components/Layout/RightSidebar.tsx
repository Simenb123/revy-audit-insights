
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Calendar, AlertCircle } from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import AdminSidebarContent from '@/components/AIRevyAdmin/AdminSidebarContent';
import KnowledgeStatusIndicator from '@/components/Revy/KnowledgeStatusIndicator';

interface RightSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  width?: number;
  onWidthChange?: (newWidth: number) => void;
}

const RightSidebar = ({ isCollapsed, onToggle, width, onWidthChange }: RightSidebarProps) => {
  const location = useLocation();
  
  console.log('🔍 [RIGHT_SIDEBAR] Current path:', location.pathname);

  // Check if we're on an admin page - fixed to handle both with and without hyphens
  const isAdminPage = location.pathname.startsWith('/ai-revy-admin') || 
                     location.pathname.startsWith('/user-admin') || 
                     location.pathname.startsWith('/ai-usage') ||
                     location.pathname.startsWith('/audit-logs');

  console.log('🔍 [RIGHT_SIDEBAR] Is admin page:', isAdminPage);

  // If it's an admin page, show admin content
  if (isAdminPage) {
    console.log('🔍 [RIGHT_SIDEBAR] Admin page detected, showing admin content');
    return (
      <div className="w-80 border-l bg-background p-4">
        <AdminSidebarContent />
      </div>
    );
  }

  // Check if we're on fagstoff/knowledge pages
  const isKnowledgePage = location.pathname.startsWith('/fag');
  
  if (isKnowledgePage) {
    return (
      <div className="w-80 border-l bg-background p-4">
        <div className="space-y-4">
          {/* Knowledge Status Indicator */}
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
        </div>
      </div>
    );
  }

  // Extract client ID from URL (org number or UUID) for client pages
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let clientId = '';
  
  // Look for org number pattern (9 digits) or UUID in path
  for (const segment of pathSegments) {
    if (/^\d{9}$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      clientId = segment;
      break;
    }
  }

  console.log('🔍 [RIGHT_SIDEBAR] Extracted clientId:', clientId);

  // If no client ID found and not on special pages, don't show sidebar
  if (!clientId) {
    console.log('🔍 [RIGHT_SIDEBAR] No client ID found and not on special pages, hiding sidebar');
    return null;
  }

  const {
    documentsCount,
    categoriesCount,
    isLoading,
    error
  } = useClientDocuments(clientId);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-80 border-l bg-background p-4">
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
      <div className="w-80 border-l bg-background p-4">
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

  // Show client-specific content
  return (
    <div className="w-80 border-l bg-background p-4">
      <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default RightSidebar;
