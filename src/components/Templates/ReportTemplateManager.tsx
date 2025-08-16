import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Copy, 
  Edit, 
  Trash, 
  Download,
  Upload,
  Layout,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'audit' | 'financial' | 'analysis' | 'compliance' | 'custom';
  widgets: TemplateWidget[];
  layout: TemplateLayout[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    author: string;
    version: string;
    tags: string[];
  };
  isDefault?: boolean;
  complexity: 'basic' | 'intermediate' | 'advanced';
}

interface TemplateWidget {
  id: string;
  type: string;
  title: string;
  configuration: Record<string, any>;
  dataSourceType?: string;
}

interface TemplateLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widgetId: string;
}

// Predefined report templates
const defaultTemplates: ReportTemplate[] = [
  {
    id: 'basic-audit-review',
    name: 'Grunnleggende revisjonsgjennomgang',
    description: 'Standardrapport for initial gjennomgang av regnskapsdata',
    category: 'audit',
    complexity: 'basic',
    widgets: [
      {
        id: 'balance-overview',
        type: 'kpi',
        title: 'Balanseoversikt',
        configuration: {
          metrics: ['totalAssets', 'totalLiabilities', 'equity'],
          displayType: 'cards',
          showTrend: true
        }
      },
      {
        id: 'crosscheck-validation',
        type: 'crosscheck',
        title: 'Datavalidering',
        configuration: {
          rules: ['balance-check', 'duplicate-check', 'missing-accounts'],
          showSummary: true,
          autoRefresh: true
        }
      },
      {
        id: 'account-analysis',
        type: 'table',
        title: 'Kontoanalyse',
        configuration: {
          columns: ['kontonr', 'kontonavn', 'saldo', 'bevegelser'],
          sortBy: 'saldo',
          groupBy: 'kontoklasse'
        }
      }
    ],
    layout: [
      { i: 'balance-overview', x: 0, y: 0, w: 6, h: 3, widgetId: 'balance-overview' },
      { i: 'crosscheck-validation', x: 6, y: 0, w: 6, h: 3, widgetId: 'crosscheck-validation' },
      { i: 'account-analysis', x: 0, y: 3, w: 12, h: 6, widgetId: 'account-analysis' }
    ],
    metadata: {
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      author: 'System',
      version: '1.0',
      tags: ['audit', 'basic', 'standard']
    },
    isDefault: true
  },
  {
    id: 'financial-analysis',
    name: 'Finansiell analyse',
    description: 'Detaljert analyse av finansielle nøkkeltall og trender',
    category: 'financial',
    complexity: 'intermediate',
    widgets: [
      {
        id: 'key-ratios',
        type: 'kpi',
        title: 'Nøkkeltall',
        configuration: {
          metrics: ['likviditet', 'soliditet', 'loennsomhet'],
          displayType: 'gauge',
          showComparison: true
        }
      },
      {
        id: 'trend-analysis',
        type: 'chart',
        title: 'Trendanalyse',
        configuration: {
          chartType: 'line',
          metrics: ['omsetning', 'resultat', 'egenkapital'],
          period: '12months'
        }
      },
      {
        id: 'budget-variance',
        type: 'chart',
        title: 'Budsjettavvik',
        configuration: {
          chartType: 'bar',
          showVariance: true,
          groupBy: 'month'
        }
      }
    ],
    layout: [
      { i: 'key-ratios', x: 0, y: 0, w: 4, h: 4, widgetId: 'key-ratios' },
      { i: 'trend-analysis', x: 4, y: 0, w: 8, h: 4, widgetId: 'trend-analysis' },
      { i: 'budget-variance', x: 0, y: 4, w: 12, h: 5, widgetId: 'budget-variance' }
    ],
    metadata: {
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      author: 'System',
      version: '1.0',
      tags: ['financial', 'analysis', 'kpi']
    },
    isDefault: true
  },
  {
    id: 'compliance-check',
    name: 'Compliance kontroll',
    description: 'Omfattende kontroll av regnskapsføring i henhold til lover og standarder',
    category: 'compliance',
    complexity: 'advanced',
    widgets: [
      {
        id: 'regulatory-validation',
        type: 'crosscheck',
        title: 'Regelverksvalidering',
        configuration: {
          rules: ['balance-check', 'date-sequence', 'missing-accounts', 'account-structure'],
          severity: 'strict',
          showDetails: true
        }
      },
      {
        id: 'audit-trail',
        type: 'table',
        title: 'Revisjonsspor',
        configuration: {
          columns: ['dato', 'bilagsnr', 'kontonr', 'belop', 'endringer'],
          filters: ['date', 'account', 'amount'],
          exportable: true
        }
      },
      {
        id: 'exception-report',
        type: 'table',
        title: 'Avviksrapport',
        configuration: {
          showOnlyExceptions: true,
          severity: ['error', 'warning'],
          groupBy: 'ruleType'
        }
      }
    ],
    layout: [
      { i: 'regulatory-validation', x: 0, y: 0, w: 12, h: 4, widgetId: 'regulatory-validation' },
      { i: 'audit-trail', x: 0, y: 4, w: 8, h: 6, widgetId: 'audit-trail' },
      { i: 'exception-report', x: 8, y: 4, w: 4, h: 6, widgetId: 'exception-report' }
    ],
    metadata: {
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      author: 'System',
      version: '1.0',
      tags: ['compliance', 'audit', 'regulatory']
    },
    isDefault: true
  }
];

interface ReportTemplateManagerProps {
  onApplyTemplate: (template: ReportTemplate) => void;
  currentDashboard?: { widgets: any[]; layouts: any[] };
}

export const ReportTemplateManager: React.FC<ReportTemplateManagerProps> = ({
  onApplyTemplate,
  currentDashboard
}) => {
  const [templates, setTemplates] = useLocalStorage<ReportTemplate[]>('report-templates', defaultTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, selectedCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'audit': return <FileText className="h-4 w-4" />;
      case 'financial': return <TrendingUp className="h-4 w-4" />;
      case 'analysis': return <BarChart3 className="h-4 w-4" />;
      case 'compliance': return <FileText className="h-4 w-4" />;
      default: return <Layout className="h-4 w-4" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'basic': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleCreateTemplate = (templateData: Partial<ReportTemplate>) => {
    const newTemplate: ReportTemplate = {
      id: `template-${Date.now()}`,
      name: templateData.name || 'Ny mal',
      description: templateData.description || '',
      category: templateData.category || 'custom',
      complexity: templateData.complexity || 'basic',
      widgets: currentDashboard?.widgets || [],
      layout: currentDashboard?.layouts || [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Bruker',
        version: '1.0',
        tags: templateData.metadata?.tags || []
      }
    };

    setTemplates(prev => [...prev, newTemplate]);
    setIsCreateDialogOpen(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleDuplicateTemplate = (template: ReportTemplate) => {
    const duplicated: ReportTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Kopi)`,
      metadata: {
        ...template.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    setTemplates(prev => [...prev, duplicated]);
  };

  const exportTemplate = (template: ReportTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapportmaler
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Bruk forhåndsdefinerte maler eller lag egne
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ny mal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opprett ny rapportmal</DialogTitle>
              </DialogHeader>
              <TemplateCreateForm 
                onSubmit={handleCreateTemplate}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and filters */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i maler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Kategori: {selectedCategory === 'all' ? 'Alle' : selectedCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                Alle kategorier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory('audit')}>
                Revisjon
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory('financial')}>
                Finansiell
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory('analysis')}>
                Analyse
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedCategory('compliance')}>
                Compliance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliser
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportTemplate(template)}>
                          <Download className="h-4 w-4 mr-2" />
                          Eksporter
                        </DropdownMenuItem>
                        {!template.isDefault && (
                          <>
                            <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Rediger
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-destructive"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Slett
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    <Badge variant={getComplexityColor(template.complexity) as any} className="text-xs">
                      {template.complexity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.widgets.length} widgets
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button 
                    className="w-full" 
                    onClick={() => onApplyTemplate(template)}
                  >
                    Bruk mal
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ingen maler funnet</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Template creation form component
interface TemplateCreateFormProps {
  onSubmit: (data: Partial<ReportTemplate>) => void;
  onCancel: () => void;
}

const TemplateCreateForm: React.FC<TemplateCreateFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom' as ReportTemplate['category'],
    complexity: 'basic' as ReportTemplate['complexity'],
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      metadata: {
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Bruker',
        version: '1.0'
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Navn på mal</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Kategori</Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ReportTemplate['category'] }))}
            className="w-full p-2 border rounded"
          >
            <option value="custom">Egendefinert</option>
            <option value="audit">Revisjon</option>
            <option value="financial">Finansiell</option>
            <option value="analysis">Analyse</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>

        <div>
          <Label htmlFor="complexity">Kompleksitet</Label>
          <select
            id="complexity"
            value={formData.complexity}
            onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value as ReportTemplate['complexity'] }))}
            className="w-full p-2 border rounded"
          >
            <option value="basic">Grunnleggende</option>
            <option value="intermediate">Middels</option>
            <option value="advanced">Avansert</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (kommaseparert)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="revisjon, finansiell, analyse"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
        <Button type="submit">
          Opprett mal
        </Button>
      </div>
    </form>
  );
};