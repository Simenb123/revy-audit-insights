
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Wand2, Save, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { WorkingPaperTemplate, EnhancedAuditActionTemplate } from '@/types/enhanced-audit-actions';

interface WorkingPaperGeneratorProps {
  template: WorkingPaperTemplate;
  actionTemplate?: EnhancedAuditActionTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (workingPaper: any) => void;
}

interface WorkingPaperSection {
  id: string;
  title: string;
  type: 'text' | 'checklist' | 'table';
  required: boolean;
  content?: string;
  items?: Array<{ text: string; checked: boolean; }>;
  tableData?: Array<Record<string, string>>;
  placeholder?: string;
}

const WorkingPaperGenerator = ({ 
  template, 
  actionTemplate, 
  open, 
  onOpenChange, 
  onSave 
}: WorkingPaperGeneratorProps) => {
  const [workingPaperData, setWorkingPaperData] = useState(() => {
    const structure = template.template_structure as any;
    const sections: WorkingPaperSection[] = structure?.sections || [];
    
    return {
      title: `${template.name} - ${actionTemplate?.name || 'Ny handling'}`,
      client_name: '',
      period: '',
      prepared_by: '',
      reviewed_by: '',
      date_prepared: new Date().toISOString().split('T')[0],
      sections: sections.map(section => ({
        ...section,
        content: section.type === 'text' ? '' : undefined,
        items: section.type === 'checklist' ? 
          (section.items || []).map((item: string) => ({ text: item, checked: false })) : 
          undefined,
        tableData: section.type === 'table' ? [{}] : undefined
      }))
    };
  });

  const handleSectionUpdate = (sectionId: string, updates: Partial<WorkingPaperSection>) => {
    setWorkingPaperData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const handleChecklistUpdate = (sectionId: string, itemIndex: number, checked: boolean) => {
    setWorkingPaperData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId && section.items ? {
          ...section,
          items: section.items.map((item, index) => 
            index === itemIndex ? { ...item, checked } : item
          )
        } : section
      )
    }));
  };

  const addTableRow = (sectionId: string) => {
    setWorkingPaperData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId && section.tableData ? {
          ...section,
          tableData: [...section.tableData, {}]
        } : section
      )
    }));
  };

  const updateTableCell = (sectionId: string, rowIndex: number, column: string, value: string) => {
    setWorkingPaperData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId && section.tableData ? {
          ...section,
          tableData: section.tableData.map((row, index) => 
            index === rowIndex ? { ...row, [column]: value } : row
          )
        } : section
      )
    }));
  };

  const getCompletionStatus = () => {
    const requiredSections = workingPaperData.sections.filter(s => s.required);
    const completedSections = requiredSections.filter(section => {
      if (section.type === 'text') return section.content && section.content.trim().length > 0;
      if (section.type === 'checklist') return section.items && section.items.some(item => item.checked);
      if (section.type === 'table') return section.tableData && section.tableData.length > 0;
      return false;
    });
    
    return {
      completed: completedSections.length,
      total: requiredSections.length,
      percentage: Math.round((completedSections.length / requiredSections.length) * 100)
    };
  };

  const completion = getCompletionStatus();

  const renderSection = (section: WorkingPaperSection) => {
    switch (section.type) {
      case 'text':
        return (
          <Textarea
            value={section.content || ''}
            onChange={(e) => handleSectionUpdate(section.id, { content: e.target.value })}
            placeholder={section.placeholder || `Skriv inn ${section.title.toLowerCase()}...`}
            className="min-h-[100px]"
          />
        );
        
      case 'checklist':
        return (
          <div className="space-y-2">
            {section.items?.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(checked) => 
                    handleChecklistUpdate(section.id, index, checked as boolean)
                  }
                />
                <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        );
        
      case 'table':
        const structure = template.template_structure as any;
        const sectionTemplate = structure?.sections?.find((s: any) => s.id === section.id);
        const columns = sectionTemplate?.columns || ['Beskrivelse', 'Kommentar'];
        
        return (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {columns.map((column: string) => (
                      <th key={column} className="p-2 text-left text-sm font-medium border-b">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.tableData?.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((column: string) => (
                        <td key={column} className="p-2 border-b">
                          <Input
                            value={row[column] || ''}
                            onChange={(e) => updateTableCell(section.id, rowIndex, column, e.target.value)}
                            placeholder={`Skriv inn ${column.toLowerCase()}`}
                            className="border-0 p-1"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addTableRow(section.id)}
            >
              Legg til rad
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generer arbeidspapir
            </DialogTitle>
            <div className="flex items-center gap-2">
              {completion.percentage === 100 ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Fullført
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {completion.completed}/{completion.total} seksjoner
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Arbeidspapir-informasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tittel</label>
                  <Input
                    value={workingPaperData.title}
                    onChange={(e) => setWorkingPaperData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Klient</label>
                  <Input
                    value={workingPaperData.client_name}
                    onChange={(e) => setWorkingPaperData(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Klientnavn"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Periode</label>
                  <Input
                    value={workingPaperData.period}
                    onChange={(e) => setWorkingPaperData(prev => ({ ...prev, period: e.target.value }))}
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Dato utarbeidet</label>
                  <Input
                    type="date"
                    value={workingPaperData.date_prepared}
                    onChange={(e) => setWorkingPaperData(prev => ({ ...prev, date_prepared: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {workingPaperData.sections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {section.title}
                    {section.required && <span className="text-red-500">*</span>}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {section.type === 'text' ? 'Tekst' : 
                     section.type === 'checklist' ? 'Sjekkliste' : 'Tabell'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {renderSection(section)}
              </CardContent>
            </Card>
          ))}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Basert på mal: {template.name}
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Eksporter PDF
              </Button>
              <Button 
                onClick={() => onSave?.(workingPaperData)}
                disabled={completion.percentage < 100}
              >
                <Save className="w-4 h-4 mr-2" />
                Lagre arbeidspapir
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkingPaperGenerator;
