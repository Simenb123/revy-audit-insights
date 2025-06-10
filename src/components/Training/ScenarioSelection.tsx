
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Play,
  Star,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ScenarioSelection = () => {
  const navigate = useNavigate();

  // Fetch available scenarios
  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['test-scenarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_scenarios')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch user progress for scenarios
  const { data: userProgress } = useQuery({
    queryKey: ['user-scenario-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_progress')
        .select('scenario_id, module_name, completed_at, score')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      return data;
    }
  });

  const getScenarioProgress = (scenarioId: string) => {
    if (!userProgress) return { completed: 0, total: 5 };
    
    const scenarioModules = userProgress.filter(p => p.scenario_id === scenarioId);
    const completed = scenarioModules.filter(p => p.completed_at).length;
    
    return { completed, total: 5 }; // 5 modules total
  };

  const getScenarioIcon = (industry: string) => {
    if (industry.toLowerCase().includes('varehandel') || industry.toLowerCase().includes('retail')) {
      return Building2;
    }
    if (industry.toLowerCase().includes('tech') || industry.toLowerCase().includes('it')) {
      return TrendingUp;
    }
    return Building2;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Ikke oppgitt';
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return <div className="text-center py-8">Laster scenarier...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Velg et scenario</h2>
        <p className="text-gray-600">
          Hvert scenario representerer et reelt selskap med autentiske utfordringer og data. 
          Velg et scenario for å starte din læringsreise.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenarios?.map((scenario) => {
          const IconComponent = getScenarioIcon(scenario.industry);
          const progress = getScenarioProgress(scenario.id);
          const progressPercentage = (progress.completed / progress.total) * 100;
          
          return (
            <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{scenario.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {scenario.industry}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Progresjon</div>
                    <div className="text-lg font-bold text-revio-600">
                      {Math.round(progressPercentage)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-700">{scenario.description}</p>
                
                {/* Company details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{scenario.employee_count || 'Ikke oppgitt'} ansatte</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span>{formatCurrency(scenario.annual_revenue)} omsetning</span>
                  </div>
                </div>

                {/* Key challenges */}
                <div>
                  <h4 className="font-medium mb-2">Hovedutfordringer:</h4>
                  <div className="flex flex-wrap gap-2">
                    {scenario.key_challenges.slice(0, 3).map((challenge, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {challenge}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Moduler fullført</span>
                    <span>{progress.completed}/{progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-revio-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 bg-revio-500 hover:bg-revio-600"
                    onClick={() => navigate(`/training/scenario/${scenario.id}`)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {progress.completed > 0 ? 'Fortsett' : 'Start scenario'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/training/scenario/${scenario.id}/overview`)}
                  >
                    Se detaljer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* General Training Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-purple-900">Generell revisjonsopplæring</CardTitle>
              <p className="text-purple-700 mt-1">Grunnleggende revisjonskonsepty og teorit</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-purple-800 mb-4">
            Lær grunnleggende revisjonskonsepty uten å være knyttet til et spesifikt selskap. 
            Perfekt for å bygge teoretisk forståelse.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-purple-700 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Fleksibel timing</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>Grunnleggende nivå</span>
            </div>
          </div>
          
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate('/training/general')}
          >
            <Play className="h-4 w-4 mr-2" />
            Start generell opplæring
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScenarioSelection;
