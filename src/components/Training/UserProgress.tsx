
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp,
  Award,
  Star,
  Calendar
} from 'lucide-react';

interface TrainingProgressItem {
  id: string;
  scenario_id: string;
  module_name: string;
  completed_at?: string;
  score?: number;
  max_score?: number;
  attempts: number;
}

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  description?: string;
  earned_at: string;
  points_earned?: number;
}

interface UserProgressProps {
  userProgress?: TrainingProgressItem[];
  userBadges?: UserBadge[];
}

const UserProgress = ({ userProgress = [], userBadges = [] }: UserProgressProps) => {
  // Calculate statistics
  const totalPoints = userBadges.reduce((sum, badge) => sum + (badge.points_earned || 0), 0);
  const currentLevel = Math.floor(totalPoints / 100) + 1;
  const pointsToNextLevel = (currentLevel * 100) - totalPoints;
  const levelProgress = ((totalPoints % 100) / 100) * 100;

  const completedModules = userProgress.filter(p => p.completed_at).length;
  const totalModules = 5; // Total number of modules available
  const averageScore = userProgress.filter(p => p.score && p.completed_at)
    .reduce((sum, p, _, arr) => sum + (p.score || 0) / arr.length, 0);

  // Group badges by type
  const badgesByType = userBadges.reduce((acc, badge) => {
    if (!acc[badge.badge_type]) acc[badge.badge_type] = [];
    acc[badge.badge_type].push(badge);
    return acc;
  }, {} as Record<string, UserBadge[]>);

  // Define activity type interfaces
  interface ModuleActivity {
    type: 'module_completed';
    date: string;
    title: string;
    score?: number;
  }

  interface BadgeActivity {
    type: 'badge_earned';
    date: string;
    title: string;
    points?: number;
  }

  type Activity = ModuleActivity | BadgeActivity;

  // Recent activities
  const recentActivities: Activity[] = [
    ...userProgress.filter(p => p.completed_at).map(p => ({
      type: 'module_completed' as const,
      date: p.completed_at!,
      title: `Fullførte ${p.module_name}`,
      score: p.score
    })),
    ...userBadges.map(badge => ({
      type: 'badge_earned' as const,
      date: badge.earned_at,
      title: `Opptjente "${badge.badge_name}"`,
      points: badge.points_earned
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Level and Progress */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-900">
            <Star className="h-5 w-5" />
            Ditt nivå og progresjon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">Nivå {currentLevel}</div>
              <p className="text-yellow-700">Ditt nåværende nivå</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{totalPoints}</div>
              <p className="text-orange-700">Totale poeng</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{pointsToNextLevel}</div>
              <p className="text-red-700">Poeng til neste nivå</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progresjon til nivå {currentLevel + 1}</span>
              <span>{Math.round(levelProgress)}%</span>
            </div>
            <Progress value={levelProgress} className="bg-yellow-200" />
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Moduler fullført</p>
              <p className="text-xl font-bold">{completedModules}/{totalModules}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Gjennomsnittsscore</p>
              <p className="text-xl font-bold">{Math.round(averageScore)}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Trophy className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Badges opptjent</p>
              <p className="text-xl font-bold">{userBadges.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Collection */}
      {Object.keys(badgesByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Dine utmerkelser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(badgesByType).map(([type, badges]) => (
                <div key={type}>
                  <h4 className="font-medium mb-2 capitalize">{type.replace('_', ' ')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {badges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <Award className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{badge.badge_name}</h5>
                          <p className="text-xs text-gray-600">{badge.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(badge.earned_at).toLocaleDateString('no-NO')}
                          </p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          +{badge.points_earned}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Nylig aktivitet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'module_completed' 
                      ? 'bg-green-100' 
                      : 'bg-yellow-100'
                  }`}>
                    {activity.type === 'module_completed' ? (
                      <Target className="h-4 w-4 text-green-600" />
                    ) : (
                      <Trophy className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(activity.date).toLocaleDateString('no-NO', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {activity.type === 'module_completed' && activity.score && (
                    <Badge variant="outline">{activity.score}% score</Badge>
                  )}
                  {activity.type === 'badge_earned' && activity.points && (
                    <Badge className="bg-yellow-100 text-yellow-800">+{activity.points} poeng</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Ingen aktivitet ennå. Start din første læringsmodul!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProgress;
