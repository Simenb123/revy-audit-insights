
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  Trophy, 
  Target, 
  BookOpen, 
  Users, 
  Star,
  Play,
  CheckCircle
} from 'lucide-react';
import TrainingOverview from '@/components/Training/TrainingOverview';
import ScenarioSelection from '@/components/Training/ScenarioSelection';
import UserProgress from '@/components/Training/UserProgress';

const Training = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user's training progress
  const { data: userProgress } = useQuery({
    queryKey: ['user-training-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_progress')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch user badges
  const { data: userBadges } = useQuery({
    queryKey: ['user-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate overall progress
  const totalModules = 5; // risikovurdering, materialitet, testing, dokumentasjon, konklusjon
  const completedModules = userProgress?.filter(p => p.completed_at).length || 0;
  const progressPercentage = (completedModules / totalModules) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-revio-500 to-revio-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <GraduationCap className="h-8 w-8" />
                RevisionAkademiet
              </h1>
              <p className="text-revio-100 mt-2">
                Lær revisjon gjennom interaktive scenarier og praktiske øvelser
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
              <div className="text-revio-100">Fullført</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progressPercentage} className="bg-revio-400" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Moduler fullført</p>
                <p className="text-xl font-bold">{completedModules}/{totalModules}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Badges opptjent</p>
                <p className="text-xl font-bold">{userBadges?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Totalpoeng</p>
                <p className="text-xl font-bold">
                  {userBadges?.reduce((sum, badge) => sum + (badge.points_earned || 0), 0) || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nivå</p>
                <p className="text-xl font-bold">
                  {Math.floor((userBadges?.reduce((sum, badge) => sum + (badge.points_earned || 0), 0) || 0) / 100) + 1}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarier</TabsTrigger>
            <TabsTrigger value="progress">Min progresjon</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TrainingOverview userProgress={userProgress} userBadges={userBadges} />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenarioSelection />
          </TabsContent>

          <TabsContent value="progress">
            <UserProgress userProgress={userProgress} userBadges={userBadges} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Training;
