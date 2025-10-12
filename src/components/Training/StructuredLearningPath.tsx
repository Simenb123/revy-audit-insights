
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, CheckCircle, Lock, Play, Trophy, BookOpen } from 'lucide-react';
import { useLearningPaths, useUserEnrollments, useCompleteModule } from '@/hooks/useLearningPaths';
import { format, addDays, differenceInDays } from 'date-fns';
import { nb } from 'date-fns/locale';

const StructuredLearningPath = () => {
  const { data: learningPaths, isLoading: pathsLoading } = useLearningPaths();
  const { data: enrollments, isLoading: enrollmentsLoading } = useUserEnrollments();
  const { mutate: completeModule } = useCompleteModule();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  if (pathsLoading || enrollmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster opplæringsprogrammer...</p>
        </div>
      </div>
    );
  }

  const activeEnrollment = enrollments?.find(e => e.status === 'active');
  const currentPath = learningPaths?.find(p => p.id === activeEnrollment?.learning_path_id);

  // Calculate progress
  const calculateProgress = (enrollment: any) => {
    if (!enrollment || !currentPath) return 0;
    const totalModules = currentPath.learning_path_modules?.length || 0;
    const completedModules = enrollment.user_module_completions?.length || 0;
    return totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  };

  const isModuleUnlocked = (module: any, enrollment: any) => {
    if (!enrollment) return false;
    const startDate = new Date(enrollment.start_date);
    const unlockDate = addDays(startDate, module.unlock_after_days || 0);
    return new Date() >= unlockDate;
  };

  const isModuleCompleted = (moduleId: string, enrollment: any) => {
    return enrollment?.user_module_completions?.some((c: any) => c.module_id === moduleId);
  };

  const handleCompleteModule = (moduleId: string) => {
    if (!activeEnrollment) return;
    
    completeModule({
      enrollment_id: activeEnrollment.id,
      module_id: moduleId,
      score: 85, // Mock score for now
      time_spent_minutes: 120 // Mock time
    });
  };

  if (!activeEnrollment && learningPaths && learningPaths.length > 0) {
    // Show available programs to enroll in
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Tilgjengelige Opplæringsprogrammer</h2>
          <p className="text-muted-foreground">
            Strukturerte læringsbaner for din profesjonelle utvikling
          </p>
        </div>

        <div className="grid gap-4">
          {learningPaths.map((path) => (
            <Card key={path.id} className="border-2 hover:border-brand-border transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-brand-primary-hover" />
                      {path.name}
                    </CardTitle>
                    <p className="text-muted-foreground">{path.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {path.is_mandatory && (
                      <Badge variant="destructive">Obligatorisk</Badge>
                    )}
                    {path.certification_required && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Trophy className="w-3 h-3 mr-1" />
                        Sertifisering
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{path.duration_weeks} uker</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {path.learning_path_modules?.reduce((acc: number, mod: any) => acc + (mod.estimated_hours || 0), 0)} timer
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{path.learning_path_modules?.length || 0} moduler</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Min. {path.minimum_score}% score</span>
                  </div>
                </div>
                
                <Button 
                  variant="brand"
                  className="w-full"
                  onClick={() => setSelectedPath(path.id)}
                >
                  Se Programdetaljer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!activeEnrollment || !currentPath) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen aktiv påmelding funnet</p>
      </div>
    );
  }

  const progress = calculateProgress(activeEnrollment);
  const daysLeft = differenceInDays(new Date(activeEnrollment.target_completion_date), new Date());

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <Card className="bg-gradient-to-r from-brand-surface to-blue-50 border-brand-surface-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-brand-text-muted flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                {currentPath.name}
              </CardTitle>
              <p className="text-brand-primary-hover mt-2">{currentPath.description}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-brand-surface text-brand-text-muted mb-2">
                {activeEnrollment.status === 'active' ? 'Aktiv' : activeEnrollment.status}
              </Badge>
              <div className="text-sm text-muted-foreground">
                {daysLeft > 0 ? `${daysLeft} dager igjen` : 'Forfalt'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Totalt fremgang</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start: {format(new Date(activeEnrollment.start_date), 'dd. MMM yyyy', { locale: nb })}</span>
              <span>Mål: {format(new Date(activeEnrollment.target_completion_date), 'dd. MMM yyyy', { locale: nb })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Modules */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Ukentlige Moduler</h3>
        <div className="grid gap-4">
          {currentPath.learning_path_modules
            ?.sort((a: any, b: any) => a.week_number - b.week_number)
            .map((module: any) => {
              const isUnlocked = isModuleUnlocked(module, activeEnrollment);
              const isCompleted = isModuleCompleted(module.id, activeEnrollment);
              
              return (
                <Card 
                  key={module.id} 
                  className={`transition-all ${
                    isCompleted ? 'border-green-200 bg-green-50' : 
                    isUnlocked ? 'border-brand-surface-hover hover:border-brand-border' : 
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isUnlocked ? 'bg-brand-primary text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : isUnlocked ? (
                            <Play className="w-5 h-5" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{module.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {module.estimated_hours} timer
                        </div>
                        {!isUnlocked && (
                          <div className="text-xs text-orange-600 mt-1">
                            Låses opp {format(addDays(new Date(activeEnrollment.start_date), module.unlock_after_days), 'dd. MMM', { locale: nb })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          Uke {module.week_number}
                        </Badge>
                        {module.is_mandatory && (
                          <Badge variant="destructive" className="text-xs">
                            Obligatorisk
                          </Badge>
                        )}
                      </div>
                      {isUnlocked && !isCompleted && (
                        <Button 
                          onClick={() => handleCompleteModule(module.id)}
                          variant="brand"
                        >
                          Start Modul
                        </Button>
                      )}
                      {isCompleted && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Fullført
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Certification Status */}
      {progress >= 100 && !activeEnrollment.certification_earned && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Klar for Sertifisering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              Du har fullført alle moduler! Kontakt din leder for å få utstedt sertifikat.
            </p>
          </CardContent>
        </Card>
      )}

      {activeEnrollment.certification_earned && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Sertifikat Utstedt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              Gratulerer! Du har fullført {currentPath.name} og mottatt sertifikat.
            </p>
            <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
              Last ned Sertifikat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StructuredLearningPath;
