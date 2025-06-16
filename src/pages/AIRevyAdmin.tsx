
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PromptEditor from '@/components/AIRevyAdmin/PromptEditor';
import KnowledgeMonitor from '@/components/AIRevyAdmin/KnowledgeMonitor';
import UsageAnalytics from '@/components/AIRevyAdmin/UsageAnalytics';
import TestInterface from '@/components/AIRevyAdmin/TestInterface';
import { Settings, Brain, BarChart3, TestTube } from 'lucide-react';

const AIRevyAdmin = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI-Revy Administrator</h1>
          <p className="text-muted-foreground">
            Administrer prompts, overvåk kunnskapsbase og analyser bruk
          </p>
        </div>
      </div>

      <Tabs defaultValue="prompts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Kunnskapsbase
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analyser
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts">
          <PromptEditor />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeMonitor />
        </TabsContent>

        <TabsContent value="analytics">
          <UsageAnalytics />
        </TabsContent>

        <TabsContent value="test">
          <TestInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIRevyAdmin;
