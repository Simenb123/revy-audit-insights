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
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { A07DataSection } from '@/components/AccountingData/A07DataSection'

const PayrollA07 = () => {
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
          pageTitle="A07 Data"
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
                  title="A07 Data"
                  subtitle="Administrer A07 lønnsrapporter"
                />
              </div>
            }
          >
            <A07DataSection clientId={clientId} clientName={client?.name || ''} />
          </StandardPageLayout>
        </StickyClientLayout>
      </ConstrainedWidth>
    </ResponsiveLayout>
  )
}

export default PayrollA07