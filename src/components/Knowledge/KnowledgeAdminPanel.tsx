
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, FolderTree, Tags, Sparkles, Database, FileText, Users } from 'lucide-react';
import CategoryManager from './CategoryManager';
import OptimalCategoryStructure from './OptimalCategoryStructure';
import TagManager from './TagManager';
import ContentTypeManager from './ContentTypeManager';
import SubjectAreaManager from './SubjectAreaManager';

const KnowledgeAdminPanel = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunnskapsbase administrasjon</h1>
          <p className="text-muted-foreground">
            Administrer kategorier, innholdstyper, emneområder og struktur for optimal AI-Revy ytelse
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Admin
        </Badge>
      </div>

      <Tabs defaultValue="content-types" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="content-types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Typer
          </TabsTrigger>
          <TabsTrigger value="subject-areas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Emner
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Kategorier
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Struktur
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Analyse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Innholdstype administrasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Administrer innholdstyper som artikkel, lov, standard, forskrift, forarbeid og dom.
                Hver type kan ha egne farger og ikoner for enkel identifikasjon.
              </p>
            </CardContent>
          </Card>
          <ContentTypeManager />
        </TabsContent>

        <TabsContent value="subject-areas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emneområde administrasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Administrer emneområder som revisjon, regnskap, skatt og annet.
                Artikler kan tilhøre flere emneområder samtidig for økt fleksibilitet.
              </p>
            </CardContent>
          </Card>
          <SubjectAreaManager />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategoristruktur administrasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Administrer den hierarkiske kategoristrukturen. Dette er det gamle systemet som 
                fortsatt støttes, men vi anbefaler å bruke de nye type- og emnesystemene.
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
          <CardTitle className="text-lg">Type-statistikk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Fagartikler</span>
              <Badge variant="outline">125</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">ISA-standarder</span>
              <Badge variant="outline">45</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Lover</span>
              <Badge variant="outline">23</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emne-statistikk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Revisjon</span>
              <Badge variant="outline">89</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Regnskap</span>
              <Badge variant="outline">67</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Skatt</span>
              <Badge variant="outline">34</Badge>
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
              <span className="text-sm">Type-klassifisering</span>
              <Badge variant="default">98%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Emne-mappning</span>
              <Badge variant="default">94%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Søkeeffektivitet</span>
              <Badge variant="default">92%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeAdminPanel;
