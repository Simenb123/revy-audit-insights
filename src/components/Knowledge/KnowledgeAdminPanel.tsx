
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, FileText, Upload } from 'lucide-react';
import TestDataCreator from './TestDataCreator';
import CategoryManager from './CategoryManager';
import PDFUploadManager from './PDFUploadManager';
import KnowledgeStatusIndicator from '@/components/Revy/KnowledgeStatusIndicator';

const KnowledgeAdminPanel = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Kunnskapsbase - Admin</h1>
          <p className="text-muted-foreground">Administrer fagartikler og AI-Revi innstillinger</p>
        </div>
      </div>

      <KnowledgeStatusIndicator />

      <Tabs defaultValue="testdata" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="testdata" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Testdata
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Kategorier
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Last opp PDF
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Innstillinger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="testdata" className="space-y-4">
          <TestDataCreator />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kategoristyring</CardTitle>
              <CardDescription>Administrer kategorier for fagartikler</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PDF Upload</CardTitle>
              <CardDescription>Last opp PDF-er som skal konverteres til fagartikler</CardDescription>
            </CardHeader>
            <CardContent>
              <PDFUploadManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Revi Innstillinger</CardTitle>
              <CardDescription>Konfigurer AI-assistenten og søkeinnstillinger</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Innstillinger for AI-Revi vil bli tilgjengelig her.</p>
                <p className="mt-2">Kontroller at følgende miljøvariabler er satt i Supabase:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>OPENAI_API_KEY</li>
                  <li>SUPABASE_SERVICE_ROLE_KEY</li>
                  <li>SUPABASE_URL</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeAdminPanel;
