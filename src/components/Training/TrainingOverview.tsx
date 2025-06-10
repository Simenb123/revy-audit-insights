
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Target, 
  Users,
  TrendingUp,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrainingOverviewProps {
  userProgress: any[];
  userBadges: any[];
}

const TrainingOverview = ({ userProgress, userBadges }: TrainingOverviewProps) => {
  const navigate = useNavigate();

  const modules = [
    {
      id: 'risikovurdering',
      title: 'Risikovurdering',
      description: 'Lær å identifisere og vurdere revisjonsrisiko',
      icon: Target,
      difficulty: 'Middels',
      estimatedTime: '30 min',
      color: 'bg-red-100 text-red-600'
    },
    {
      id: 'materialitet',
      title: 'Materialitetsberegning',
      description: 'Forstå og beregne materialitet i revisjon',
      icon: TrendingUp,
      difficulty: 'Lett',
      estimatedTime: '20 min',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'testing',
      title: 'Revisjonstesting',
      description: 'Praktiske øvelser i revisjonstesting',
      icon: CheckCircle,
      difficulty: 'Vanskelig',
      estimatedTime: '45 min',
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'dokumentasjon',
      title: 'Dokumentasjon',
      description: 'Revisjonsnotater og arbeidspapirer',
      icon: BookOpen,
      difficulty: 'Lett',
      estimatedTime: '25 min',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'konklusjon',
      title: 'Konklusjon og rapportering',
      description: 'Utforme revisjonsberetning og konklusjoner',
      icon: Award,
      difficulty: 'Middels',
      estimatedTime: '35 min',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  const getModuleStatus = (moduleId: string) => {
    const progress = userProgress?.find(p => p.module_name === moduleId);
    if (progress?.completed_at) return 'completed';
    if (progress) return 'in-progress';
    return 'not-started';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Play className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Fullført</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">Pågår</Badge>;
      default:
        return <Badge variant="outline">Ikke startet</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Learning Modules */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Læringsmoduler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const status = getModuleStatus(module.id);
            const IconComponent = module.icon;
            
            return (
              <Card key={module.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-full ${module.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    {getStatusIcon(status)}
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <p className="text-sm text-gray-600">{module.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {module.estimatedTime}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {module.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(status)}
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/training/module/${module.id}`)}
                      className="bg-revio-500 hover:bg-revio-600"
                    >
                      {status === 'completed' ? 'Gjenta' : status === 'in-progress' ? 'Fortsett' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Badges */}
      {userBadges && userBadges.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Nylige utmerkelser</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userBadges.slice(0, 3).map((badge) => (
              <Card key={badge.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{badge.badge_name}</h3>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(badge.earned_at).toLocaleDateString('no-NO')}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    +{badge.points_earned} poeng
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start Guide */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="h-5 w-5" />
            Kom i gang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p>Velg et scenario å jobbe med</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>Start med risikovurdering for å lære grunnleggende konsepter</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>Fullfør quiz og interaktive øvelser for å opptjene poeng</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p>Samle badges og bygg opp din revisjonsekspertise</p>
            </div>
          </div>
          <Button 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/training/scenarios')}
          >
            Velg scenario og start læringen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingOverview;
