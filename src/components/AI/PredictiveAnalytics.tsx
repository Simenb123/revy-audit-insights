
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Brain, Zap, Calendar } from 'lucide-react';
import { Client } from '@/types/revio';

interface PredictiveAnalyticsProps {
  client: Client;
}

interface Prediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'positive' | 'negative' | 'stable';
  description: string;
}

interface ForecastPoint {
  period: string;
  actual: number | null;
  predicted: number;
  confidence: number;
}

const PredictiveAnalytics = ({ client }: PredictiveAnalyticsProps) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePredictions = async () => {
    setIsGenerating(true);
    
    // Simuler AI-basert prediktiv analyse
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newPredictions: Prediction[] = [
      {
        metric: 'Omsetning neste kvartal',
        currentValue: 12500000,
        predictedValue: 13750000,
        confidence: 87,
        trend: 'positive',
        description: 'Basert på sesongmønstre og markedstrender'
      },
      {
        metric: 'Driftsresultat',
        currentValue: 1890000,
        predictedValue: 2100000,
        confidence: 82,
        trend: 'positive',
        description: 'Forbedret margin grunnet kostnadsoptimalisering'
      },
      {
        metric: 'Arbeidskapital',
        currentValue: 3200000,
        predictedValue: 2950000,
        confidence: 75,
        trend: 'negative',
        description: 'Reduksjon grunnet forbedret kundefordringshåndtering'
      },
      {
        metric: 'Revisjonsmaterialitet',
        currentValue: 625000,
        predictedValue: 687500,
        confidence: 90,
        trend: 'positive',
        description: 'Justert basert på forventet omsetningsvekst'
      }
    ];

    const forecast: ForecastPoint[] = [
      { period: 'Q1 2024', actual: 12500, predicted: 12500, confidence: 95 },
      { period: 'Q2 2024', actual: null, predicted: 13750, confidence: 87 },
      { period: 'Q3 2024', actual: null, predicted: 14200, confidence: 78 },
      { period: 'Q4 2024', actual: null, predicted: 15100, confidence: 72 },
      { period: 'Q1 2025', actual: null, predicted: 15800, confidence: 65 }
    ];

    setPredictions(newPredictions);
    setForecastData(forecast);
    setIsGenerating(false);
  };

  useEffect(() => {
    generatePredictions();
  }, [client.id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'bg-green-500';
    if (confidence >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Prediktiv Analyse
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generatePredictions}
              disabled={isGenerating}
            >
              <Zap className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
              Generer nye prognoser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="text-center py-8">
              <div className="animate-pulse rounded-full h-8 w-8 bg-primary/20 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Genererer AI-prediksjoner...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictions.map((prediction, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{prediction.metric}</h4>
                    <Badge 
                      variant="secondary" 
                      className={`${getConfidenceColor(prediction.confidence)} text-white`}
                    >
                      {prediction.confidence}% sikkerhet
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nåværende:</span>
                      <span>{formatCurrency(prediction.currentValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Predikert:</span>
                      <span className={getTrendColor(prediction.trend)}>
                        {formatCurrency(prediction.predictedValue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`h-4 w-4 ${getTrendColor(prediction.trend)}`} />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(((prediction.predictedValue - prediction.currentValue) / prediction.currentValue) * 100)}% endring
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{prediction.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Omsetningsprognose
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => `${value}k`} />
                <Tooltip 
                  formatter={(value: number) => [`${value}k NOK`, 'Verdi']}
                  labelFormatter={(label) => `Periode: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Faktisk"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predikert"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveAnalytics;
