import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, Settings, Users, BarChart3, Shield, Database, LayoutGrid, Sparkles, Grip, FileText, GitCompare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EnhancedDashboardGrid } from './EnhancedDashboardGrid';
import { DragDropWidgetManager } from './DragDropWidgetManager';
import { DashboardConfigManager } from './DashboardConfigManager';
import { SmartLayoutManager } from './SmartLayoutManager';
import { ReportTemplateManager } from '../Templates/ReportTemplateManager';
import { CrossCheckWidget } from '../Widgets/CrossCheckWidget';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Revio Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Administrer widgets, konfigurasjoner, rapportmaler og systemfunksjoner
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Oversikt
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="smart" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Smart Layout
            </TabsTrigger>
            <TabsTrigger value="widgets" className="flex items-center gap-2">
              <Grip className="h-4 w-4" />
              Widget Manager
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Maler
            </TabsTrigger>
            <TabsTrigger value="crosscheck" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              CrossCheck
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Konfigurasjoner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link to="/ai-revy-admin">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      AI Revi Admin
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Administrer prompts og overvåk AI-bruk
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/user-admin">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Brukeradministrasjon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Administrer brukere og tilganger
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/ai-usage">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      AI-analyser
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Se AI-bruk og kostnader
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/fag">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-500" />
                      Kunnskapsbase
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Administrer fagartikler og innhold
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/organization/settings">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4 text-orange-500" />
                      Systeminnstillinger
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Konfigurer systemet
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/audit-logs">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      Revisjonslogger
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Overvåk systemaktivitet
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Enhanced Dashboard Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Systemsøversikt
                  <Badge variant="secondary">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedDashboardGrid />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Hovedoversikt
                  <Badge variant="secondary">Forbedret</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedDashboardGrid />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="smart" className="space-y-6">
            <SmartLayoutManager />
          </TabsContent>

          <TabsContent value="widgets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grip className="h-5 w-5" />
                  Drag & Drop Widget Manager
                  <Badge variant="secondary">Avansert</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DragDropWidgetManager enableCrossSectionDrag={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rapportmaler
                  <Badge variant="secondary">Smart</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTemplateManager onApplyTemplate={() => {}} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crosscheck" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  CrossCheck Datavalidering
                  <Badge variant="secondary">Intelligent</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CrossCheckWidget 
                  data={[]} 
                  dataSourceId="admin-crosscheck"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <DashboardConfigManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
