
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory, KnowledgeArticle } from '@/types/knowledge';
import { 
  BookOpen, 
  Plus, 
  Search, 
  TrendingUp, 
  Clock, 
  Eye, 
  Settings,
  Sparkles,
  Heart
} from 'lucide-react';

const KnowledgeOverview = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as KnowledgeCategory[];
    },
  });

  const { data: recentArticles, isLoading: articlesLoading } = useQuery({
    queryKey: ['recent-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*, category:knowledge_categories(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as KnowledgeArticle[];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kunnskapsbase</h1>
          <p className="text-muted-foreground">
            Utforsk fagartikler, ISA-standarder og revisjonsguidance
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/fag/admin">
              <Settings className="w-4 h-4 mr-2" />
              Administrer
            </Link>
          </Button>
          <Button asChild>
            <Link to="/fag/ny">
              <Plus className="w-4 h-4 mr-2" />
              Ny artikkel
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fag/ny')}>
          <CardContent className="p-6 text-center">
            <Plus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold">Opprett ny artikkel</h3>
            <p className="text-sm text-muted-foreground">Skriv ny fagartikkel</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fag/mine')}>
          <CardContent className="p-6 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold">Mine artikler</h3>
            <p className="text-sm text-muted-foreground">Se dine artikler</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fag/favoritter')}>
          <CardContent className="p-6 text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <h3 className="font-semibold">Favoritter</h3>
            <p className="text-sm text-muted-foreground">Lagrede artikler</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fag/sok')}>
          <CardContent className="p-6 text-center">
            <Search className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold">Søk</h3>
            <p className="text-sm text-muted-foreground">Finn fagstoff</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Kategorier</h2>
        {categoriesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories?.map((category) => (
              <Card 
                key={category.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/fag/kategori/${category.id}`)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Articles */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Nylige artikler</h2>
        {articlesLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {recentArticles?.map((article) => (
              <Card 
                key={article.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/fag/artikkel/${article.slug}`)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{article.title}</h3>
                      {article.summary && (
                        <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{article.category?.name}</span>
                        <span>•</span>
                        <span>{new Date(article.created_at).toLocaleDateString('nb-NO')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* AI-Revy Integration Notice */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">AI-Revy integrering</h3>
              <p className="text-sm text-blue-700">
                Alle artikler er optimalisert for AI-Revy søk og anbefalinger. 
                Bruk <Link to="/fag/admin" className="underline font-medium">administrasjonspanelet</Link> for 
                å optimalisere kategoristruktur og tags.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeOverview;
