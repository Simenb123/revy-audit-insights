import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  FileText, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocumentsList';
import { format, subDays, startOfDay } from 'date-fns';

interface DocumentAnalyticsDashboardProps {
  documents: ClientDocument[];
  clientName?: string;
}

const DocumentAnalyticsDashboard = ({ documents, clientName }: DocumentAnalyticsDashboardProps) => {
  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const total = documents.length;
    const aiAnalyzed = documents.filter(d => d.ai_analysis_summary).length;
    const textExtracted = documents.filter(d => d.text_extraction_status === 'completed').length;
    const categorized = documents.filter(d => d.category && d.category !== 'Ukategorisert').length;
    const highConfidence = documents.filter(d => (d.ai_confidence_score || 0) >= 0.8).length;
    const mediumConfidence = documents.filter(d => {
      const score = d.ai_confidence_score || 0;
      return score >= 0.5 && score < 0.8;
    }).length;
    const lowConfidence = documents.filter(d => (d.ai_confidence_score || 0) < 0.5 && d.ai_confidence_score).length;
    const processing = documents.filter(d => d.text_extraction_status === 'processing').length;
    const failed = documents.filter(d => d.text_extraction_status === 'failed').length;

    return {
      total,
      aiAnalyzed,
      textExtracted,
      categorized,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      processing,
      failed,
      aiProgress: total > 0 ? (aiAnalyzed / total) * 100 : 0,
      extractionProgress: total > 0 ? (textExtracted / total) * 100 : 0,
      categorizationProgress: total > 0 ? (categorized / total) * 100 : 0
    };
  }, [documents]);

  // Category distribution data
  const categoryData = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    documents.forEach(doc => {
      const category = doc.category || 'Ukategorisert';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  // Upload timeline data (last 30 days)
  const timelineData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      return {
        date: format(date, 'MM/dd'),
        fullDate: date,
        uploads: 0,
        aiProcessed: 0
      };
    });

    documents.forEach(doc => {
      const docDate = startOfDay(new Date(doc.created_at));
      const dayData = days.find(d => d.fullDate.getTime() === docDate.getTime());
      if (dayData) {
        dayData.uploads++;
        if (doc.ai_analysis_summary) {
          dayData.aiProcessed++;
        }
      }
    });

    return days;
  }, [documents]);

  // AI confidence distribution
  const confidenceData = [
    { name: 'Høy (80%+)', value: stats.highConfidence, color: '#22c55e' },
    { name: 'Medium (50-80%)', value: stats.mediumConfidence, color: '#f59e0b' },
    { name: 'Lav (<50%)', value: stats.lowConfidence, color: '#ef4444' },
    { name: 'Ikke analysert', value: stats.total - stats.aiAnalyzed, color: '#94a3b8' }
  ].filter(item => item.value > 0);

  // Subject areas analysis
  const subjectAreasData = useMemo(() => {
    const areasCount: Record<string, number> = {};
    documents.forEach(doc => {
      if (doc.ai_suggested_subject_areas) {
        doc.ai_suggested_subject_areas.forEach(area => {
          areasCount[area] = (areasCount[area] || 0) + 1;
        });
      }
      if (doc.subject_area) {
        areasCount[doc.subject_area] = (areasCount[doc.subject_area] || 0) + 1;
      }
    });

    return Object.entries(areasCount)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 areas
  }, [documents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Dokumentanalyse</h3>
          <p className="text-muted-foreground">
            Oversikt over dokumentstatus og AI-prosessering for {clientName || 'klient'}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {stats.total} dokumenter totalt
        </Badge>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI-analysert</p>
                <p className="text-2xl font-bold text-primary">{stats.aiAnalyzed}</p>
                <Progress value={stats.aiProgress} className="mt-2" />
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.aiProgress.toFixed(1)}% av alle dokumenter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tekst uttrukket</p>
                <p className="text-2xl font-bold text-green-600">{stats.textExtracted}</p>
                <Progress value={stats.extractionProgress} className="mt-2" />
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.extractionProgress.toFixed(1)}% lesbare dokumenter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kategorisert</p>
                <p className="text-2xl font-bold text-blue-600">{stats.categorized}</p>
                <Progress value={stats.categorizationProgress} className="mt-2" />
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.categorizationProgress.toFixed(1)}% organisert
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Høy sikkerhet</p>
                <p className="text-2xl font-bold text-orange-600">{stats.highConfidence}</p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">AI-verifisert</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status indicators */}
      {(stats.processing > 0 || stats.failed > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.processing > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {stats.processing} dokumenter prosesseres
                    </p>
                    <p className="text-sm text-blue-700">
                      AI-analyse pågår for disse dokumentene
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.failed > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">
                      {stats.failed} dokumenter feilet
                    </p>
                    <p className="text-sm text-red-700">
                      Tekstutvinning eller AI-analyse feilet
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts and detailed analytics */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Kategorier</TabsTrigger>
          <TabsTrigger value="timeline">Tidslinje</TabsTrigger>
          <TabsTrigger value="confidence">AI-sikkerhet</TabsTrigger>
          <TabsTrigger value="subjects">Fagområder</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Dokumentkategorier</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Opplastings- og prosesseringstidslinje (siste 30 dager)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="uploads" 
                    stroke="hsl(var(--primary))" 
                    name="Opplastinger"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="aiProcessed" 
                    stroke="hsl(var(--chart-2))" 
                    name="AI-prosessert"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confidence">
          <Card>
            <CardHeader>
              <CardTitle>AI-sikkerhetsfordeling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={confidenceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {confidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-3">
                  {confidenceData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <Badge variant="outline">
                        {item.value} ({((item.value / stats.total) * 100).toFixed(1)}%)
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Top fagområder</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectAreasData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="area" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentAnalyticsDashboard;