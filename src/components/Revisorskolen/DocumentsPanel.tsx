import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, ExternalLink, Calendar, Tag } from 'lucide-react';
import { useTrainingContext } from '@/hooks/useTrainingContext';

interface DocumentsPanelProps {
  sessionId: string;
}

export const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ sessionId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: context, isLoading } = useTrainingContext(sessionId);

  const filteredLibrary = context?.library?.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.reference_code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Fagbibliotek</h2>
          <p className="text-sm text-muted-foreground">
            Kurerte fagartikler for denne sesjonen
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk i fagbiblioteket..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Library Content */}
      <div className="space-y-4">
        {context?.library?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Ingen dokumenter tilgjengelig</h3>
              <p className="text-sm text-muted-foreground">
                Fagbiblioteket for denne sesjonen er ikke satt opp ennå.
              </p>
            </CardContent>
          </Card>
        ) : filteredLibrary.length === 0 && searchQuery ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Ingen resultater</h3>
              <p className="text-sm text-muted-foreground">
                Prøv et annet søkeord eller fjern søkefilteret.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLibrary.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {article.title}
                    </CardTitle>
                    {article.reference_code && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {article.reference_code}
                        </Badge>
                        {article.collection_name && (
                          <Badge variant="outline" className="text-xs">
                            {article.collection_name}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="text-sm mb-4">
                  {article.summary || 'Ingen sammendrag tilgjengelig.'}
                </CardDescription>
                
                {/* Article metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {article.knowledge_categories && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>{article.knowledge_categories.name}</span>
                    </div>
                  )}
                  
                  {(article.valid_from || article.valid_until) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {article.valid_from && `Fra ${new Date(article.valid_from).toLocaleDateString('nb-NO')}`}
                        {article.valid_from && article.valid_until && ' - '}
                        {article.valid_until && `til ${new Date(article.valid_until).toLocaleDateString('nb-NO')}`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {context?.library && context.library.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Viser {filteredLibrary.length} av {context.library.length} artikler
              </span>
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchQuery('')}
                  className="text-xs"
                >
                  Fjern filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};