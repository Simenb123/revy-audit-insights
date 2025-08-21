import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Code, 
  Search, 
  ExternalLink, 
  Download,
  FileText,
  Video,
  Headphones
} from 'lucide-react';

interface DocItem {
  id: string;
  title: string;
  type: 'guide' | 'api' | 'tutorial' | 'reference';
  category: string;
  description: string;
  lastUpdated: string;
  version: string;
  downloadUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
}

const TrainingDocumentation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const docs: DocItem[] = [
    {
      id: '1',
      title: 'Kom i gang med Revisorskolen',
      type: 'guide',
      category: 'Grunnleggende',
      description: 'En komplett guide for å komme i gang med Revisorskolen-plattformen',
      lastUpdated: '2024-01-15',
      version: '2.1',
      downloadUrl: '/docs/getting-started.pdf'
    },
    {
      id: '2', 
      title: 'Training API Referanse',
      type: 'api',
      category: 'Teknisk',
      description: 'Fullstendig API dokumentasjon for integrasjon med training systemet',
      lastUpdated: '2024-01-10',
      version: '1.3',
      downloadUrl: '/docs/api-reference.pdf'
    },
    {
      id: '3',
      title: 'Opprette Egne Case',
      type: 'tutorial',
      category: 'Avansert',
      description: 'Steg-for-steg tutorial for å opprette og tilpasse egne training cases',
      lastUpdated: '2024-01-08',
      version: '1.0',
      videoUrl: '/videos/create-cases.mp4'
    },
    {
      id: '4',
      title: 'Audit Workflows',
      type: 'guide',
      category: 'Praktisk',
      description: 'Detaljert guide til å sette opp og følge audit workflows',
      lastUpdated: '2024-01-05',
      version: '2.0',
      audioUrl: '/audio/audit-workflows.mp3'
    },
    {
      id: '5',
      title: 'Integrasjon med Eksisterende Systemer',
      type: 'reference',
      category: 'Teknisk',
      description: 'Referanseguide for integrering med eksisterende revisjonssystemer',
      lastUpdated: '2024-01-03',
      version: '1.2',
      downloadUrl: '/docs/integration-guide.pdf'
    }
  ];

  const categories = ['all', ...new Set(docs.map(doc => doc.category))];

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: DocItem['type']) => {
    switch (type) {
      case 'guide': return <BookOpen className="h-4 w-4" />;
      case 'api': return <Code className="h-4 w-4" />;
      case 'tutorial': return <Video className="h-4 w-4" />;
      case 'reference': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: DocItem['type']) => {
    switch (type) {
      case 'guide': return 'bg-blue-500';
      case 'api': return 'bg-green-500';
      case 'tutorial': return 'bg-purple-500';
      case 'reference': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Dokumentasjon</h2>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Last ned alle
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i dokumentasjon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'Alle' : category}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="categories">Kategorier</TabsTrigger>
          <TabsTrigger value="recent">Nylig oppdatert</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="grid gap-4">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(doc.type)} text-white`}>
                      {getTypeIcon(doc.type)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{doc.category}</Badge>
                        <Badge variant="outline">v{doc.version}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Oppdatert: {new Date(doc.lastUpdated).toLocaleDateString('nb-NO')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.downloadUrl && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    )}
                    {doc.videoUrl && (
                      <Button size="sm" variant="outline">
                        <Video className="h-4 w-4 mr-1" />
                        Video
                      </Button>
                    )}
                    {doc.audioUrl && (
                      <Button size="sm" variant="outline">
                        <Headphones className="h-4 w-4 mr-1" />
                        Audio
                      </Button>
                    )}
                    <Button size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Åpne
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.filter(cat => cat !== 'all').map((category) => {
              const categoryDocs = docs.filter(doc => doc.category === category);
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {categoryDocs.length} dokumenter
                    </p>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {categoryDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                            {getTypeIcon(doc.type)}
                            <span className="text-sm flex-1">{doc.title}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="grid gap-4">
            {docs
              .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
              .slice(0, 5)
              .map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(doc.type)} text-white`}>
                        {getTypeIcon(doc.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Oppdatert: {new Date(doc.lastUpdated).toLocaleDateString('nb-NO')}
                        </p>
                      </div>
                    </div>
                    <Button size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Åpne
                    </Button>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingDocumentation;