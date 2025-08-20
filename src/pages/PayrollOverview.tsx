import React from 'react'
import { useParams } from 'react-router-dom'
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth'
import StandardPageLayout from '@/components/Layout/StandardPageLayout'
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout'
import PageHeader from '@/components/Layout/PageHeader'
import StickyClientLayout from '@/components/Layout/StickyClientLayout'
import { useClientDetails } from '@/hooks/useClientDetails'
import { useFiscalYear } from '@/contexts/FiscalYearContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, FileText, BarChart3, Upload, Download, Calculator } from 'lucide-react'
import { Link } from 'react-router-dom'

const PayrollOverview = () => {
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
          pageTitle="Lønn"
        >
          <StandardPageLayout
            header={
              <PageHeader 
                title="Lønn"
                subtitle="Administrer lønnsdata og analyser"
              />
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* A07 Data Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">A07 Data</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">Lønnsdata</div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Håndter A07-rapporter og lønnsoppgaver
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/clients/${clientId}/payroll/a07`}>
                        <FileText className="h-3 w-3 mr-1" />
                        Vis data
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Kontrolloppstilling lønn Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kontrolloppstilling</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">Avstemming</div>
                  <p className="text-xs text-muted-foreground mb-4">
                    A-E beregning og eksakt match av lønnsdata
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/clients/${clientId}/payroll/kontrolloppstilling`}>
                        <Calculator className="h-3 w-3 mr-1" />
                        Åpne
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Payroll Analysis Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lønnsanalyse</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">Analyser</div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Detaljerte analyser av lønnsdata og trender
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/clients/${clientId}/payroll/analysis`}>
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Se analyser
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hurtighandlinger</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">Verktøy</div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Rask tilgang til vanlige oppgaver
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/clients/${clientId}/regnskapsdata`}>
                        <Upload className="h-3 w-3 mr-1" />
                        Last opp A07
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Eksporter data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Section */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Lønnsoversikt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">-</div>
                      <div className="text-sm text-muted-foreground">A07 filer lastet opp</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">-</div>
                      <div className="text-sm text-muted-foreground">Siste oppdatering</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">-</div>
                      <div className="text-sm text-muted-foreground">Total lønnssum</div>
                    </div>
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

export default PayrollOverview