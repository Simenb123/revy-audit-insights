
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  FileText, 
  TrendingUp, 
  Target, 
  Zap,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';

const DocumentTypeTrainer = () => {
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  const { data: documentTypes = [] } = useDocumentTypes();

  // Mock training statistics
  const trainingStats = [
    {
      documentType: 'Hovedbok',
      trainingDocuments: 23,
      accuracy: 96,
      lastTrained: '2024-01-15',
      status: 'excellent'
    },
    {
      documentType: 'Saldobalanse', 
      trainingDocuments: 18,
      accuracy: 89,
      lastTrained: '2024-01-12',
      status: 'good'
    },
    {
      documentType: 'Lønnsslipp',
      trainingDocuments: 15,
      accuracy: 78,
      lastTrained: '2024-01-10',
      status: 'needs_improvement'
    },
    {
      documentType: 'Ansettelsesavtale',
      trainingDocuments: 8,
      accuracy: 65,
      lastTrained: '2024-01-08',
      status: 'needs_improvement'
    }
  ];

  const startTraining = async () => {
    if (!selectedDocumentType) return;
    
    setIsTraining(true);
    setTrainingProgress(0);
    
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'needs_improvement': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'needs_improvement': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Training Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Modeller trent</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Treningsdokumenter</p>
                <p className="text-2xl font-bold">64</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Avg. nøyaktighet</p>
                <p className="text-2xl font-bold">82%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Forbedring sist uke</p>
                <p className="text-2xl font-bold">+7%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Dokumenttype-trening
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tren AI-modeller for bedre gjenkjennelse av spesifikke dokumenttyper
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Velg dokumenttype for trening</label>
              <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg dokumenttype" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={startTraining}
                disabled={!selectedDocumentType || isTraining}
                className="w-full"
              >
                {isTraining ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Trener...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Start AI-trening
                  </>
                )}
              </Button>
            </div>
          </div>

          {isTraining && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Treningsframgang</span>
                <span>{trainingProgress}%</span>
              </div>
              <Progress value={trainingProgress} className="h-2" />
              <p className="text-xs text-gray-500">
                Analyserer treningsdokumenter og optimaliserer modell...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Treningsstatistikk per dokumenttype
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainingStats.map((stat, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">{stat.documentType}</h4>
                    {getStatusIcon(stat.status)}
                  </div>
                  <Badge variant="outline">
                    {stat.accuracy}% nøyaktighet
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Treningsdokumenter</p>
                    <p className="font-medium">{stat.trainingDocuments}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sist trent</p>
                    <p className="font-medium">{stat.lastTrained}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className={`font-medium ${getStatusColor(stat.status)}`}>
                      {stat.status === 'excellent' && 'Utmerket'}
                      {stat.status === 'good' && 'God'}
                      {stat.status === 'needs_improvement' && 'Trenger forbedring'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Progress value={stat.accuracy} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentTypeTrainer;
