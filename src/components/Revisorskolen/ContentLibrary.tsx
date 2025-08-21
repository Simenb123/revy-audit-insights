import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, BookOpen, Video, FileText, Download, Star, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'document' | 'quiz';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  views: number;
  duration_minutes: number;
  created_at: string;
  tags: string[];
}

export const ContentLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const queryClient = useQueryClient();

  // Reuse existing query patterns
  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ['training-content', searchTerm, selectedCategory, selectedDifficulty],
    queryFn: async () => {
      // Simulate API call - would integrate with actual content management
      return [
        {
          id: '1',
          title: 'ISA 315 - Identifisering og vurdering av risiko',
          description: 'Omfattende guide til risikovurdering i revisjonsoppdraget',
          type: 'article' as const,
          category: 'ISA Standards',
          difficulty: 'intermediate' as const,
          rating: 4.5,
          views: 1234,
          duration_minutes: 45,
          created_at: '2024-01-15',
          tags: ['ISA', 'risiko', 'planlegging']
        },
        {
          id: '2',
          title: 'Praktisk gjennomgang av vesentlighetsberegning',
          description: 'Video som viser steg-for-steg beregning av vesentlighet',
          type: 'video' as const,
          category: 'Practical Skills',
          difficulty: 'beginner' as const,
          rating: 4.8,
          views: 856,
          duration_minutes: 30,
          created_at: '2024-01-20',
          tags: ['vesentlighet', 'beregning', 'praktisk']
        }
      ] as ContentItem[];
    }
  });

  // Reuse existing mutation patterns for tracking views
  const viewContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      // Simulate view tracking - would integrate with actual analytics
      await new Promise(resolve => setTimeout(resolve, 100));
      return { contentId, viewed: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-content'] });
    }
  });

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Innholdsbibliotek
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Reuse existing search and filter patterns */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Søk i innhold..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Alle kategorier</option>
              <option value="ISA Standards">ISA Standarder</option>
              <option value="Practical Skills">Praktiske ferdigheter</option>
              <option value="Ethics">Etikk</option>
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Alle nivåer</option>
              <option value="beginner">Nybegynner</option>
              <option value="intermediate">Viderekommen</option>
              <option value="advanced">Avansert</option>
            </select>
          </div>

          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">Rutenett</TabsTrigger>
              <TabsTrigger value="list">Liste</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getContentIcon(item.type)}
                          <span className="text-sm font-medium">{item.type}</span>
                        </div>
                        <Badge className={getDifficultyColor(item.difficulty)}>
                          {item.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          {item.rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {item.views}
                        </div>
                        <span>{item.duration_minutes} min</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={() => {
                          viewContentMutation.mutate(item.id);
                          toast.success('Innhold åpnet');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Åpne innhold
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredContent.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {getContentIcon(item.type)}
                          <div className="flex-1">
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-current text-yellow-400" />
                                {item.rating}
                              </span>
                              <span>{item.views} visninger</span>
                              <span>{item.duration_minutes} min</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getDifficultyColor(item.difficulty)}>
                            {item.difficulty}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              viewContentMutation.mutate(item.id);
                              toast.success('Innhold åpnet');
                            }}
                          >
                            Åpne
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};