import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, CheckCircle, Clock, Star, BookOpen, 
  TrendingUp, Award, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';

interface LearningPathStep {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'quiz' | 'practical' | 'assessment';
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  completed: boolean;
  score?: number;
  category: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalSteps: number;
  completedSteps: number;
  estimatedHours: number;
  difficulty: string;
  category: string;
  steps: LearningPathStep[];
}

export const PersonalizedLearningPath = () => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Reuse existing query patterns for user preferences
  const { data: userProfile } = useQuery({
    queryKey: ['user-learning-profile'],
    queryFn: async () => {
      // Simulate user learning profile - would integrate with existing user preferences
      return {
        level: 'intermediate',
        interests: ['ISA Standards', 'Risk Assessment', 'Analytics'],
        completedHours: 45,
        certifications: ['Basic Auditing'],
        preferredLearningStyle: 'visual'
      };
    }
  });

  // Reuse existing data fetching patterns
  const { data: learningPaths = [], isLoading } = useQuery({
    queryKey: ['personalized-learning-paths', userProfile],
    queryFn: async () => {
      // Simulate personalized path generation
      return [
        {
          id: '1',
          title: 'ISA 315 Mastery Path',
          description: 'Komplett læringsbane for risikovurdering og intern kontroll',
          totalSteps: 8,
          completedSteps: 3,
          estimatedHours: 12,
          difficulty: 'intermediate',
          category: 'ISA Standards',
          steps: [
            {
              id: '1-1',
              title: 'Grunnleggende om ISA 315',
              description: 'Introduksjon til risikovurdering',
              type: 'lesson' as const,
              estimatedMinutes: 45,
              difficulty: 'beginner' as const,
              prerequisites: [],
              completed: true,
              score: 85,
              category: 'Theory'
            },
            {
              id: '1-2',
              title: 'Praktisk risikovurdering',
              description: 'Gjennomgang av praktiske eksempler',
              type: 'practical' as const,
              estimatedMinutes: 90,
              difficulty: 'intermediate' as const,
              prerequisites: ['1-1'],
              completed: true,
              score: 92,
              category: 'Practice'
            },
            {
              id: '1-3',
              title: 'Dokumentasjon av risikovurdering',
              description: 'Hvordan dokumentere funn og konklusjoner',
              type: 'lesson' as const,
              estimatedMinutes: 60,
              difficulty: 'intermediate' as const,
              prerequisites: ['1-2'],
              completed: true,
              score: 78,
              category: 'Documentation'
            },
            {
              id: '1-4',
              title: 'Quiz: Risikovurdering',
              description: 'Test dine kunnskaper om ISA 315',
              type: 'quiz' as const,
              estimatedMinutes: 30,
              difficulty: 'intermediate' as const,
              prerequisites: ['1-3'],
              completed: false,
              category: 'Assessment'
            }
          ]
        }
      ] as LearningPath[];
    },
    enabled: !!userProfile
  });

  // Reuse existing mutation patterns
  const completeStepMutation = useMutation({
    mutationFn: async ({ pathId, stepId }: { pathId: string; stepId: string }) => {
      // Simulate step completion - would integrate with existing progress tracking
      await new Promise(resolve => setTimeout(resolve, 500));
      return { pathId, stepId, completed: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalized-learning-paths'] });
      toast.success('Steg fullført! 🎉');
    }
  });

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="h-4 w-4" />;
      case 'quiz': return <Target className="h-4 w-4" />;
      case 'practical': return <TrendingUp className="h-4 w-4" />;
      case 'assessment': return <Award className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800';
      case 'quiz': return 'bg-purple-100 text-purple-800';
      case 'practical': return 'bg-green-100 text-green-800';
      case 'assessment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Laster personaliserte læringsbaner...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Personaliserte Læringsbaner
          </CardTitle>
          {userProfile && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Nivå: {userProfile.level}</span>
              <span>Fullførte timer: {userProfile.completedHours}</span>
              <span>Sertifiseringer: {userProfile.certifications.length}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="paths" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paths">Mine Baner</TabsTrigger>
              <TabsTrigger value="recommendations">Anbefalinger</TabsTrigger>
            </TabsList>
            
            <TabsContent value="paths">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Learning Paths Overview */}
                <div className="space-y-4">
                  <h3 className="font-medium">Aktive Læringsbaner</h3>
                  {learningPaths.map((path) => (
                    <Card 
                      key={path.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPath === path.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedPath(path.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{path.title}</h4>
                          <Badge variant="secondary">{path.category}</Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{path.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Fremgang</span>
                            <span>{path.completedSteps} av {path.totalSteps} steg</span>
                          </div>
                          <Progress 
                            value={(path.completedSteps / path.totalSteps) * 100} 
                            className="h-2"
                          />
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {path.estimatedHours}t
                          </span>
                          <span>Nivå: {path.difficulty}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Selected Path Details */}
                <div>
                  {selectedPath && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Steg i læringsbanen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[500px]">
                          <div className="space-y-3">
                            {learningPaths
                              .find(p => p.id === selectedPath)
                              ?.steps.map((step, index) => (
                              <Card key={step.id} className="relative">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      step.completed ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                      {step.completed ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <span className="text-sm font-medium">{index + 1}</span>
                                      )}
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        {getStepIcon(step.type)}
                                        <h5 className="font-medium">{step.title}</h5>
                                        <Badge className={getTypeColor(step.type)}>
                                          {step.type}
                                        </Badge>
                                      </div>
                                      
                                      <p className="text-sm text-gray-600 mb-2">
                                        {step.description}
                                      </p>
                                      
                                      <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>{step.estimatedMinutes} min</span>
                                        <span>Nivå: {step.difficulty}</span>
                                        {step.score && (
                                          <span className="flex items-center gap-1">
                                            <Star className="h-4 w-4 fill-current text-yellow-400" />
                                            {step.score}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      {step.completed ? (
                                        <Button variant="ghost" size="sm">
                                          Gjennomgå
                                        </Button>
                                      ) : (
                                        <Button 
                                          size="sm"
                                          onClick={() => completeStepMutation.mutate({ 
                                            pathId: selectedPath, 
                                            stepId: step.id 
                                          })}
                                          disabled={completeStepMutation.isPending}
                                        >
                                          Start
                                          <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recommendations">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Basert på dine interesser</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Vi anbefaler denne banen basert på dine tidligere aktiviteter
                    </p>
                    <Button variant="outline" className="w-full">
                      Utforsk Dataanalyse for Revisorer
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Populært nå</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Mest populære læringsbane blant dine kolleger
                    </p>
                    <Button variant="outline" className="w-full">
                      Digitale Revisjonsverktøy
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};