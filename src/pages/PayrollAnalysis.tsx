import React from 'react'
import { useParams } from 'react-router-dom'
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth'
import StandardPageLayout from '@/components/Layout/StandardPageLayout'
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout'
import PageHeader from '@/components/Layout/PageHeader'
import StickyClientLayout from '@/components/Layout/StickyClientLayout'
import { useClientDetails } from '@/hooks/useClientDetails'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

const PayrollAnalysis = () => {
  const { clientId } = useParams<{ clientId: string }>()
  const { data: client } = useClientDetails(clientId || '')
  const { setSelectedClientId } = useFiscalYear()

  React.useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id)
    }
  }, [client?.id, setSelectedClientId])

  if (!clientId) {
    return (
      <ResponsiveLayout>
        <ConstrainedWidth width="full">
          <StandardPageLayout>
            <div className="text-center py-8">
              <p className="text-muted-foreground">Ingen klient valgt</p>
            </div>
          </StandardPageLayout>
        </ConstrainedWidth>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout>
      <ConstrainedWidth width="full">
        <StickyClientLayout 
          clientName={client?.name || ''} 
          orgNumber={client?.org_number}
          pageTitle="Lønnsanalyse"
        >
          <StandardPageLayout
            header={
              <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/clients/${clientId}/payroll`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Tilbake til lønn
                  </Link>
                </Button>
                <PageHeader 
                  title="Lønnsanalyse"
                  subtitle="Detaljerte analyser av lønnsdata"
                />
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Key Metrics */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total lønnssum</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    For valgt periode
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Antall ansatte</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Aktive ansatte
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gjennomsnittlønn</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Per måned
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Endring</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Fra forrige periode
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lønnsutvikling over tid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Grafikk vil vises her når A07 data er tilgjengelig
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lønnsfordeling</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Fordelingsanalyse vil vises her når A07 data er tilgjengelig
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis Details */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Detaljert analyse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Last opp A07 data for å se detaljerte lønnsanalyser</p>
                    <Button asChild className="mt-4" variant="outline">
                      <Link to={`/clients/${clientId}/payroll/a07`}>
                        Gå til A07 data
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </StandardPageLayout>
        </StickyClientLayout>
      </ConstrainedWidth>
    </ResponsiveLayout>
  )
}

export default PayrollAnalysis