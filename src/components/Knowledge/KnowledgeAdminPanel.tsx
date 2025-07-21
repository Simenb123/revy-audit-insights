
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  Database,
  TestTube,
  BarChart3,
  Wrench,
  FolderTree,
  Tags,
  Sparkles,
  FileText,
  Users,
  ListChecks,
  Trash2,
  Edit3,
  TreePine,
  Brain
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUnifiedTags } from '@/hooks/knowledge/useUnifiedTags';
import CategoryManager from './CategoryManager';
import ImprovedCategoryManager from './ImprovedCategoryManager';
import ContentTypeManager from './ContentTypeManager';
import SearchTestingPanel from './SearchTestingPanel';
import KnowledgeMonitor from '../AIRevyAdmin/KnowledgeMonitor';
import SubjectAreaManager from './SubjectAreaManager';
import OptimalCategoryStructure from './OptimalCategoryStructure';
import ImprovedCreateActionTemplateForm from '../AuditActions/ImprovedCreateActionTemplateForm';
import { DataCleanupManager } from './DataCleanupManager';
import { BulkEditManager } from './BulkEditManager';
import { UnifiedCategoryManager } from './UnifiedCategoryManager';
import { AIRevyIntegrationPanel } from './AIRevyIntegrationPanel';

interface KnowledgeAdminPanelProps {
  /** Enable additional administrative functionality */
  showAdvanced?: boolean;
}

const KnowledgeAdminPanel = ({ showAdvanced = false }: KnowledgeAdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: tags = [] } = useUnifiedTags();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base Administration</h1>
          <p className="text-muted-foreground">
            Manage articles, categories, and search functionality
          </p>
        </div>
        {showAdvanced && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            Admin v2.0
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full grid-cols-${showAdvanced ? '9' : '9'}`}>
          <TabsTrigger value="overview">
            <Settings className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="monitor">
            <Database className="w-4 h-4 mr-2" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="cleanup">
            <Trash2 className="w-4 h-4 mr-2" />
            Opprydding
          </TabsTrigger>
          <TabsTrigger value="bulk-edit">
            <Edit3 className="w-4 h-4 mr-2" />
            Bulk-edit
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
          <TabsTrigger value="unified-categories">
            <TreePine className="w-4 h-4 mr-2" />
            Nye kategorier
          </TabsTrigger>
          <TabsTrigger value="ai-integration">
            <Brain className="w-4 h-4 mr-2" />
            AI-Integrasjon
          </TabsTrigger>
          {showAdvanced && (
            <>
              <TabsTrigger value="audit-actions" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Actions
              </TabsTrigger>
              <TabsTrigger value="subject-areas" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Subjects
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Tags
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Structure
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Analysis
              </TabsTrigger>
            </>
          )}
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

        <TabsContent value="cleanup">
          <DataCleanupManager />
        </TabsContent>

        <TabsContent value="bulk-edit">
          <BulkEditManager />
        </TabsContent>

        <TabsContent value="testing">
          <SearchTestingPanel />
        </TabsContent>

        <TabsContent value="categories">
          {showAdvanced ? <ImprovedCategoryManager /> : <CategoryManager />}
        </TabsContent>

        <TabsContent value="content-types">
          <ContentTypeManager />
        </TabsContent>

        <TabsContent value="unified-categories">
          <UnifiedCategoryManager />
        </TabsContent>

        <TabsContent value="ai-integration">
          <AIRevyIntegrationPanel />
        </TabsContent>
        {showAdvanced && (
          <>
            <TabsContent value="audit-actions" className="space-y-4">
              <ImprovedCreateActionTemplateForm />
            </TabsContent>
            <TabsContent value="subject-areas" className="space-y-4">
              <SubjectAreaManager />
            </TabsContent>
            <TabsContent value="tags" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Unified Tags</CardTitle>
                </CardHeader>
                <CardContent>
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
          </>
        )}
      </Tabs>
    </div>
  );
}; 

const AnalysisPanel = () => (
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

export default KnowledgeAdminPanel;
