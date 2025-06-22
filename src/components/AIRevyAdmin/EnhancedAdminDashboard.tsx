
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
  Shield
} from 'lucide-react';
import PromptEditor from './PromptEditor';
import KnowledgeMonitor from './KnowledgeMonitor';
import UsageAnalytics from './UsageAnalytics';
import TestInterface from './TestInterface';
import CategoryStructureManager from './CategoryStructureManager';
import DocumentTypeManager from './DocumentTypeManager';
import SubjectAreaManager from './SubjectAreaManager';
import AuditActionGenerator from './AuditActionGenerator';
import TagManager from './TagManager';
import DatabaseTools from './DatabaseTools';
import WorkflowManager from './WorkflowManager';

const EnhancedAdminDashboard = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI-Revi Administrator</h1>
          <p className="text-muted-foreground">
            Komplett administrasjon av AI-Revi system, database og struktur
          </p>
        </div>
        <Badge variant="outline" className="ml-auto">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      </div>

      <Tabs defaultValue="prompts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Kategorier
          </TabsTrigger>
          <TabsTrigger value="subject-areas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Emner
          </TabsTrigger>
          <TabsTrigger value="document-types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumenttyper
          </TabsTrigger>
          <TabsTrigger value="audit-actions" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Handlinger
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Arbeidsflyt
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analyser
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="categories">
          <CategoryStructureManager />
        </TabsContent>

        <TabsContent value="subject-areas">
          <SubjectAreaManager />
        </TabsContent>

        <TabsContent value="document-types">
          <DocumentTypeManager />
        </TabsContent>

        <TabsContent value="audit-actions">
          <AuditActionGenerator />
        </TabsContent>

        <TabsContent value="tags">
          <TagManager />
        </TabsContent>

        <TabsContent value="workflow">
          <WorkflowManager />
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
      </Tabs>
    </div>
  );
};

export default EnhancedAdminDashboard;
