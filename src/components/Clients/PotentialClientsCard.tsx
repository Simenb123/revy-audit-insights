import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, UserX, TrendingUp, ExternalLink } from 'lucide-react'
import { usePotentialClientsSummary } from '@/hooks/usePotentialClients'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Link } from 'react-router-dom'

export function PotentialClientsCard() {
  const { data: userProfile } = useUserProfile()
  // For now, we'll need to implement auditor org number lookup separately
  const auditorOrgNumber: string | undefined = undefined // TODO: Get from audit firm lookup
  
  const { data: summary, isLoading } = usePotentialClientsSummary(auditorOrgNumber)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Potensielle klienter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Potensielle klienter
          </CardTitle>
          <CardDescription>
            Ingen data tilgjengelig
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalActivity = summary.total_potential + summary.converted_count + summary.lost_count

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Potensielle klienter
        </CardTitle>
        <CardDescription>
          Oversikt over selskaper som er registrert med ditt firma som revisor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aktive potensielle</span>
              <Badge variant="secondary" className="flex items-center gap-1">
                <UserPlus className="h-3 w-3" />
                {summary.total_potential}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nye denne måneden</span>
              <Badge variant="default" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {summary.new_this_month}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Konvertert til klienter</span>
              <Badge variant="success" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {summary.converted_count}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tapte/byttet revisor</span>
              <Badge variant="destructive" className="flex items-center gap-1">
                <UserX className="h-3 w-3" />
                {summary.lost_count}
              </Badge>
            </div>
          </div>
        </div>

        {totalActivity > 0 && (
          <div className="pt-2 border-t">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/potential-clients">
                <ExternalLink className="mr-2 h-4 w-4" />
                Se alle potensielle klienter
              </Link>
            </Button>
          </div>
        )}
        
        {summary.total_potential === 0 && totalActivity === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Ingen potensielle klienter funnet ennå.</p>
            <p className="text-xs mt-1">Bruk bulk-søk for å finne selskaper registrert med ditt firma som revisor.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}