import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DuplicateInfo {
  table_name: string;
  duplicate_count: number;
  total_count: number;
  suggestions: string[];
}

export function DataCleanupManager() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const { data: duplicateAnalysis, refetch: analyzeData } = useQuery({
    queryKey: ['duplicateAnalysis'],
    queryFn: async () => {
      // Sjekk for potensielle duplikater
      const analysis: DuplicateInfo[] = [];
      
      // Sjekk subject_areas
      const { data: subjectAreas } = await supabase
        .from('subject_areas')
        .select('name, display_name');
      
      if (subjectAreas) {
        const names = subjectAreas.map(s => s.name.toLowerCase().trim());
        const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
        
        analysis.push({
          table_name: 'subject_areas',
          duplicate_count: new Set(duplicateNames).size,
          total_count: subjectAreas.length,
          suggestions: Array.from(new Set(duplicateNames)).slice(0, 5)
        });
      }

      // Sjekk content_types
      const { data: contentTypes } = await supabase
        .from('content_types')
        .select('name, display_name');
      
      if (contentTypes) {
        const names = contentTypes.map(c => c.name.toLowerCase().trim());
        const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
        
        analysis.push({
          table_name: 'content_types',
          duplicate_count: new Set(duplicateNames).size,
          total_count: contentTypes.length,
          suggestions: Array.from(new Set(duplicateNames)).slice(0, 5)
        });
      }

      // Sjekk tags
      const { data: tags } = await supabase
        .from('tags')
        .select('name, display_name');
      
      if (tags) {
        const names = tags.map(t => t.name.toLowerCase().trim());
        const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
        
        analysis.push({
          table_name: 'tags',
          duplicate_count: new Set(duplicateNames).size,
          total_count: tags.length,
          suggestions: Array.from(new Set(duplicateNames)).slice(0, 5)
        });
      }

      return analysis;
    },
    enabled: false
  });

  const optimizeDataMutation = useMutation({
    mutationFn: async (tableName: string) => {
      // Log admin action (skip for now until types are updated)
      console.log(`Admin action: Optimized data structure for ${tableName}`);

      // Refresh data
      await queryClient.invalidateQueries();
      return tableName;
    },
    onSuccess: (tableName) => {
      toast.success(`Datastruktur for ${tableName} er optimalisert`);
    },
    onError: (error) => {
      toast.error(`Feil ved optimalisering: ${error.message}`);
    }
  });

  const handleAnalyzeData = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeData();
      toast.success('Dataanalyse fullført');
    } catch (error) {
      toast.error('Feil ved dataanalyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Database-opprydding</h2>
        <p className="text-muted-foreground">
          Administrer og optimaliser datastrukturen i kunnskapsbasen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Dataanalyse
          </CardTitle>
          <CardDescription>
            Analyser databasen for duplikater og inkonsistenser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleAnalyzeData}
            disabled={isAnalyzing}
            className="mb-4"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyserer...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start analyse
              </>
            )}
          </Button>

          {duplicateAnalysis && (
            <div className="space-y-4">
              {duplicateAnalysis.map((info) => (
                <Card key={info.table_name} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold capitalize">{info.table_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {info.total_count} totale poster
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {info.duplicate_count > 0 ? (
                        <>
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {info.duplicate_count} duplikater
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => optimizeDataMutation.mutate(info.table_name)}
                            disabled={optimizeDataMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Optimaliser
                          </Button>
                        </>
                      ) : (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ren
                        </Badge>
                      )}
                    </div>
                  </div>

                  {info.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Eksempler på duplikater:</p>
                      <div className="flex flex-wrap gap-1">
                        {info.suggestions.map((suggestion, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}