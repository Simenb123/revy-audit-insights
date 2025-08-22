
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Brain, 
  BarChart3, 
  TestTube, 
  FolderTree, 
  Tags, 
  FileText, 
  Users, 
  ListChecks,
  Database,
  Sparkles,
  Workflow,
  Shield,
  Hash,
  Link2
} from 'lucide-react';
import PromptEditor from './PromptEditor';
import KnowledgeMonitor from './KnowledgeMonitor';
import UsageAnalytics from './UsageAnalytics';
import TestInterface from './TestInterface';
import CategoryAdmin from './CategoryAdmin';
import DocumentTypeManager from './DocumentTypeManager';
import AuditActionGenerator from './AuditActionGenerator';
import DatabaseTools from './DatabaseTools';
import WorkflowManager from './WorkflowManager';
import TagManager from './TagManager';
import EnhancedContentTypeManager from './EnhancedContentTypeManager';
import EnhancedSubjectAreaManager from './EnhancedSubjectAreaManager';
import { SubjectAreaManager } from '../Admin/SubjectAreaManager';
import ColumnMappingAdmin from '@/components/DataUpload/ColumnMappingAdmin';

const EnhancedAdminDashboard = () => {
  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Revi Administrator</h1>
          <p className="text-muted-foreground">
            Komplett administrasjon av AI Revi system, database og struktur
          </p>
        </div>
        <Badge variant="outline" className="ml-auto">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      </div>

      <Tabs defaultValue="subject-areas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="subject-areas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Emner
          </TabsTrigger>
          <TabsTrigger value="content-types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Typer
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="document-types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dok.typer
          </TabsTrigger>
          <TabsTrigger value="audit-actions" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Handlinger
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Kategorier
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analyser
          </TabsTrigger>
          <TabsTrigger value="column-mapping" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Mapping
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subject-areas">
          <Card>
            <CardHeader>
              <CardTitle>Emneområde Administrasjon</CardTitle>
              <CardDescription>
                Hovedkobling for alt innhold - emneområder kobler sammen artikler, handlinger og dokumenter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubjectAreaManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-types">
          <Card>
            <CardHeader>
              <CardTitle>Innholdstype Administrasjon</CardTitle>
              <CardDescription>
                Administrer innholdstyper som fagartikkel, ISA-standard, lov, forskrift osv.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedContentTypeManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Tag System Administrasjon</CardTitle>
              <CardDescription>
                Sentralisert tag-system for strukturert klassifisering på tvers av alle innholdstyper
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagManager />
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="document-types">
          <DocumentTypeManager />
        </TabsContent>

        <TabsContent value="audit-actions">
          <AuditActionGenerator />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryAdmin />
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardHeader>
              <CardTitle>AI Prompt Administrasjon</CardTitle>
              <CardDescription>
                Administrer AI-prompts for ulike kontekster og situasjoner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromptEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <DatabaseTools />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>System Analyser</CardTitle>
              <CardDescription>
                Bruksstatistikk og systemytelse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="column-mapping">
          <Card>
            <CardHeader>
              <CardTitle>Kolonne-mapping Administrasjon</CardTitle>
              <CardDescription>
                Administrer feltdefinisjoner og aliaser for dataopplasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColumnMappingAdmin />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAdminDashboard;
