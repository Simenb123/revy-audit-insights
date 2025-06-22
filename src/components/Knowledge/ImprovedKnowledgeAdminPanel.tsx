
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, FolderTree, Tags, Sparkles, Database, FileText, Users, ListChecks } from 'lucide-react';
import ImprovedCategoryManager from './ImprovedCategoryManager';
import OptimalCategoryStructure from './OptimalCategoryStructure';
import { useUnifiedTags } from '@/hooks/knowledge/useUnifiedTags';
import ContentTypeManager from './ContentTypeManager';
import SubjectAreaManager from './SubjectAreaManager';
import ImprovedCreateActionTemplateForm from '../AuditActions/ImprovedCreateActionTemplateForm';

const ImprovedKnowledgeAdminPanel = () => {
  const { data: tags = [] } = useUnifiedTags();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forbedret kunnskapsbase administrasjon</h1>
          <p className="text-muted-foreground">
            Enhetlig administrasjon av kategorier, tags, emneområder og revisjonshandlinger
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Admin v2.0
        </Badge>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Kategorier
          </TabsTrigger>
          <TabsTrigger value="audit-actions" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Handlinger
          </TabsTrigger>
          <TabsTrigger value="content-types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Typer
          </TabsTrigger>
          <TabsTrigger value="subject-areas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Emner
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Struktur
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Analyse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategori administrasjon med hierarki</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Administrer hovedkategorier og underkategorier. Flytt artikler mellom kategorier 
                og oppretthold hierarkisk struktur for optimal organisering.
              </p>
            </CardContent>
          </Card>
          <ImprovedCategoryManager />
        </TabsContent>

        <TabsContent value="audit-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revisjonshandlinger med forbedret feilhåndtering</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Opprett og administrer revisjonshandlinger med forbedret validering og feilhåndtering.
                Alle feltvalideringer og enum-verdier er nøye kontrollert.
              </p>
            </CardContent>
          </Card>
          <ImprovedCreateActionTemplateForm />
        </TabsContent>

        <TabsContent value="content-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Innholdstype administrasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Administrer innholdstyper som artikkel, lov, standard, forskrift, forarbeid, dom og revisjonshandlinger.
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

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enhetlig tag-system administrasjon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Standardiser og administrer tags for konsistent bruk på tvers av artikler og 
                revisjonshandlinger. Tags opprettet her er tilgjengelige overalt i systemet.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {tags.slice(0, 12).map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    {tag.display_name} ({tag.usage_count || 0})
                  </Badge>
                ))}
              </div>
              {tags.length > 12 && (
                <p className="text-sm text-muted-foreground mt-2">
                  ...og {tags.length - 12} flere tags
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <OptimalCategoryStructure />
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
              <span className="text-sm">Revisjonshandlinger</span>
              <Badge variant="outline">67</Badge>
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
          <CardTitle className="text-lg">Kategori-hierarki</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Hovedkategorier</span>
              <Badge variant="outline">8</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Underkategorier</span>
              <Badge variant="outline">24</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tomme kategorier</span>
              <Badge variant="destructive">3</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ukategoriserte</span>
              <Badge variant="secondary">12</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tag-konsistens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Aktive tags</span>
              <Badge variant="default">156</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ubrukte tags</span>
              <Badge variant="secondary">23</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Duplikat-tags</span>
              <Badge variant="destructive">0</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tag-relasjoner</span>
              <Badge variant="default">98%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovedKnowledgeAdminPanel;
