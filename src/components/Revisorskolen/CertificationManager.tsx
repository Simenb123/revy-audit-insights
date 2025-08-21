import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Award, 
  Star, 
  Clock, 
  CheckCircle, 
  Download,
  Trophy,
  Target,
  BookOpen,
  TrendingUp
} from 'lucide-react';

// Reuse existing data table functionality
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';

// Reuse existing hooks and services
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms';
import { useTrainingSessions } from '@/hooks/useTrainingSessions';
import { useUpdateSessionProgress } from '@/hooks/useTrainingSessions';
import { useToast } from '@/hooks/use-toast';

// Reuse existing export functionality for certificates
import { createDownloadBlob, downloadFile, generateExportFilename } from '@/services/sampling/exportService';

interface CertificationManagerProps {
  userId?: string;
}

interface UserProgress {
  programId: string;
  programName: string;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  totalTimeSpent: number;
  lastActivity: string;
  certificateEligible: boolean;
  certificateIssued?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'completion' | 'excellence' | 'speed' | 'improvement';
  earned: boolean;
  earnedDate?: string;
  progress: number;
  maxProgress: number;
}

const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-session',
    name: 'Første skritt',
    description: 'Fullført din første treningsøkt',
    icon: 'star',
    category: 'completion',
    earned: true,
    earnedDate: '2024-01-15',
    progress: 1,
    maxProgress: 1
  },
  {
    id: 'sampling-master',
    name: 'Utvalgs-mester',
    description: 'Oppnådd 90%+ i alle sampling-moduler',
    icon: 'target',
    category: 'excellence',
    earned: false,
    progress: 3,
    maxProgress: 5
  },
  {
    id: 'speed-demon',
    name: 'Effektivitetshelt',
    description: 'Fullført 5 økter under tidsgrensen',
    icon: 'clock',
    category: 'speed',
    earned: true,
    earnedDate: '2024-01-20',
    progress: 5,
    maxProgress: 5
  },
  {
    id: 'consistent-learner',
    name: 'Stødig student',
    description: 'Fullført treningsøkter 7 dager på rad',
    icon: 'trending-up',
    category: 'improvement',
    earned: false,
    progress: 4,
    maxProgress: 7
  }
];

export const CertificationManager: React.FC<CertificationManagerProps> = ({
  userId
}) => {
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(SAMPLE_ACHIEVEMENTS);
  const [activeTab, setActiveTab] = useState('overview');
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);

  const { data: programs } = useTrainingPrograms();
  const { data: sessions } = useTrainingSessions();
  const updateProgress = useUpdateSessionProgress();
  const { toast } = useToast();

  // Calculate user progress from training data
  useEffect(() => {
    if (programs && sessions) {
      const progressData = programs.map(program => {
        const programSessions = sessions.filter(s => s.program_id === program.id);
        const completedSessions = programSessions.filter(s => 
          // This would come from actual progress data
          Math.random() > 0.3 // Mock completion
        );

        return {
          programId: program.id,
          programName: program.name,
          totalSessions: programSessions.length,
          completedSessions: completedSessions.length,
          averageScore: 85 + Math.random() * 10, // Mock score
          totalTimeSpent: completedSessions.length * 45, // Mock time
          lastActivity: new Date().toISOString(),
          certificateEligible: completedSessions.length >= programSessions.length * 0.8,
          certificateIssued: completedSessions.length >= programSessions.length ? new Date().toISOString() : undefined
        };
      });

      setUserProgress(progressData);
    }
  }, [programs, sessions]);

  const handleGenerateCertificate = async (programId: string, programName: string) => {
    setIsGeneratingCertificate(true);
    
    try {
      // Reuse existing PDF generation patterns
      const certificateData = generateCertificateData(programName);
      const certificateContent = generateCertificatePDF(certificateData);
      
      const blob = createDownloadBlob(certificateContent, 'application/pdf');
      const filename = generateExportFilename(
        `Sertifikat_${programName.replace(/\s+/g, '_')}`,
        'PDF'
      );
      
      downloadFile(blob, filename);
      
      toast({
        title: "Sertifikat generert",
        description: `Sertifikat for ${programName} er lastet ned.`,
      });

      // Update progress to mark certificate as issued
      await updateProgress.mutateAsync({
        sessionId: programId,
        status: 'completed'
      });

    } catch (error) {
      toast({
        title: "Feil ved generering",
        description: "Kunne ikke generere sertifikat. Prøv igjen.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const generateCertificateData = (programName: string) => ({
    recipientName: "Bruker", // Would come from user data
    programName,
    completionDate: new Date().toLocaleDateString('nb-NO'),
    issueDate: new Date().toLocaleDateString('nb-NO'),
    certificateId: `CERT-${Date.now()}`,
    issuer: "Revisorskolen",
    signature: "Digital signatur"
  });

  const generateCertificatePDF = (data: any): string => {
    // Simplified certificate content - in reality would use proper PDF library
    return `
      SERTIFIKAT FOR GJENNOMFØRING
      
      Dette bekrefter at
      ${data.recipientName}
      
      har gjennomført treningsprogrammet
      "${data.programName}"
      
      Fullført: ${data.completionDate}
      Utstedt: ${data.issueDate}
      Sertifikat-ID: ${data.certificateId}
      
      ${data.issuer}
      ${data.signature}
    `;
  };

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'star': return <Star className="h-5 w-5" />;
      case 'target': return <Target className="h-5 w-5" />;
      case 'clock': return <Clock className="h-5 w-5" />;
      case 'trending-up': return <TrendingUp className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  const getAchievementColor = (category: string, earned: boolean) => {
    if (!earned) return 'bg-muted text-muted-foreground';
    
    switch (category) {
      case 'completion': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'excellence': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'speed': return 'bg-green-100 text-green-700 border-green-200';
      case 'improvement': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Reuse existing data table patterns
  const progressColumns: StandardDataTableColumn<UserProgress>[] = [
    {
      key: 'programName',
      header: 'Program',
      accessor: 'programName',
    },
    {
      key: 'progress',
      header: 'Fremgang',
      accessor: 'completedSessions',
      format: (value, row) => (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{value} av {row.totalSessions} fullført</span>
            <span>{Math.round((value / row.totalSessions) * 100)}%</span>
          </div>
          <Progress value={(value / row.totalSessions) * 100} className="h-2" />
        </div>
      )
    },
    {
      key: 'averageScore',
      header: 'Gjennomsnittsscore',
      accessor: 'averageScore',
      format: (value) => `${Math.round(value)}%`,
      align: 'right'
    },
    {
      key: 'totalTimeSpent',
      header: 'Tid brukt',
      accessor: 'totalTimeSpent',
      format: (value) => `${Math.round(value / 60)}t ${value % 60}m`,
      align: 'right'
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'certificateEligible',
      format: (eligible, row) => (
        <div className="flex items-center gap-2">
          {row.certificateIssued ? (
            <Badge className="bg-green-100 text-green-700">
              <Trophy className="h-3 w-3 mr-1" />
              Sertifisert
            </Badge>
          ) : eligible ? (
            <Badge className="bg-blue-100 text-blue-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Klar for sertifikat
            </Badge>
          ) : (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              I progresjon
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Handlinger',
      accessor: 'programId',
      format: (programId, row) => (
        <Button
          size="sm"
          disabled={!row.certificateEligible || !!row.certificateIssued || isGeneratingCertificate}
          onClick={() => handleGenerateCertificate(programId, row.programName)}
        >
          <Download className="h-3 w-3 mr-1" />
          {row.certificateIssued ? 'Utstedt' : 'Generer sertifikat'}
        </Button>
      )
    }
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const inProgressAchievements = achievements.filter(a => !a.earned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Sertifisering og utvikling
          </CardTitle>
          <CardDescription>
            Følg med på din læringsprogresjon og oppnå sertifiseringer
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="achievements">Utmerkelser</TabsTrigger>
          <TabsTrigger value="certificates">Sertifikater</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {userProgress.reduce((sum, p) => sum + p.completedSessions, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Fullførte økter</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        userProgress.reduce((sum, p) => sum + p.averageScore, 0) / 
                        (userProgress.length || 1)
                      )}%
                    </div>
                    <div className="text-sm text-muted-foreground">Gj.snitt score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        userProgress.reduce((sum, p) => sum + p.totalTimeSpent, 0) / 60
                      )}t
                    </div>
                    <div className="text-sm text-muted-foreground">Total tid</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">{earnedAchievements.length}</div>
                    <div className="text-sm text-muted-foreground">Utmerkelser</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Table */}
          <Card>
            <CardHeader>
              <CardTitle>Programfremgang</CardTitle>
              <CardDescription>
                Oversikt over din fremgang i alle treningsprogrammer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardDataTable
                data={userProgress}
                columns={progressColumns}
                tableName="training-progress"
                title="Læringsprogresjon"
                enableExport={false}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Earned Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Oppnådde utmerkelser ({earnedAchievements.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {earnedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border ${getAchievementColor(achievement.category, true)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-white/50">
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm opacity-80 mt-1">{achievement.description}</p>
                        {achievement.earnedDate && (
                          <p className="text-xs opacity-60 mt-2">
                            Oppnådd: {new Date(achievement.earnedDate).toLocaleDateString('nb-NO')}
                          </p>
                        )}
                      </div>
                      <CheckCircle className="h-5 w-5 text-current" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Under arbeid ({inProgressAchievements.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inProgressAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border ${getAchievementColor(achievement.category, false)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-white/50">
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm opacity-80 mt-1">{achievement.description}</p>
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{achievement.progress} av {achievement.maxProgress}</span>
                            <span>{Math.round((achievement.progress / achievement.maxProgress) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.maxProgress) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mine sertifikater</CardTitle>
              <CardDescription>
                Last ned og administrer dine oppnådde sertifikater
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProgress.map((progress) => (
                  <div
                    key={progress.programId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        progress.certificateIssued 
                          ? 'bg-green-100 text-green-600' 
                          : progress.certificateEligible 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{progress.programName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {progress.certificateIssued 
                            ? `Sertifikat utstedt ${new Date(progress.certificateIssued).toLocaleDateString('nb-NO')}`
                            : progress.certificateEligible 
                            ? 'Klar for sertifisering'
                            : `${progress.completedSessions}/${progress.totalSessions} økter fullført`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {progress.certificateIssued ? (
                        <Button
                          size="sm"
                          onClick={() => handleGenerateCertificate(progress.programId, progress.programName)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Last ned
                        </Button>
                      ) : progress.certificateEligible ? (
                        <Button
                          size="sm"
                          onClick={() => handleGenerateCertificate(progress.programId, progress.programName)}
                          disabled={isGeneratingCertificate}
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          {isGeneratingCertificate ? 'Genererer...' : 'Få sertifikat'}
                        </Button>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Ikke ferdig
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};