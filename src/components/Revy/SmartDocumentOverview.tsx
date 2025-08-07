import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Brain, 
  MessageSquare,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocumentsList';
import { Client } from '@/types/revio';
import DocumentInsights from './DocumentInsights';
import ContextAwareRevyChat from './ContextAwareRevyChat';

interface SmartDocumentOverviewProps {
  client: Client;
  documents: ClientDocument[];
  className?: string;
}

const SmartDocumentOverview: React.FC<SmartDocumentOverviewProps> = ({
  client,
  documents,
  className = ''
}) => {
  const [showChat, setShowChat] = React.useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = React.useState(false);

  const quickSuggestions = [
    "Hvilke dokumenter trenger gjennomgang?",
    "Hva viser de siste fakturaene?",
    "Finn dokumenter om økonomisk status",
    "Sammendrag av alle rapporter",
    "Identifiser manglende dokumenter"
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Smarte Dokumenter med AI-Revy
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Smart søk
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <MessageSquare className="h-4 w-4" />
                Chat med AI-Revy
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Hurtigspørsmål til AI-Revy:</h3>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.slice(0, 3).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2"
                    onClick={() => setShowChat(true)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-muted-foreground">
                  AI-Revy kan analysere {documents.length} dokumenter
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      {showChat && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ContextAwareRevyChat
              client={client}
              onClose={() => setShowChat(false)}
              className="h-[600px]"
            />
          </div>
          <div>
            <DocumentInsights 
              documents={documents}
              className="h-[600px] overflow-y-auto"
            />
          </div>
        </div>
      )}

      {/* Document Insights (always visible when not in chat mode) */}
      {!showChat && (
        <DocumentInsights documents={documents} />
      )}

      {/* Advanced Search Interface */}
      {showAdvancedSearch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              AI-drevet dokumentsøk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Søk i dokumenter</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Søk med naturlig språk..."
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    />
                    <Button size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Filtre</label>
                  <div className="flex gap-2">
                    <select className="px-3 py-2 border rounded-md text-sm">
                      <option>Alle kategorier</option>
                      <option>Faktura</option>
                      <option>Rapport</option>
                      <option>Kontrakt</option>
                    </select>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tips:</strong> Prøv spørsmål som "Finn alle fakturaer over 50,000 kr" 
                  eller "Vis meg dokumenter fra siste måned som trenger gjennomgang"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartDocumentOverview;