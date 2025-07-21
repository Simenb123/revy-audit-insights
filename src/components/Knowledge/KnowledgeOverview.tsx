
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Upload, Settings, BookOpen, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { KnowledgeCategory, ContentType, SubjectArea } from '@/types/knowledge';
import { useContentTypes } from '@/hooks/knowledge/useContentTypes';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';
import KnowledgeLayout from './KnowledgeLayout';
import KnowledgeFilterBar from './KnowledgeFilterBar';
import KnowledgeArticleCard from './KnowledgeArticleCard';
import { useFavoriteArticles } from '@/hooks/knowledge/useFavoriteArticles';

const KnowledgeOverview = () => {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedContentType, setSelectedContentType] = useState<string>();
  const [selectedSubjectAreas, setSelectedSubjectAreas] = useState<string[]>([]);

  const { data: categories = [] } = useQuery({
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

  const { data: contentTypes = [] } = useContentTypes();
  const { data: subjectAreas = [] } = useSubjectAreas();

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['knowledge-articles', searchQuery, selectedCategory, selectedContentType, selectedSubjectAreas],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:knowledge_categories(id, name),
          content_type_entity:content_types(id, name, display_name, color),
          article_subject_areas(subject_area_id),
          article_tags:knowledge_article_tags(
            tag:tags(id, name, display_name, color)
          )
        `)
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedContentType) {
        query = query.eq('content_type_id', selectedContentType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform the article_tags to match the expected structure
      const transformedData = data.map(article => ({
        ...article,
        article_tags: article.article_tags?.map((tagRel: any) => tagRel.tag) || []
      }));

      // Filter by subject areas if any are selected
      if (selectedSubjectAreas.length > 0) {
        return transformedData.filter(article => 
          article.article_subject_areas?.some(asa => 
            selectedSubjectAreas.includes(asa.subject_area_id)
          )
        );
      }

      return transformedData;
    },
  });

  const { toggleFavorite, isFavorite } = useFavoriteArticles();

  const { data: stats } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: async () => {
      const [articlesResult, categoriesResult, usersResult] = await Promise.all([
        supabase.from('knowledge_articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('knowledge_categories').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalArticles: articlesResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        totalUsers: usersResult.count || 0
      };
    },
  });

  const handleSubjectAreaToggle = (subjectAreaId: string) => {
    setSelectedSubjectAreas(prev => 
      prev.includes(subjectAreaId) 
        ? prev.filter(id => id !== subjectAreaId)
        : [...prev, subjectAreaId]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(undefined);
    setSelectedContentType(undefined);
    setSelectedSubjectAreas([]);
  };

  const actions = (
    <>
      <Link to="/fag/ny-artikkel">
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ny artikkel
        </Button>
      </Link>
      <Link to="/fag/upload">
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Last opp PDF
        </Button>
      </Link>
      <Link to="/fag/admin">
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </Link>
    </>
  );

  const filters = (
    <KnowledgeFilterBar
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      selectedContentType={selectedContentType}
      onContentTypeChange={setSelectedContentType}
      selectedSubjectAreas={selectedSubjectAreas}
      onSubjectAreaToggle={handleSubjectAreaToggle}
      categories={categories}
      contentTypes={contentTypes}
      subjectAreas={subjectAreas}
      onClearFilters={handleClearFilters}
    />
  );

  return (
    <KnowledgeLayout
      title="Fagstoff"
      actions={actions}
      filters={filters}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt artikler</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalArticles || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategorier</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCategories || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brukere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link to="/fag/mine">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Mine artikler</h3>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/fag/favoritter">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Favoritter</h3>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/fag/upload">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Last opp PDF</h3>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/fag/admin">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Administrasjon</h3>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {searchQuery ? `Søkeresultater (${articles.length})` : `Alle artikler (${articles.length})`}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Ingen artikler funnet</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Prøv et annet søk eller juster filtrene.' : 'Begynn å legge til fagartikler for å bygge opp kunnskapsbasen.'}
              </p>
              <Link to="/fag/ny-artikkel">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Opprett første artikkel
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <KnowledgeArticleCard
                key={article.id}
                article={article}
                onToggleFavorite={toggleFavorite}
                isFavorite={isFavorite(article.id)}
              />
            ))}
          </div>
        )}
      </div>
    </KnowledgeLayout>
  );
};

export default KnowledgeOverview;
