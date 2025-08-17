import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useReportManagement } from '@/hooks/useReportManagement';
import { toast } from 'sonner';

interface ReportGenerationFormProps {
  clientId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ReportFormData {
  template_id: string;
  period_start: string;
  period_end: string;
  export_format: 'pdf' | 'excel' | 'json' | 'html';
}

export function ReportGenerationForm({ clientId, onCancel, onSuccess }: ReportGenerationFormProps) {
  const { reportTemplates, templatesLoading, generateReport, isGenerating } = useReportManagement(clientId);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ReportFormData>({
    defaultValues: {
      template_id: '',
      period_start: `${new Date().getFullYear()}-01-01`,
      period_end: `${new Date().getFullYear()}-12-31`,
      export_format: 'pdf'
    }
  });

  const selectedTemplateId = watch('template_id');

  // Update selected template when template_id changes
  const handleTemplateChange = (templateId: string) => {
    setValue('template_id', templateId);
    const template = reportTemplates?.find(t => t.id === templateId);
    setSelectedTemplate(template);
  };

  const onSubmit = async (data: ReportFormData) => {
    try {
      await generateReport({
        template_id: data.template_id,
        period_start: data.period_start,
        period_end: data.period_end,
        parameters: {
          export_format: data.export_format
        }
      });
      
      toast.success('Rapport genereres...');
      onSuccess();
    } catch (error) {
      toast.error('Det oppstod en feil ved generering av rapporten');
      console.error('Report generation error:', error);
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'financial': return 'Finansiell';
      case 'audit': return 'Revisjon';
      case 'tax': return 'Skatt';
      case 'compliance': return 'Compliance';
      case 'analytical': return 'Analytisk';
      default: return category;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'balance_sheet': return 'Balanse';
      case 'income_statement': return 'Resultatregnskap';
      case 'cash_flow': return 'Kontantstrøm';
      case 'trial_balance': return 'Prøvebalanse';
      case 'audit_report': return 'Revisjonsberetning';
      case 'management_letter': return 'Tilleggsberetning';
      case 'variance_analysis': return 'Avviksanalyse';
      case 'ratio_analysis': return 'Nøkkeltallsanalyse';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Generer rapport</h1>
          <p className="text-muted-foreground">
            Velg en rapportmal og periode for å generere en ny rapport
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Rapportmal</CardTitle>
            <CardDescription>
              Velg hvilken type rapport du ønsker å generere
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mal *</Label>
              <Select 
                value={selectedTemplateId} 
                onValueChange={handleTemplateChange}
                disabled={templatesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg en rapportmal" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({getCategoryText(template.category)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.template_id && (
                <p className="text-sm text-red-600">Rapportmal er påkrevd</p>
              )}
            </div>

            {selectedTemplate && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedTemplate.description}
                </p>
                <div className="flex gap-4 text-sm">
                  <span>
                    <strong>Kategori:</strong> {getCategoryText(selectedTemplate.category)}
                  </span>
                  <span>
                    <strong>Type:</strong> {getTypeText(selectedTemplate.template_type)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rapportperiode</CardTitle>
            <CardDescription>
              Angi hvilken periode rapporten skal dekke
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_start">Fra dato *</Label>
                <Input
                  id="period_start"
                  type="date"
                  {...register('period_start', { required: 'Fra dato er påkrevd' })}
                />
                {errors.period_start && (
                  <p className="text-sm text-red-600">{errors.period_start.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_end">Til dato *</Label>
                <Input
                  id="period_end"
                  type="date"
                  {...register('period_end', { required: 'Til dato er påkrevd' })}
                />
                {errors.period_end && (
                  <p className="text-sm text-red-600">{errors.period_end.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eksportformat</CardTitle>
            <CardDescription>
              Velg hvilket format rapporten skal genereres i
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select 
                defaultValue="pdf"
                onValueChange={(value) => setValue('export_format', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
            Avbryt
          </Button>
          <Button type="submit" disabled={isGenerating || !selectedTemplate}>
            {isGenerating ? 'Genererer...' : 'Generer rapport'}
          </Button>
        </div>
      </form>
    </div>
  );
}