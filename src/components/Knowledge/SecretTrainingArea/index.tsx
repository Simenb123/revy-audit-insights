
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  EyeOff, 
  Upload, 
  FileText, 
  Brain, 
  Shield, 
  Database,
  Settings,
  BookOpen,
  Target,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import TrainingDocumentUploader from './TrainingDocumentUploader';
import TrainingDocumentLibrary from './TrainingDocumentLibrary';
import AIAnalysisPatterns from './AIAnalysisPatterns';
import DocumentTypeTrainer from './DocumentTypeTrainer';

const SecretTrainingArea = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('library');

  // Check if user has admin access
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const isAdmin = userProfile?.user_role === 'admin' || userProfile?.user_role === 'partner';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600">Begrenset tilgang</h3>
        <p className="text-gray-500">Dette området krever administratortilgang.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with visibility toggle */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-red-900">🤫 Hemmelig AI-treningsområde</CardTitle>
                <p className="text-red-700 text-sm">
                  Konfidensielt område for AI-forbedring og dokumenttype-trening
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Kun Admin
              </Badge>
              <Button
                size="sm"
                variant={isVisible ? "default" : "outline"}
                onClick={() => setIsVisible(!isVisible)}
                className={isVisible ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {isVisible ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {isVisible ? 'Skjul' : 'Vis'} innhold
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main content - only visible when toggled on */}
      {isVisible && (
        <>
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <Brain className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">AI-modeller</p>
                    <p className="text-2xl font-bold">6</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Nøyaktighet</p>
                    <p className="text-2xl font-bold">91%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Forbedringer</p>
                    <p className="text-2xl font-bold">+15%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="library" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Dokumentbibliotek
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Last opp treningsdata
              </TabsTrigger>
              <TabsTrigger value="trainer" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Dokumenttype-trener
              </TabsTrigger>
              <TabsTrigger value="patterns" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI-mønstre
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Innstillinger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library">
              <TrainingDocumentLibrary />
            </TabsContent>

            <TabsContent value="upload">
              <TrainingDocumentUploader />
            </TabsContent>

            <TabsContent value="trainer">
              <DocumentTypeTrainer />
            </TabsContent>

            <TabsContent value="patterns">
              <AIAnalysisPatterns />
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>AI-treningsinnstillinger</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800">⚠️ Eksperimentell funksjonalitet</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Dette området er under utvikling. Endringer kan påvirke AI-ytelsen.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">AI-læringsrate</label>
                        <input type="number" defaultValue="0.85" step="0.01" className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Minimum konfidens</label>
                        <input type="number" defaultValue="0.70" step="0.01" className="w-full p-2 border rounded" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SecretTrainingArea;
