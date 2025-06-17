
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, FolderTree, Tags, Sparkles, Database } from 'lucide-react';
import CategoryManager from './CategoryManager';
import OptimalCategoryStructure from './OptimalCategoryStructure';
import TagManager from './TagManager';

const KnowledgeAdminPanel = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunnskapsbase administrasjon</h1>
          <p className="text-muted-foreground">
            Administrer kategorier, tags og struktur for optimal AI-Revy ytelse
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Admin
        </Badge>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Kategorier
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Optimal struktur
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Tag-administrasjon
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Analyse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategoristruktur administrasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Administrer kategorier, flytt artikler og organisér hierarkiet for bedre AI-Revy ytelse.
              </p>
            </CardContent>
          </Card>
          <CategoryManager />
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <OptimalCategoryStructure />
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tag-system administrasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Standardiser og administrer tags for konsistent AI-Revy søk og anbefalinger.
              </p>
            </CardContent>
          </Card>
          <TagManager />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <AnalysisPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AnalysisPanel = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kategori-problemer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Kategorier uten artikler</span>
              <Badge variant="outline">3</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">For dype hierarkier (>3 nivåer)</span>
              <Badge variant="outline">2</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Duplikate kategorinavn</span>
              <Badge variant="destructive">1</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tag-kvalitet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Inkonsistente ISA-tags</span>
              <Badge variant="destructive">5</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Artikler uten tags</span>
              <Badge variant="outline">8</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ubrukte tags</span>
              <Badge variant="outline">12</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI-Revy optimalisering</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Embeddings mangler</span>
              <Badge variant="outline">0</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Søkeeffektivitet</span>
              <Badge variant="default">85%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tag-mapping dekkning</span>
              <Badge variant="default">92%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeAdminPanel;
