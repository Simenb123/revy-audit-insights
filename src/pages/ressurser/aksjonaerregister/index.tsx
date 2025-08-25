import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Upload, Search, Network } from 'lucide-react'

import { ShareholdersImportForm } from '@/components/Shareholders/ShareholdersImportForm'
import { ShareholdersTable } from '@/components/Shareholders/ShareholdersTable'
import { OwnershipGraph } from '@/components/Shareholders/OwnershipGraph'

const AksjonaerregisterPage: React.FC = () => {
  const [selectedCompanyOrgnr, setSelectedCompanyOrgnr] = useState<string>('')
  const [activeTab, setActiveTab] = useState('search')

  const handleCompanySelect = (orgnr: string) => {
    setSelectedCompanyOrgnr(orgnr)
    setActiveTab('graph')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Aksjonærregister</h1>
          <p className="text-muted-foreground">
            Import, søk og analyser eierstruktur fra Skatteetatens aksjonærregister
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Søk & Oversikt
          </TabsTrigger>
          <TabsTrigger value="graph" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Eierstruktur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import CSV fra Skatteetaten</CardTitle>
              <CardDescription>
                Last opp CSV-filer med aksjonærinformasjon. Støtter store filer (100-300MB+) med automatisk encoding-deteksjon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShareholdersImportForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Søk i Aksjonærregisteret</CardTitle>
              <CardDescription>
                Søk etter selskaper eller aksjonærer. Klikk på et selskap for å se detaljert eierstruktur.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShareholdersTable onCompanySelect={handleCompanySelect} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graph" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eierstruktur</CardTitle>
              <CardDescription>
                Visualiser eierskap og kontrollstrukturer. Hover over noder for detaljinformasjon.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[600px]">
              <OwnershipGraph 
                rootOrgnr={selectedCompanyOrgnr}
                onCompanySelect={handleCompanySelect}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AksjonaerregisterPage