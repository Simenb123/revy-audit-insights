import React, { useState } from 'react';
import { layoutTemplates, LayoutTemplate } from '@/components/Layout/LayoutTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutTemplateSelectorProps {
  onSelectTemplate: (template: LayoutTemplate) => void;
  onClose: () => void;
  className?: string;
}

const categoryIcons = {
  dashboard: BarChart3,
  report: Layout,
  analytics: TrendingUp,
  kpi: PieChart
};

const categoryLabels = {
  dashboard: 'Dashboard',
  report: 'Report',
  analytics: 'Analytics', 
  kpi: 'KPI Overview'
};

export function LayoutTemplateSelector({ onSelectTemplate, onClose, className }: LayoutTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<LayoutTemplate | null>(null);

  const categories = ['all', ...Array.from(new Set(layoutTemplates.map(t => t.category)))];
  
  const filteredTemplates = selectedCategory === 'all' 
    ? layoutTemplates 
    : layoutTemplates.filter(t => t.category === selectedCategory);

  const handleTemplateSelect = (template: LayoutTemplate) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Choose Layout Template</h2>
          <p className="text-sm text-muted-foreground">
            Select a pre-designed layout to get started quickly
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          {categories.filter(c => c !== 'all').map((category) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            return (
              <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {categoryLabels[category as keyof typeof categoryLabels]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const Icon = categoryIcons[template.category];
              const isSelected = selectedTemplate?.id === template.id;
              
              return (
                <Card 
                  key={template.id}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    'hover:shadow-md hover:scale-105',
                    isSelected && 'ring-2 ring-primary bg-primary/5'
                  )}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">{template.preview}</div>
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground">
                      {template.layout.length} widgets • Responsive layout
                    </div>
                    
                    {/* Mini layout preview */}
                    <div className="mt-3 grid grid-cols-12 gap-1 h-20 bg-muted/30 rounded-md p-2">
                      {template.layout.slice(0, 6).map((item, index) => (
                        <div
                          key={index}
                          className="bg-primary/20 rounded-sm"
                          style={{
                            gridColumn: `span ${Math.max(1, Math.floor(item.w / 2))}`,
                            gridRow: `span ${Math.max(1, item.h > 3 ? 2 : 1)}`
                          }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {selectedTemplate && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h3 className="font-medium">{selectedTemplate.name}</h3>
            <p className="text-sm text-muted-foreground">
              This template includes {selectedTemplate.layout.length} widgets with responsive breakpoints
            </p>
          </div>
          <Button onClick={handleApplyTemplate}>
            Apply Template
          </Button>
        </div>
      )}
    </div>
  );
}