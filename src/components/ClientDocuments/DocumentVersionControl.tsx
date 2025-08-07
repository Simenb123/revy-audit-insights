import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GitBranch, 
  Clock, 
  User, 
  FileText, 
  ArrowLeftRight, 
  Download,
  History,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocumentsList';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface DocumentVersionControlProps {
  documents: ClientDocument[];
  className?: string;
}

interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
  changes: string[];
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

export const DocumentVersionControl: React.FC<DocumentVersionControlProps> = ({
  documents,
  className = ""
}) => {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('versions');

  // Mock version data - in real implementation, this would come from the backend
  const documentVersions: DocumentVersion[] = [
    {
      id: '1',
      documentId: documents[0]?.id || '',
      versionNumber: 3,
      fileName: 'regnskapsdata_v3.pdf',
      changes: ['Oppdaterte skattetall', 'Rettet avskrivninger', 'Lagt til noter'],
      createdAt: new Date().toISOString(),
      createdBy: 'Revisor Hansen',
      status: 'approved',
      approvedBy: 'Senior Partner',
      approvedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '2',
      documentId: documents[0]?.id || '',
      versionNumber: 2,
      fileName: 'regnskapsdata_v2.pdf',
      changes: ['Første revisjon', 'Kvalitetskontroll'],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      createdBy: 'Junior Revisor',
      status: 'approved',
      approvedBy: 'Revisor Hansen',
      approvedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const getStatusIcon = (status: DocumentVersion['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: DocumentVersion['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (documents.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Ingen dokumenter å spore versjoner for</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Dokumentversjonering
          </CardTitle>
          <CardDescription>
            Spor endringer, godkjenninger og revisjonshistorikk for alle dokumenter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="versions">Versjoner</TabsTrigger>
              <TabsTrigger value="comparison">Sammenligning</TabsTrigger>
              <TabsTrigger value="audit-trail">Revisjonslogg</TabsTrigger>
            </TabsList>

            <TabsContent value="versions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Velg dokument</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {documents.slice(0, 5).map((doc) => (
                          <div
                            key={doc.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                              selectedDocument === doc.id ? 'bg-accent border-primary' : ''
                            }`}
                            onClick={() => setSelectedDocument(doc.id)}
                          >
                            <div className="flex items-start gap-2">
                              <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{doc.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(doc.created_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Version History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Versjonshistorikk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDocument ? (
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {documentVersions.map((version) => (
                            <div key={version.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">v{version.versionNumber}</Badge>
                                  {getStatusIcon(version.status)}
                                  <Badge className={getStatusColor(version.status)}>
                                    {version.status === 'approved' ? 'Godkjent' : 
                                     version.status === 'rejected' ? 'Avvist' : 'Utkast'}
                                  </Badge>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <p className="text-sm font-medium mb-1">{version.fileName}</p>
                              
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {version.createdBy}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(version.createdAt), 'dd.MM.yyyy HH:mm', { locale: nb })}
                                </div>
                              </div>

                              {version.changes.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium mb-1">Endringer:</p>
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {version.changes.map((change, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-primary">•</span>
                                        {change}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {version.status === 'approved' && version.approvedBy && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs text-green-600">
                                    Godkjent av {version.approvedBy} · {format(new Date(version.approvedAt!), 'dd.MM.yyyy', { locale: nb })}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-muted-foreground">
                        <div className="text-center">
                          <History className="h-8 w-8 mx-auto mb-2" />
                          <p>Velg et dokument for å se versjonshistorikk</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Alert>
                <ArrowLeftRight className="h-4 w-4" />
                <AlertDescription>
                  Sammenlign to versjoner av samme dokument for å se endringer og forskjeller.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Versjon A</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Velg første versjon å sammenligne</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Versjon B</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Velg andre versjon å sammenligne</p>
                  </CardContent>
                </Card>
              </div>
              
              <Button className="w-full" disabled>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Sammenlign versjoner
              </Button>
            </TabsContent>

            <TabsContent value="audit-trail" className="space-y-4">
              <Alert>
                <History className="h-4 w-4" />
                <AlertDescription>
                  Komplett revisjonslogg som viser alle endringer, godkjenninger og tilganger til dokumenter.
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[
                      { action: 'Dokument opprettet', user: 'System', time: '10:30', date: 'I dag' },
                      { action: 'AI-analyse fullført', user: 'AI Pipeline', time: '10:32', date: 'I dag' },
                      { action: 'Kategori tildelt', user: 'Revisor Hansen', time: '14:15', date: 'I dag' },
                      { action: 'Dokument åpnet', user: 'Junior Revisor', time: '09:45', date: 'I går' }
                    ].map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-3 pb-3 border-b last:border-b-0">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.user} · {entry.date} {entry.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};