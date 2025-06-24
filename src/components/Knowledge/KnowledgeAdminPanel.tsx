
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Database, TestTube, BarChart3, Wrench } from 'lucide-react';
import CategoryManager from './CategoryManager';
import ContentTypeManager from './ContentTypeManager';
import SearchTestingPanel from './SearchTestingPanel';
import KnowledgeMonitor from '../AIRevyAdmin/KnowledgeMonitor';

const KnowledgeAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base Administration</h1>
          <p className="text-muted-foreground">
            Manage articles, categories, and search functionality
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Settings className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="monitor">
            <Database className="w-4 h-4 mr-2" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="testing">
            <TestTube className="w-4 h-4 mr-2" />
            Search Testing
          </TabsTrigger>
          <TabsTrigger value="categories">
            <BarChart3 className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="content-types">
            <Wrench className="w-4 h-4 mr-2" />
            Content Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Access key management features quickly
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setActiveTab('testing')}
                      className="text-left text-sm hover:text-primary"
                    >
                      → Test search functionality
                    </button>
                    <button
                      onClick={() => setActiveTab('monitor')}
                      className="text-left text-sm hover:text-primary"
                    >
                      → Monitor knowledge base health
                    </button>
                    <button
                      onClick={() => setActiveTab('categories')}
                      className="text-left text-sm hover:text-primary"
                    >
                      → Manage categories
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Current system health indicators
                  </p>
                  <div className="text-sm space-y-1">
                    <div>🟢 Database: Connected</div>
                    <div>🟢 Search Function: Updated</div>
                    <div>🟡 Embeddings: Check monitor tab</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Updates</CardTitle>
                <TestTube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Latest improvements and fixes
                  </p>
                  <div className="text-sm space-y-1">
                    <div>✅ Fixed semantic search function</div>
                    <div>✅ Added search diagnostics</div>
                    <div>✅ Enhanced logging system</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitor">
          <KnowledgeMonitor />
        </TabsContent>

        <TabsContent value="testing">
          <SearchTestingPanel />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="content-types">
          <ContentTypeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeAdminPanel;
