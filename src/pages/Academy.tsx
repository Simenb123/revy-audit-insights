import { GraduationCap, BookOpen, PlayCircle, Award, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const Academy = () => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Revisjons Akademiet
          </h1>
          <p className="text-muted-foreground mt-2">
            Profesjonell utvikling og opplæring for revisorer
          </p>
        </div>
        <Button>
          <PlayCircle className="h-4 w-4 mr-2" />
          Start nytt kurs
        </Button>
      </div>

      {/* Stats */}
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

      {/* Course Grid */}
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

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Sertifiseringer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Få anerkjente sertifiseringer som dokumenterer din kompetanse
            </p>
            <Button variant="outline">Se sertifiseringer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Planlagte webinarer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Delta på live-webinarer med eksperter og kollegaer
            </p>
            <Button variant="outline">Se kalender</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Academy