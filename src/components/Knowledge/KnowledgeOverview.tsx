
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';
import { 
  Search, 
  Plus, 
  FileCheck, 
  Calculator, 
  Percent, 
  Scale, 
  ShieldCheck,
  Clock,
  Star
} from 'lucide-react';

const iconMap = {
  'file-check': FileCheck,
  'calculator': Calculator,
  'percent': Percent,
  'scale': Scale,
  'shield-check': ShieldCheck,
};

const KnowledgeOverview = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const { data: categories, isLoading } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .is('parent_category_id', null)
        .order('display_order');
      
      if (error) throw error;
      return data as KnowledgeCategory[];
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
        .order('published_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="space-y-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søk i fagartikler..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button asChild>
          <Link to="/fag/ny-artikkel">
            <Plus className="w-4 h-4 mr-2" />
            Ny artikkel
          </Link>
        </Button>
      </div>

      {/* Categories Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Fagområder</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.map((category) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap] || FileCheck;
            
            return (
              <Link key={category.id} to={`/fag/kategori/${category.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className="w-5 h-5 text-primary" />
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Articles */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Nylige artikler</h2>
        <div className="space-y-3">
          {recentArticles?.map((article) => (
            <Card key={article.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link to={`/fag/artikkel/${article.slug}`} className="block">
                      <h3 className="font-medium hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.category?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(article.published_at || article.created_at).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeOverview;
