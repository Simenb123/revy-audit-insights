import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Settings, User, Bell, Book, Target, 
  Palette, Volume2, Clock, Shield 
} from 'lucide-react';
import { toast } from 'sonner';

interface UserPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced' | 'adaptive';
  sessionDuration: number; // minutes
  notificationsEnabled: boolean;
  emailDigest: boolean;
  weeklyGoal: number; // hours
  interests: string[];
  preferredLanguage: 'no' | 'en';
  darkMode: boolean;
  soundEffects: boolean;
  autoProgress: boolean;
}

export const UserPreferences = () => {
  const queryClient = useQueryClient();

  // Reuse existing query patterns for user data
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      // Simulate fetching user preferences - would integrate with existing profile system
      return {
        learningStyle: 'visual',
        difficultyPreference: 'intermediate',
        sessionDuration: 45,
        notificationsEnabled: true,
        emailDigest: true,
        weeklyGoal: 5,
        interests: ['ISA Standards', 'Risk Assessment', 'Data Analytics'],
        preferredLanguage: 'no',
        darkMode: false,
        soundEffects: true,
        autoProgress: false
      } as UserPreferences;
    }
  });

  // Reuse existing mutation patterns
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      // Simulate updating preferences - would integrate with existing user management
      await new Promise(resolve => setTimeout(resolve, 500));
      return { ...preferences, ...newPreferences };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['personalized-learning-paths'] });
      toast.success('Preferanser oppdatert');
    }
  });

  const availableInterests = [
    'ISA Standards', 'Risk Assessment', 'Internal Controls', 'Data Analytics',
    'Ethics', 'Sampling', 'Documentation', 'Client Communication',
    'Fraud Detection', 'Financial Reporting', 'IT Audit', 'Quality Control'
  ];

  const handlePreferenceUpdate = (key: keyof UserPreferences, value: any) => {
    updatePreferencesMutation.mutate({ [key]: value });
  };

  const toggleInterest = (interest: string) => {
    if (!preferences) return;
    
    const currentInterests = preferences.interests;
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    
    handlePreferenceUpdate('interests', newInterests);
  };

  if (isLoading || !preferences) {
    return <div>Laster preferanser...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Brukerpreferanser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="learning" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="learning">Læring</TabsTrigger>
              <TabsTrigger value="notifications">Varsler</TabsTrigger>
              <TabsTrigger value="interests">Interesser</TabsTrigger>
              <TabsTrigger value="appearance">Utseende</TabsTrigger>
            </TabsList>
            
            <TabsContent value="learning" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Book className="h-5 w-5" />
                    Læringspreferanser
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Learning Style */}
                  <div className="space-y-3">
                    <Label>Foretrukken læringsstil</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'visual', label: 'Visuell', icon: '👁️' },
                        { value: 'auditory', label: 'Auditiv', icon: '👂' },
                        { value: 'kinesthetic', label: 'Kinestetisk', icon: '✋' },
                        { value: 'reading', label: 'Lesing', icon: '📖' }
                      ].map((style) => (
                        <Button
                          key={style.value}
                          variant={preferences.learningStyle === style.value ? 'default' : 'outline'}
                          onClick={() => handlePreferenceUpdate('learningStyle', style.value)}
                          className="h-auto flex-col p-4"
                        >
                          <span className="text-2xl mb-2">{style.icon}</span>
                          <span className="text-sm">{style.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Preference */}
                  <div className="space-y-3">
                    <Label>Foretrukket vanskelighetsgrad</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'beginner', label: 'Nybegynner' },
                        { value: 'intermediate', label: 'Middels' },
                        { value: 'advanced', label: 'Avansert' },
                        { value: 'adaptive', label: 'Adaptiv' }
                      ].map((level) => (
                        <Button
                          key={level.value}
                          variant={preferences.difficultyPreference === level.value ? 'default' : 'outline'}
                          onClick={() => handlePreferenceUpdate('difficultyPreference', level.value)}
                        >
                          {level.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Session Duration */}
                  <div className="space-y-3">
                    <Label>Foretrukken øktelengde: {preferences.sessionDuration} minutter</Label>
                    <Slider
                      value={[preferences.sessionDuration]}
                      onValueChange={([value]) => handlePreferenceUpdate('sessionDuration', value)}
                      min={15}
                      max={120}
                      step={15}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>15 min</span>
                      <span>60 min</span>
                      <span>120 min</span>
                    </div>
                  </div>

                  {/* Weekly Goal */}
                  <div className="space-y-3">
                    <Label>Ukentlig mål: {preferences.weeklyGoal} timer</Label>
                    <Slider
                      value={[preferences.weeklyGoal]}
                      onValueChange={([value]) => handlePreferenceUpdate('weeklyGoal', value)}
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Auto Progress */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Automatisk fremgang</Label>
                      <p className="text-sm text-gray-500">
                        Gå automatisk til neste steg etter fullføring
                      </p>
                    </div>
                    <Switch
                      checked={preferences.autoProgress}
                      onCheckedChange={(checked) => handlePreferenceUpdate('autoProgress', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5" />
                    Varslingsinnstillinger
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Push-varsler</Label>
                      <p className="text-sm text-gray-500">
                        Få varsler om nye kurs og fremgang
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notificationsEnabled}
                      onCheckedChange={(checked) => handlePreferenceUpdate('notificationsEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Ukentlig e-post sammendrag</Label>
                      <p className="text-sm text-gray-500">
                        Få et sammendrag av din fremgang hver uke
                      </p>
                    </div>
                    <Switch
                      checked={preferences.emailDigest}
                      onCheckedChange={(checked) => handlePreferenceUpdate('emailDigest', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5" />
                    Interesseområder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Velg dine interesseområder for å få personaliserte anbefalinger
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableInterests.map((interest) => (
                      <Badge
                        key={interest}
                        variant={preferences.interests.includes(interest) ? 'default' : 'outline'}
                        className="cursor-pointer p-3 justify-center text-center"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Valgte interesser:</strong> {preferences.interests.join(', ')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="h-5 w-5" />
                    Utseende og lyd
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Mørkt tema</Label>
                      <p className="text-sm text-gray-500">
                        Bruk mørkt tema i applikasjonen
                      </p>
                    </div>
                    <Switch
                      checked={preferences.darkMode}
                      onCheckedChange={(checked) => handlePreferenceUpdate('darkMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Lydeffekter
                      </Label>
                      <p className="text-sm text-gray-500">
                        Spill av lyder for handlinger og belønninger
                      </p>
                    </div>
                    <Switch
                      checked={preferences.soundEffects}
                      onCheckedChange={(checked) => handlePreferenceUpdate('soundEffects', checked)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Språk</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={preferences.preferredLanguage === 'no' ? 'default' : 'outline'}
                        onClick={() => handlePreferenceUpdate('preferredLanguage', 'no')}
                      >
                        Norsk
                      </Button>
                      <Button
                        variant={preferences.preferredLanguage === 'en' ? 'default' : 'outline'}
                        onClick={() => handlePreferenceUpdate('preferredLanguage', 'en')}
                      >
                        English
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};