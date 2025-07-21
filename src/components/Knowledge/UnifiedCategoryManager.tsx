import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TreePine, Merge, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UnifiedCategory {
  id: string;
  name: string;
  display_name: string;
  category_type: string;
  color: string;
  risk_level: string;
  audit_phases: string[];
  isa_standard_reference: string[];
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
}

export function UnifiedCategoryManager() {
  const [selectedMerge, setSelectedMerge] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['unifiedCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_categories')
        .select('*')
        .order('category_type, sort_order');
      
      if (error) throw error;
      return data as UnifiedCategory[];
    }
  });

  const optimizeStructureMutation = useMutation({
    mutationFn: async () => {
      // Automatisk optimalisering av kategoristrukturen
      // For nå logger vi bare handlingen
      console.log('Optimizing unified categories structure');
      return true;
    },
    onSuccess: () => {
      toast.success('Kategoristruktur optimalisert');
      queryClient.invalidateQueries({ queryKey: ['unifiedCategories'] });
    },
    onError: (error) => {
      toast.error(`Feil ved optimalisering: ${error.message}`);
    }
  });

  const mergeCategoriesMutation = useMutation({
    mutationFn: async (categoryIds: string[]) => {
      // Merge valgte kategorier
      // For nå logger vi bare handlingen
      console.log('Merging categories:', categoryIds);
      return categoryIds;
    },
    onSuccess: () => {
      toast.success('Kategorier slått sammen');
      setSelectedMerge([]);
      queryClient.invalidateQueries({ queryKey: ['unifiedCategories'] });
    },
    onError: (error) => {
      toast.error(`Feil ved sammenslåing: ${error.message}`);
    }
  });

  const groupByType = (categories: UnifiedCategory[]) => {
    return categories.reduce((acc, cat) => {
      if (!acc[cat.category_type]) acc[cat.category_type] = [];
      acc[cat.category_type].push(cat);
      return acc;
    }, {} as Record<string, UnifiedCategory[]>);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'subject_area': 'Fagområder',
      'process': 'Prosesser',
      'compliance': 'Regelverk'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'subject_area': return <TreePine className="h-4 w-4" />;
      case 'process': return <Zap className="h-4 w-4" />;
      case 'compliance': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const toggleMergeSelection = (categoryId: string) => {
    setSelectedMerge(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (isLoading) {
    return <div>Laster kategorier...</div>;
  }

  const groupedCategories = groupByType(categories || []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Enhetlige kategorier</h2>
        <p className="text-muted-foreground">
          Administrer den forenklede kategoristrukturen for norsk revisjon
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={() => optimizeStructureMutation.mutate()}
          disabled={optimizeStructureMutation.isPending}
          variant="outline"
        >
          <TreePine className="h-4 w-4 mr-2" />
          Optimaliser struktur
        </Button>

        {selectedMerge.length > 1 && (
          <Button
            onClick={() => mergeCategoriesMutation.mutate(selectedMerge)}
            disabled={mergeCategoriesMutation.isPending}
            variant="destructive"
          >
            <Merge className="h-4 w-4 mr-2" />
            Slå sammen ({selectedMerge.length})
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(groupedCategories).map(([type, cats]) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getTypeIcon(type)}
                {getTypeLabel(type)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cats.length}</div>
              <p className="text-xs text-muted-foreground">
                {cats.filter(c => c.is_active).length} aktive
              </p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4" />
              Totalt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              kategorier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Groups */}
      {Object.entries(groupedCategories).map(([type, cats]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getTypeIcon(type)}
              {getTypeLabel(type)}
            </CardTitle>
            <CardDescription>
              {cats.length} kategorier i denne gruppen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cats.map((category) => (
                <div
                  key={category.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMerge.includes(category.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleMergeSelection(category.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <h4 className="font-medium text-sm">{category.display_name}</h4>
                    </div>
                    {!category.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inaktiv
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    {category.name}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {category.risk_level}
                    </Badge>
                    {category.audit_phases.map((phase) => (
                      <Badge key={phase} variant="secondary" className="text-xs">
                        {phase}
                      </Badge>
                    ))}
                  </div>

                  {category.isa_standard_reference.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      ISA: {category.isa_standard_reference.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}