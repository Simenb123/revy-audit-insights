
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Trophy, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Plus,
  Download,
  Search,
  Calendar
} from 'lucide-react';
import { useTeamEnrollments, useCreateEnrollment, useIssueCertification } from '@/hooks/useLearningPaths';
import { format, differenceInDays } from 'date-fns';
import { nb } from 'date-fns/locale';

const ManagerDashboard = () => {
  const { data: teamEnrollments, isLoading } = useTeamEnrollments();
  const { mutate: createEnrollment } = useCreateEnrollment();
  const { mutate: issueCertification } = useIssueCertification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster team-oversikt...</p>
        </div>
      </div>
    );
  }

  const filteredEnrollments = teamEnrollments?.filter(enrollment => {
    const profile = enrollment.profiles;
    if (!profile) return false;
    
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
    const email = profile.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search);
  }) || [];

  // Calculate statistics
  const stats = {
    totalEnrolled: filteredEnrollments.length,
    completed: filteredEnrollments.filter(e => e.status === 'completed').length,
    inProgress: filteredEnrollments.filter(e => e.status === 'active').length,
    overdue: filteredEnrollments.filter(e => {
      const daysLeft = differenceInDays(new Date(e.target_completion_date), new Date());
      return daysLeft < 0 && e.status === 'active';
    }).length,
    needsCertification: filteredEnrollments.filter(e => {
      const progress = calculateProgress(e);
      return progress >= 100 && !e.certification_earned;
    }).length
  };

  function calculateProgress(enrollment: any) {
    if (!enrollment.learning_paths?.learning_path_modules) return 0;
    const totalModules = enrollment.learning_paths.learning_path_modules.length;
    const completedModules = enrollment.user_module_completions?.length || 0;
    return totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  }

  const handleIssueCertificate = (enrollment: any) => {
    const finalScore = 85; // This should be calculated from actual module scores
    issueCertification({
      enrollment_id: enrollment.id,
      user_id: enrollment.user_id,
      learning_path_id: enrollment.learning_path_id,
      final_score: finalScore
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leder Dashboard</h2>
          <p className="text-muted-foreground">
            Oversikt over teamets opplæringsprogresjon
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="brand">
              <Plus className="w-4 h-4 mr-2" />
              Meld på ansatt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Meld på ansatt i opplæringsprogram</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="E-post til ansatt" />
              <Button variant="brand" className="w-full">
                Send påmelding
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Totalt påmeldt</p>
                <p className="text-xl font-bold">{stats.totalEnrolled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pågående</p>
                <p className="text-xl font-bold">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Fullført</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Forsinket</p>
                <p className="text-xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Trenger sertifikat</p>
                <p className="text-xl font-bold">{stats.needsCertification}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Søk etter ansatt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Eksporter rapport
        </Button>
      </div>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Påmeldinger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEnrollments.map((enrollment) => {
              const profile = enrollment.profiles;
              if (!profile) return null;
              
              const progress = calculateProgress(enrollment);
              const daysLeft = differenceInDays(new Date(enrollment.target_completion_date), new Date());
              const isOverdue = daysLeft < 0 && enrollment.status === 'active';
              
              return (
                <div 
                  key={enrollment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center">
                      <span className="text-brand-primary-active font-medium">
                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {profile.first_name} {profile.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {enrollment.learning_paths?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right min-w-[120px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{Math.round(progress)}%</span>
                        <Progress value={progress} className="w-16 h-2" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isOverdue ? (
                          <span className="text-red-600">Forsinket {Math.abs(daysLeft)} dager</span>
                        ) : enrollment.status === 'completed' ? (
                          <span className="text-green-600">Fullført</span>
                        ) : (
                          <span>{daysLeft} dager igjen</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant={
                        enrollment.status === 'completed' ? 'default' :
                        enrollment.status === 'active' ? 'secondary' : 'outline'
                      }>
                        {enrollment.status === 'completed' ? 'Fullført' :
                         enrollment.status === 'active' ? 'Aktiv' : enrollment.status}
                      </Badge>
                      
                      {enrollment.certification_earned && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Trophy className="w-3 h-3 mr-1" />
                          Sertifisert
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {progress >= 100 && !enrollment.certification_earned && (
                        <Button 
                          size="sm"
                          onClick={() => handleIssueCertificate(enrollment)}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <Trophy className="w-3 h-3 mr-1" />
                          Utstede sertifikat
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedEnrollment(enrollment)}
                      >
                        Detaljer
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredEnrollments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Ingen påmeldinger funnet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      {selectedEnrollment && (
        <Dialog open={!!selectedEnrollment} onOpenChange={() => setSelectedEnrollment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Detaljer for {selectedEnrollment.profiles?.first_name} {selectedEnrollment.profiles?.last_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start dato</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEnrollment.start_date), 'dd. MMM yyyy', { locale: nb })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Måldato</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEnrollment.target_completion_date), 'dd. MMM yyyy', { locale: nb })}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Modulprogresjon</label>
                <div className="mt-2 space-y-2">
                  {selectedEnrollment.learning_paths?.learning_path_modules?.map((module: any) => {
                    const isCompleted = selectedEnrollment.user_module_completions?.some(
                      (c: any) => c.module_id === module.id
                    );
                    
                    return (
                      <div key={module.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{module.name}</span>
                        {isCompleted ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Fullført
                          </Badge>
                        ) : (
                          <Badge variant="outline">Ikke startet</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ManagerDashboard;
