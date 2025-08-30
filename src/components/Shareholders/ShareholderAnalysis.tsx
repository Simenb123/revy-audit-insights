import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart, Building, Users, PieChart, TrendingUp, Search, Filter } from 'lucide-react'

interface ShareholderAnalysisProps {
  year: number
}

export function ShareholderAnalysis({ year }: ShareholderAnalysisProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)

  const analysisTypes = [
    {
      id: 'ownership-structure',
      title: 'Eierstruktur Analyse',
      description: 'Analyser eierkonsentrasjon og eierfordeling',
      icon: PieChart,
      available: false
    },
    {
      id: 'top-shareholders',
      title: 'Største Aksjonærer',
      description: 'Identifiser de største eierne per selskap',
      icon: TrendingUp,
      available: false
    },
    {
      id: 'cross-ownership',
      title: 'Krysseierskap',
      description: 'Finn selskaper som eier hverandre',
      icon: Building,
      available: false
    },
    {
      id: 'entity-analysis',
      title: 'Eier Analyse',
      description: 'Analyser eiere på tvers av selskaper',
      icon: Users,
      available: false
    }
  ]

  return (
    <div className="space-y-6">
      <Alert>
        <BarChart className="h-4 w-4" />
        <AlertDescription>
          Analysefunksjonalitet vil være tilgjengelig etter vellykket dataimporing. 
          Last opp aksjonærdata først for å aktivere analyser.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysisTypes.map((analysis) => {
          const Icon = analysis.icon
          return (
            <Card 
              key={analysis.id} 
              className={`cursor-pointer transition-colors ${
                selectedAnalysis === analysis.id 
                  ? 'ring-2 ring-primary' 
                  : analysis.available 
                    ? 'hover:bg-muted/50' 
                    : 'opacity-50'
              }`}
              onClick={() => analysis.available && setSelectedAnalysis(analysis.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <CardTitle className="text-lg">{analysis.title}</CardTitle>
                  </div>
                  <Badge variant={analysis.available ? 'default' : 'secondary'}>
                    {analysis.available ? 'Tilgjengelig' : 'Kommer snart'}
                  </Badge>
                </div>
                <CardDescription>
                  {analysis.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Analyseår: {year}
                  </div>
                  {analysis.available ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAnalysis(analysis.id)
                      }}
                    >
                      Start analyse
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Ikke tilgjengelig ennå
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Future Analysis Results Area */}
      {selectedAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Analyseresultater
            </CardTitle>
            <CardDescription>
              Resultater for valgt analyse vil vises her
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Analysefunksjonalitet er under utvikling</p>
              <p className="text-sm">Kommer i neste versjon</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}