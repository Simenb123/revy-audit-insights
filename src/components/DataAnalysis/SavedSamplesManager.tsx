import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Eye, Calendar, User, Target, BarChart3, FileText, RefreshCw } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface SavedSample {
  id: string;
  plan_name: string;
  sampling_method: string;
  population_size: number;
  population_sum: number;
  sample_size: number;
  confidence_level: number;
  fiscal_year: number;
  selected_standard_numbers: string[];
  excluded_account_numbers: string[];
  created_at: string;
  created_by: string;
  metadata: any;
}

interface SavedSamplesManagerProps {
  clientId: string;
  onViewSample?: (sample: SavedSample) => void;
}

const SavedSamplesManager: React.FC<SavedSamplesManagerProps> = ({ 
  clientId, 
  onViewSample 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedFiscalYear } = useFiscalYear();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch saved samples
  const { data: savedSamples, isLoading, error } = useQuery({
    queryKey: ['saved-samples', clientId, selectedFiscalYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_sampling_plans')
        .select('*')
        .eq('client_id', clientId)
        .eq('fiscal_year', selectedFiscalYear)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedSample[];
    },
    enabled: !!clientId && !!selectedFiscalYear,
    staleTime: 30 * 1000, // 30 seconds
  });

  const deleteSample = async (sampleId: string) => {
    setDeletingId(sampleId);
    try {
      const { error } = await supabase
        .from('audit_sampling_plans')
        .delete()
        .eq('id', sampleId);

      if (error) throw error;

      // Also delete associated sampling items
      await supabase
        .from('audit_sampling_items')
        .delete()
        .eq('sampling_plan_id', sampleId);

      toast({
        title: "Utvalg slettet",
        description: "Utvalgsplanen er permanent slettet"
      });

      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['saved-samples', clientId, selectedFiscalYear] });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Feil ved sletting",
        description: error.message || "Kunne ikke slette utvalg",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'systematic_random': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'monetary_unit': return 'bg-green-100 text-green-800 border-green-200';
      case 'stratified': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'simple_random': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMethodDisplayName = (method: string) => {
    switch (method) {
      case 'systematic_random': return 'SRS';
      case 'monetary_unit': return 'MUS';
      case 'stratified': return 'Stratifisert';
      case 'simple_random': return 'Tilfeldig';
      default: return method.toUpperCase();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          Laster lagrede utvalg...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          <FileText className="h-4 w-4 mr-2" />
          Kunne ikke laste lagrede utvalg
        </CardContent>
      </Card>
    );
  }

  if (!savedSamples || savedSamples.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Lagrede utvalg
          </CardTitle>
          <CardDescription>
            Ingen lagrede utvalg for {selectedFiscalYear}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Generer og lagre ditt første utvalg for å se det her</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Lagrede utvalg
          <Badge variant="secondary" className="ml-2">
            {savedSamples.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Utvalg lagret for {selectedFiscalYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {savedSamples.map((sample) => (
              <div
                key={sample.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{sample.plan_name}</h4>
                      <Badge 
                        variant="outline" 
                        className={getMethodBadgeColor(sample.sampling_method)}
                      >
                        {getMethodDisplayName(sample.sampling_method)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>{sample.sample_size} elementer</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        <span>{sample.population_size} populasjon</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(sample.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{sample.confidence_level}% konfidens</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Populasjonssum: {formatCurrency(sample.population_sum)}</span>
                      {sample.selected_standard_numbers?.length > 0 && (
                        <span>Regnskapslinjer: {sample.selected_standard_numbers.join(', ')}</span>
                      )}
                      {sample.excluded_account_numbers?.length > 0 && (
                        <span className="text-red-600">
                          {sample.excluded_account_numbers.length} ekskluderte kontoer
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {onViewSample && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewSample(sample)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Vis
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingId === sample.id}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Slett utvalg</AlertDialogTitle>
                          <AlertDialogDescription>
                            Er du sikker på at du vil slette utvalget "{sample.plan_name}"? 
                            Denne handlingen kan ikke angres.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSample(sample.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Slett permanent
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SavedSamplesManager;