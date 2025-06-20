
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react';

interface DocumentReference {
  id: string;
  fileName: string;
  category?: string;
  summary?: string;
  confidence?: number;
  textPreview?: string;
  uploadDate: string;
  relevantText?: string;
}

interface DocumentReferenceViewerProps {
  documents: DocumentReference[];
  title?: string;
  maxHeight?: string;
}

const DocumentReferenceViewer: React.FC<DocumentReferenceViewerProps> = ({
  documents,
  title = "Refererte dokumenter",
  maxHeight = "400px"
}) => {
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const toggleExpanded = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-100 text-gray-700';
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-blue-600" />
          {title} ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
          {documents.map((doc) => {
            const isExpanded = expandedDocs.has(doc.id);
            
            return (
              <Collapsible key={doc.id} open={isExpanded}>
                <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <CollapsibleTrigger
                    onClick={() => toggleExpanded(doc.id)}
                    className="w-full"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1 text-left">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {doc.fileName}
                            </span>
                            {doc.confidence && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getConfidenceColor(doc.confidence)}`}
                              >
                                {Math.round(doc.confidence * 100)}%
                              </Badge>
                            )}
                          </div>
                          
                          {doc.category && (
                            <Badge variant="outline" className="text-xs mb-2">
                              {doc.category}
                            </Badge>
                          )}
                          
                          {doc.summary && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {doc.summary}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {/* Upload info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Lastet opp: {new Date(doc.uploadDate).toLocaleDateString('no-NO')}</span>
                        </div>
                        {doc.confidence && (
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            <span>AI-sikkerhet: {Math.round(doc.confidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Relevant text preview */}
                      {(doc.relevantText || doc.textPreview) && (
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            {doc.relevantText ? 'Relevant innhold:' : 'Forhåndsvisning:'}
                          </p>
                          <p className="text-xs text-gray-600 italic">
                            "{doc.relevantText || doc.textPreview}"
                          </p>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Vis dokument
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Åpne
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentReferenceViewer;
