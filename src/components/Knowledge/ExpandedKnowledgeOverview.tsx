
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';
import { 
  BookOpen, 
  Users, 
  FileCheck, 
  Scale, 
  Shield, 
  Calculator, 
  CheckSquare, 
  HelpCircle,
  Plus,
  ArrowRight,
  Upload,
  Building
} from 'lucide-react';

const ExpandedKnowledgeOverview = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['knowledge-categories-expanded'],
    queryFn: async () => {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select(`
          *,
          children:knowledge_categories!parent_category_id(*)
        `)
        .is('parent_category_id', null)
        .order('display_order');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      console.log('Categories fetched:', data);
      
      // Transform data to match TypeScript types
      return data?.map(category => ({
        ...category,
        children: Array.isArray(category.children) ? category.children : []
      })) as (KnowledgeCategory & { children?: KnowledgeCategory[] })[];
    }
  });

  const { data: recentArticles } = useQuery({
    queryKey: ['recent-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:knowledge_categories(name)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const getIconForCategory = (name: string) => {
    const iconMap: Record<string, React.ElementType> = {
      'App': BookOpen,
      'Klienter': Users,
      'Revisjon': FileCheck,
      'Jus': Scale,
      'Kvalitetssikring': Shield,
      'Regnskap': Calculator,
      'FAQ': HelpCircle,
      'Økonomi': Building
    };
    return iconMap[name] || BookOpen;
  };

  // Updated for dark theme - using darker card backgrounds
  const getColorForCategory = (name: string) => {
    const colorMap: Record<string, string> = {
      'App': 'bg-blue-900/20 border-blue-800/30 hover:bg-blue-900/30',
      'Klienter': 'bg-green-900/20 border-green-800/30 hover:bg-green-900/30',
      'Revisjon': 'bg-purple-900/20 border-purple-800/30 hover:bg-purple-900/30',
      'Jus': 'bg-red-900/20 border-red-800/30 hover:bg-red-900/30',
      'Kvalitetssikring': 'bg-yellow-900/20 border-yellow-800/30 hover:bg-yellow-900/30',
      'Regnskap': 'bg-indigo-900/20 border-indigo-800/30 hover:bg-indigo-900/30',
      'FAQ': 'bg-gray-800/20 border-gray-700/30 hover:bg-gray-800/30',
      'Økonomi': 'bg-emerald-900/20 border-emerald-800/30 hover:bg-emerald-900/30'
    };
    return colorMap[name] || 'bg-gray-800/20 border-gray-700/30 hover:bg-gray-800/30';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fagområder</h1>
            <p className="text-muted-foreground mt-1">Laster...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-card border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fagområder</h1>
            <p className="text-muted-foreground mt-1">
              Ingen kategorier funnet. Kontakt administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fagområder</h1>
          <p className="text-muted-foreground mt-1">
            Utforsk lover, standarder, prosedyrer og veiledninger for revisjon og regnskap
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/fag/pdf-konvertering">
              <Upload className="w-4 h-4 mr-2" />
              PDF-konvertering
            </Link>
          </Button>
          <Button asChild>
            <Link to="/fag/ny-artikkel">
              <Plus className="w-4 h-4 mr-2" />
              Ny artikkel
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => {
          const Icon = getIconForCategory(category.name);
          const colorClass = getColorForCategory(category.name);
          
          return (
            <Link key={category.id} to={`/fag/kategori/${category.id}`}>
              <Card className={`h-full transition-all duration-200 ${colorClass} cursor-pointer`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-base">{category.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.description}
                  </p>
                  
                  {/* Show subcategories if any */}
                  {category.children && category.children.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Områder ({category.children.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {category.children.slice(0, 3).map((child) => (
                          <Badge key={child.id} variant="outline" className="text-xs">
                            {child.name.length > 15 
                              ? child.name.substring(0, 15) + '...' 
                              : child.name
                            }
                          </Badge>
                        ))}
                        {category.children.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{category.children.length - 3} flere
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                    <span>Utforsk</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Articles */}
      {recentArticles && recentArticles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Nyeste artikler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentArticles.map((article) => (
              <Link key={article.id} to={`/fag/artikkel/${article.slug}`}>
                <Card className="hover:shadow-md transition-shadow bg-card">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-1">{article.title}</h3>
                    {article.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {article.category?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.created_at).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Hurtigtilgang</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/fag/sok?q=ISA">ISA-standarder</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/fag/sok?q=regnskapsloven">Regnskapsloven</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/fag/sok?q=NRS">NRS-standarder</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/fag/sok?q=sjekkliste">Sjekklister</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/fag/pdf-konvertering">PDF-konvertering</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpandedKnowledgeOverview;
