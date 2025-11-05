import React from 'react';
import { GraduationCap, BookOpen, PlayCircle, Award, Users, Calendar, MessageSquare, Mic, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AICharacterSimulator from '@/components/Training/AICharacterSimulator'
import { useTrainingProgress, useUserBadges } from '@/hooks/useTraining'
import PageLayout from '@/components/Layout/PageLayout'
import { usePageTitle } from '@/components/Layout/PageTitleContext'

const Academy = () => {
  const { data: userProgress, isLoading: progressLoading } = useTrainingProgress();
  const { data: userBadges, isLoading: badgesLoading } = useUserBadges();
  const { setPageTitle } = usePageTitle();

  React.useEffect(() => {
    setPageTitle('Revisjons Akademiet');
  }, [setPageTitle]);

  const courses = [
    {
      id: 1,
      title: 'Grunnleggende revisjon',
      description: 'Introduksjon til revisjonsstandarer og -prosedyrer',
      duration: '8 timer',
      level: 'Beginner',
      lessons: 12,
      enrolled: 45,
      status: 'available'
    },
    {
      id: 2,
      title: 'Avansert risikostyring',
      description: 'Dyptgående analyse av revisjonsmessige risikoer',
      duration: '12 timer',
      level: 'Avansert',
      lessons: 18,
      enrolled: 23,
      status: 'available'
    },
    {
      id: 3,
      title: 'IT-revisjon og cybersikkerhet',
      description: 'Moderne utfordringer innen teknologi og sikkerhet',
      duration: '6 timer',
      level: 'Midt',
      lessons: 10,
      enrolled: 34,
      status: 'coming-soon'
    },
    {
      id: 4,
      title: 'Regulatoriske endringer 2024',
      description: 'Oppdateringer i regelverk og standarder',
      duration: '4 timer',
      level: 'Alle nivåer',
      lessons: 8,
      enrolled: 67,
      status: 'available'
    }
  ]

  const stats = [
    { label: 'Aktive kurs', value: '12', icon: BookOpen },
    { label: 'Gjennomførte sertifiseringer', value: '234', icon: Award },
    { label: 'Registrerte deltakere', value: '89', icon: Users },
    { label: 'Timer med innhold', value: '156', icon: Calendar }
  ]

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Midt': return 'bg-yellow-100 text-yellow-800'
      case 'Avansert': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const completedSimulations = userProgress?.filter(p => 
    ['ai-character', 'voice-training'].includes(p.module_name) && p.completed_at
  ).length || 0;

  const totalBadges = userBadges?.length || 0;

  if (progressLoading || badgesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster Revisjons Akademiet...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout 
      width="wide" 
      spacing="normal"
      header={
        <div className="flex justify-end gap-2">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2">
            🤖 AI Simulator
          </Badge>
          <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2">
            🎓 Strukturert læring
          </Badge>
        </div>
      }
    >
      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Academy Content */}
      <Tabs defaultValue="ai-simulator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-simulator">
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Simulator
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="w-4 h-4 mr-2" />
            Kurs
          </TabsTrigger>
          <TabsTrigger value="certifications">
            <Award className="w-4 h-4 mr-2" />
            Sertifiseringer
          </TabsTrigger>
          <TabsTrigger value="progress">
            <Star className="w-4 h-4 mr-2" />
            Min progresjon
          </TabsTrigger>
          <TabsTrigger value="webinars">
            <Calendar className="w-4 h-4 mr-2" />
            Webinarer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-simulator">
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-900 flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  AI Oppstartsmøte Simulator
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Tren på oppstartsmøter med AI-drevne klientkarakter. Øv på å stille de riktige spørsmålene 
                  og håndtere ulike personligheter og scenarioer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{completedSimulations}</div>
                    <div className="text-sm text-blue-700">Fullførte simuleringer</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{totalBadges}</div>
                    <div className="text-sm text-purple-700">Opptjente utmerkelser</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">3</div>
                    <div className="text-sm text-green-700">Tilgjengelige karakterer</div>
                  </div>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <MessageSquare className="h-4 w-4" />
                    Chat-modus
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Mic className="h-4 w-4" />
                    Audio-modus
                  </div>
                </div>
              </CardContent>
            </Card>

            <AICharacterSimulator />
          </div>
        </TabsContent>

        <TabsContent value="courses">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Tilgjengelige kurs</h2>
              <div className="flex gap-2">
                <Badge variant="outline">Alle kategorier</Badge>
                <Badge variant="outline">Sorter etter popularitet</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </div>
                      <Badge className={getLevelColor(course.level)}>
                        {course.level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{course.lessons} leksjoner</span>
                        <span>{course.duration}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-1" />
                          {course.enrolled} påmeldte
                        </div>
                        {course.status === 'available' ? (
                          <Button size="sm">Start kurs</Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            Kommer snart
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="certifications">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Tilgjengelige sertifiseringer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Grunnleggende revisjonsekspert</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Fullføre alle grunnkurs og AI-simuleringer
                    </p>
                    <Badge variant="outline">4 uker</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">AI-drevet revisjonsmetodikk</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Spesialisering i moderne verktøy og AI-assistert revisjon
                    </p>
                    <Badge variant="outline">6 uker</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Avansert klientkommunikasjon</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Mestre oppstartsmøter og vanskelige samtaler
                    </p>
                    <Badge variant="outline">3 uker</Badge>
                  </div>
                </div>
                <Button className="w-full mt-4">Se alle sertifiseringer</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Dine utmerkelser
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userBadges && userBadges.length > 0 ? (
                  <div className="space-y-3">
                    {userBadges.slice(0, 5).map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <div className="text-2xl">🏆</div>
                        <div>
                          <h4 className="font-medium text-yellow-800">{badge.badge_name}</h4>
                          <p className="text-xs text-yellow-700">
                            {new Date(badge.earned_at).toLocaleDateString('nb-NO')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {userBadges.length > 5 && (
                      <Button variant="outline" className="w-full">
                        Se alle {userBadges.length} utmerkelser
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Start med AI-simulatoren for å opptjene dine første utmerkelser!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Din læringsreise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>AI Oppstartsmøter</span>
                    <Badge>{completedSimulations}/3 fullført</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(completedSimulations / 3) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Kurser</span>
                    <Badge>2/4 startet</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Sertifiseringer</span>
                    <Badge>0/3 fullført</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anbefalte neste steg</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Fortsett AI-simulator
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Start nytt kurs
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Award className="h-4 w-4 mr-2" />
                    Få første sertifisering
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="webinars">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Kommende webinarer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">AI i revisjon - fremtidens verktøy</h4>
                    <p className="text-sm text-muted-foreground">15. februar 2024, 14:00</p>
                    <Badge className="mt-2">Live webinar</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Effektive oppstartsmøter</h4>
                    <p className="text-sm text-muted-foreground">22. februar 2024, 10:00</p>
                    <Badge className="mt-2">Interaktiv økt</Badge>
                  </div>
                </div>
                <Button className="w-full mt-4">Se alle webinarer</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Opptak tilgjengelig</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Risikovurdering i praksis</h4>
                    <p className="text-sm text-muted-foreground">Spilt inn 8. februar 2024</p>
                    <Badge variant="outline" className="mt-2">45 min</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Nye ISA-standarder 2024</h4>
                    <p className="text-sm text-muted-foreground">Spilt inn 1. februar 2024</p>
                    <Badge variant="outline" className="mt-2">60 min</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">Se alle opptak</Button>
              </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
    </PageLayout>
  )
}

export default Academy
