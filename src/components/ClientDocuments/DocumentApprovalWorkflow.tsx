import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  MessageSquare,
  AlertTriangle,
  Workflow,
  Send,
  Eye
} from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocumentsList';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface DocumentApprovalWorkflowProps {
  documents: ClientDocument[];
  className?: string;
}

interface ApprovalRequest {
  id: string;
  documentId: string;
  fileName: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  workflowStage: 'junior_review' | 'senior_review' | 'partner_approval' | 'final_approval';
}

export const DocumentApprovalWorkflow: React.FC<DocumentApprovalWorkflowProps> = ({
  documents,
  className = ""
}) => {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Mock approval requests - in real implementation, this would come from the backend
  const approvalRequests: ApprovalRequest[] = [
    {
      id: '1',
      documentId: documents[0]?.id || '',
      fileName: 'Årsrapport 2024 - Utkast',
      requestedBy: 'Junior Revisor',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      priority: 'high',
      deadline: new Date(Date.now() + 172800000).toISOString(), // 2 days
      workflowStage: 'senior_review'
    },
    {
      id: '2',
      documentId: documents[1]?.id || '',
      fileName: 'Skatteberegninger Q4',
      requestedBy: 'Revisor Hansen',
      requestedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'approved',
      reviewedBy: 'Senior Partner',
      reviewedAt: new Date(Date.now() - 43200000).toISOString(),
      comments: 'Ser bra ut, godkjent for levering til klient.',
      priority: 'medium',
      workflowStage: 'final_approval'
    },
    {
      id: '3',
      documentId: documents[2]?.id || '',
      fileName: 'Internkontroll rapport',
      requestedBy: 'Junior Revisor',
      requestedAt: new Date(Date.now() - 172800000).toISOString(),
      status: 'changes_requested',
      reviewedBy: 'Revisor Hansen',
      reviewedAt: new Date(Date.now() - 86400000).toISOString(),
      comments: 'Mangler dokumentasjon for kontroller i avdeling 2. Må kompletteres før godkjenning.',
      priority: 'medium',
      workflowStage: 'senior_review'
    }
  ];

  const getStatusIcon = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'changes_requested':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: ApprovalRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'changes_requested':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority: ApprovalRequest['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkflowStageText = (stage: ApprovalRequest['workflowStage']) => {
    switch (stage) {
      case 'junior_review':
        return 'Junior Review';
      case 'senior_review':
        return 'Senior Review';
      case 'partner_approval':
        return 'Partner Godkjenning';
      case 'final_approval':
        return 'Endelig Godkjenning';
      default:
        return stage;
    }
  };

  const filteredRequests = approvalRequests.filter(request => {
    switch (activeTab) {
      case 'pending':
        return request.status === 'pending';
      case 'completed':
        return request.status === 'approved' || request.status === 'rejected';
      case 'changes':
        return request.status === 'changes_requested';
      default:
        return true;
    }
  });

  const handleApproval = (requestId: string, action: 'approve' | 'reject' | 'request_changes') => {
    console.log(`${action} request ${requestId} with comment: ${reviewComment}`);
    // In real implementation, this would call an API
    setReviewComment('');
  };

  if (documents.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Ingen dokumenter til godkjenning</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Godkjenningsarbeidsflyt
          </CardTitle>
          <CardDescription>
            Administrer dokumentgodkjenninger og kvalitetskontroll i revisjonsarbeidet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Til godkjenning ({approvalRequests.filter(r => r.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="changes">
                Endringer ({approvalRequests.filter(r => r.status === 'changes_requested').length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Fullført ({approvalRequests.filter(r => ['approved', 'rejected'].includes(r.status)).length})
              </TabsTrigger>
              <TabsTrigger value="all">Alle</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Godkjenningsforespørsler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {filteredRequests.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Workflow className="h-8 w-8 mx-auto mb-2" />
                            <p>Ingen forespørsler i denne kategorien</p>
                          </div>
                        ) : (
                          filteredRequests.map((request) => (
                            <div
                              key={request.id}
                              className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                                selectedRequest === request.id ? 'bg-accent border-primary' : ''
                              }`}
                              onClick={() => setSelectedRequest(request.id)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(request.status)}
                                  <Badge className={getStatusColor(request.status)}>
                                    {request.status === 'pending' ? 'Avventer' :
                                     request.status === 'approved' ? 'Godkjent' :
                                     request.status === 'rejected' ? 'Avvist' : 'Endringer ønsket'}
                                  </Badge>
                                </div>
                                <Badge className={getPriorityColor(request.priority)}>
                                  {request.priority === 'urgent' ? 'Akutt' :
                                   request.priority === 'high' ? 'Høy' :
                                   request.priority === 'medium' ? 'Medium' : 'Lav'}
                                </Badge>
                              </div>
                              
                              <p className="font-medium text-sm mb-1">{request.fileName}</p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {getWorkflowStageText(request.workflowStage)}
                              </p>
                              
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Forespurt av {request.requestedBy}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(request.requestedAt), 'dd.MM.yyyy HH:mm', { locale: nb })}
                                </div>
                                {request.deadline && (
                                  <div className="flex items-center gap-1 text-orange-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    Frist: {format(new Date(request.deadline), 'dd.MM.yyyy', { locale: nb })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Review Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Review Panel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedRequest ? (
                      <div className="space-y-4">
                        {(() => {
                          const request = approvalRequests.find(r => r.id === selectedRequest);
                          if (!request) return null;

                          return (
                            <>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="font-medium">{request.fileName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  Forespurt av {request.requestedBy}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(request.requestedAt), 'dd.MM.yyyy HH:mm', { locale: nb })}
                                </div>
                              </div>

                              {request.comments && (
                                <Alert>
                                  <MessageSquare className="h-4 w-4" />
                                  <AlertDescription>
                                    <strong>Tidligere kommentarer:</strong><br />
                                    {request.comments}
                                  </AlertDescription>
                                </Alert>
                              )}

                              {request.status === 'pending' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">
                                      Review kommentar:
                                    </label>
                                    <Textarea
                                      value={reviewComment}
                                      onChange={(e) => setReviewComment(e.target.value)}
                                      placeholder="Skriv inn kommentarer til godkjenningen..."
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleApproval(request.id, 'approve')}
                                      className="flex-1"
                                      variant="default"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Godkjenn
                                    </Button>
                                    <Button
                                      onClick={() => handleApproval(request.id, 'request_changes')}
                                      className="flex-1"
                                      variant="outline"
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Be om endringer
                                    </Button>
                                    <Button
                                      onClick={() => handleApproval(request.id, 'reject')}
                                      className="flex-1"
                                      variant="destructive"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Avvis
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <Button variant="outline" className="w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                Åpne dokument
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                          <p>Velg en forespørsel for å starte review</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};