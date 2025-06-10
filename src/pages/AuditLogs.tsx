
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useReviewAuditLog } from '@/hooks/useReviewAuditLog';
import { useCreateAuditLog } from '@/hooks/useCreateAuditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Filter, FileText, Eye, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import AuditLogStats from '@/components/AuditLogs/AuditLogStats';

const AuditLogs = () => {
  const { data: userProfile } = useUserProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { data: auditLogs, isLoading } = useAuditLogs({
    searchTerm,
    actionType: actionFilter !== 'all' ? actionFilter as any : undefined,
    isReviewed: statusFilter === 'reviewed' ? true : statusFilter === 'pending' ? false : undefined
  });

  const reviewAuditLog = useReviewAuditLog();
  const createAuditLog = useCreateAuditLog();

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'task_assigned': return 'bg-green-100 text-green-800';
      case 'document_uploaded': return 'bg-blue-100 text-blue-800';
      case 'analysis_performed': return 'bg-purple-100 text-purple-800';
      case 'review_completed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    switch (actionType) {
      case 'task_assigned': return 'Oppgave tildelt';
      case 'document_uploaded': return 'Dokument lastet opp';
      case 'analysis_performed': return 'Analyse utført';
      case 'review_completed': return 'Gjennomgang fullført';
      default: return actionType;
    }
  };

  const canReview = userProfile?.userRole === 'admin' || userProfile?.userRole === 'partner';

  const handleReview = (logId: string) => {
    reviewAuditLog.mutate(logId);
  };

  // Demo function to create a test audit log
  const handleCreateTestLog = () => {
    createAuditLog.mutate({
      clientId: 'demo-client-id',
      actionType: 'analysis_performed',
      areaName: 'Kommunikasjonssystem',
      description: 'Real-time chat implementert med Supabase real-time funksjonalitet',
      metadata: {
        feature: 'communication',
        tables: ['chat_rooms', 'messages', 'user_presence'],
        realtime: true
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster revisjonslogger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Revisjonslogger</h1>
          <p className="text-muted-foreground">
            Spor alle handlinger og anmeldelser i systemet
          </p>
        </div>
        {canReview && (
          <Button onClick={handleCreateTestLog} variant="outline">
            Opprett test-logg
          </Button>
        )}
      </div>

      {/* Stats */}
      <AuditLogStats />

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrer logger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Søk</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk i beskrivelse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Handlingstype</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg handlingstype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle handlinger</SelectItem>
                  <SelectItem value="task_assigned">Oppgave tildelt</SelectItem>
                  <SelectItem value="document_uploaded">Dokument lastet opp</SelectItem>
                  <SelectItem value="analysis_performed">Analyse utført</SelectItem>
                  <SelectItem value="review_completed">Gjennomgang fullført</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="pending">Venter på anmeldelse</SelectItem>
                  <SelectItem value="reviewed">Anmeldt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Aktivitetslogg
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getActionTypeColor(log.actionType)}>
                          {getActionTypeLabel(log.actionType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {log.areaName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', { locale: nb })}
                        </span>
                      </div>
                      
                      <h3 className="font-medium mb-1">{log.description}</h3>
                      
                      {log.metadata && (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded mt-2">
                          <pre className="whitespace-pre-wrap text-xs">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {log.isReviewed ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Anmeldt
                        </Badge>
                      ) : (
                        canReview && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReview(log.id)}
                            disabled={reviewAuditLog.isPending}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Anmeld
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ingen revisjonslogger funnet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
