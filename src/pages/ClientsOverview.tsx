import React, { useState } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Search, Filter, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Client, Announcement, AuditPhase } from '@/types/revio';

// Mock data for clients
const mockClients: Client[] = [
  {
    id: '1',
    name: 'Nordheim AS',
    orgNumber: '912345678',
    phase: 'planning',
    progress: 65,
    department: 'Oslo',
    contactPerson: 'Mats Hansen',
    riskAreas: [
      { name: 'Inntekter', risk: 'medium' },
      { name: 'Kostnader', risk: 'low' },
      { name: 'Anleggsmidler', risk: 'high' }
    ],
    documents: [
      { type: 'shareholder_report', status: 'submitted', dueDate: '2025-05-15' },
      { type: 'tax_return', status: 'pending', dueDate: '2025-06-30' },
      { type: 'annual_report', status: 'pending', dueDate: '2025-07-31' }
    ]
  },
  {
    id: '2',
    name: 'Sørland Byggverk AS',
    orgNumber: '921234567',
    phase: 'execution',
    progress: 40,
    department: 'Kristiansand',
    contactPerson: 'Julie Nilsen',
    riskAreas: [
      { name: 'Inntekter', risk: 'low' },
      { name: 'Kostnader', risk: 'medium' },
      { name: 'Anleggsmidler', risk: 'low' }
    ],
    documents: [
      { type: 'shareholder_report', status: 'accepted', dueDate: '2025-05-15' },
      { type: 'tax_return', status: 'submitted', dueDate: '2025-06-30' },
      { type: 'annual_report', status: 'pending', dueDate: '2025-07-31' }
    ]
  },
  {
    id: '3',
    name: 'Vesthavet Fiskeri AS',
    orgNumber: '934567890',
    phase: 'engagement',
    progress: 20,
    department: 'Bergen',
    contactPerson: 'Ole Andersen',
    riskAreas: [
      { name: 'Inntekter', risk: 'high' },
      { name: 'Kostnader', risk: 'medium' },
      { name: 'Anleggsmidler', risk: 'medium' }
    ],
    documents: [
      { type: 'shareholder_report', status: 'pending', dueDate: '2025-05-15' },
      { type: 'tax_return', status: 'pending', dueDate: '2025-06-30' },
      { type: 'annual_report', status: 'pending', dueDate: '2025-07-31' }
    ]
  },
  {
    id: '4',
    name: 'Østland Elektronikk AS',
    orgNumber: '945678901',
    phase: 'conclusion',
    progress: 90,
    department: 'Oslo',
    contactPerson: 'Sara Johansen',
    riskAreas: [
      { name: 'Inntekter', risk: 'low' },
      { name: 'Kostnader', risk: 'low' },
      { name: 'Anleggsmidler', risk: 'low' }
    ],
    documents: [
      { type: 'shareholder_report', status: 'accepted', dueDate: '2025-05-15' },
      { type: 'tax_return', status: 'accepted', dueDate: '2025-06-30' },
      { type: 'annual_report', status: 'submitted', dueDate: '2025-07-31' }
    ]
  },
];

// Mock data for announcements
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Nordheim AS',
    title: 'Styreendring',
    description: 'Ny styreleder: Anders Nordvik',
    date: '2025-04-10',
    type: 'board_change',
    isRead: false
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Sørland Byggverk AS',
    title: 'Kapitalendring',
    description: 'Økning av aksjekapital med 500.000 NOK',
    date: '2025-04-05',
    type: 'capital_change',
    isRead: true
  },
  {
    id: '3',
    clientId: '3',
    clientName: 'Vesthavet Fiskeri AS',
    title: 'Adresseendring',
    description: 'Ny forretningsadresse: Havnegata 12, 5003 Bergen',
    date: '2025-04-02',
    type: 'address_change',
    isRead: false
  },
  {
    id: '4',
    clientId: '1',
    clientName: 'Nordheim AS',
    title: 'Endring i vedtekter',
    description: 'Oppdatering av selskapets formål',
    date: '2025-03-28',
    type: 'other',
    isRead: true
  },
  {
    id: '5',
    clientId: '4',
    clientName: 'Østland Elektronikk AS',
    title: 'Ny daglig leder',
    description: 'Maria Lund er ansatt som ny daglig leder',
    date: '2025-03-25',
    type: 'board_change',
    isRead: false
  },
];

const phaseLabels: Record<AuditPhase, string> = {
  'engagement': 'Oppdragsvurdering',
  'planning': 'Planlegging',
  'execution': 'Utførelse',
  'conclusion': 'Avslutning'
};

const ClientsOverview = () => {
  const { setContext } = useRevyContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Set context for Revy assistant
  React.useEffect(() => {
    setContext('client-overview');
  }, [setContext]);
  
  // Filter clients based on search term and department
  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.orgNumber.includes(searchTerm);
    const matchesDepartment = departmentFilter === 'all' || client.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });
  
  // Get unique departments for filter dropdown
  const departments = Array.from(new Set(mockClients.map(client => client.department))).filter(Boolean) as string[];
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mine klienter</h1>
          <p className="text-muted-foreground mt-1">
            Oversikt over klienter og revisjonsstatus
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              className="pl-10 w-64" 
              placeholder="Søk på klient eller org. nr."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Velg avdeling" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle avdelinger</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button className="gap-2 bg-revio-500 hover:bg-revio-600">
            <Filter size={18} />
            <span>Flere filtre</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Klienter under revisjon</CardTitle>
            <CardDescription>Totalt {mockClients.length} klienter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockClients.length}</div>
            <div className="mt-2 text-sm text-muted-foreground flex justify-between">
              <span>Aktive: {mockClients.filter(c => c.phase !== 'conclusion').length}</span>
              <span>Fullførte: {mockClients.filter(c => c.phase === 'conclusion').length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Dokumenter til innsending</CardTitle>
            <CardDescription>Oversikt over kommende frister</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockClients.reduce((acc, client) => 
                acc + client.documents.filter(doc => doc.status === 'pending').length, 0)
              }
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <span>Neste frist: 15. mai 2025 (Aksjonærregisteroppgave)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Nye kunngjøringer</CardTitle>
            <CardDescription>Fra Brønnøysundregistrene</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {mockAnnouncements.filter(a => !a.isRead).length}
            </div>
            <div className="mt-2 text-sm text-muted-foreground flex justify-between">
              <span>Uleste: {mockAnnouncements.filter(a => !a.isRead).length}</span>
              <Button variant="ghost" size="sm" className="p-0 h-auto text-revio-500 hover:text-revio-600 hover:bg-transparent">
                <span>Se alle</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Klientliste</CardTitle>
              <CardDescription>Revisjonsstatus og fremdrift</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klient</TableHead>
                    <TableHead>Org. nr.</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Fremdrift</TableHead>
                    <TableHead>Skjemastatus</TableHead>
                    <TableHead>Risiko</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map(client => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/80">
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.orgNumber}</TableCell>
                      <TableCell>
                        <Badge variant={client.phase === 'conclusion' ? 'success' : 
                                              client.phase === 'execution' ? 'warning' : 
                                              'outline'}>
                          {phaseLabels[client.phase]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full max-w-24">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{client.progress}%</span>
                          </div>
                          <Progress value={client.progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {client.documents.map((doc, idx) => {
                            let color;
                            switch(doc.status) {
                              case 'accepted': color = 'bg-green-500'; break;
                              case 'submitted': color = 'bg-yellow-500'; break;
                              case 'pending': color = 'bg-gray-300'; break;
                            }
                            return (
                              <div key={idx} className={`w-3 h-3 rounded-full ${color}`} title={
                                doc.type === 'shareholder_report' ? 'Aksjonærregisteroppgave' :
                                doc.type === 'tax_return' ? 'Skattemelding' : 'Årsregnskap'
                              }></div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.riskAreas.some(area => area.risk === 'high') && (
                          <Badge variant="destructive">Høy risiko</Badge>
                        )}
                        {!client.riskAreas.some(area => area.risk === 'high') && 
                         client.riskAreas.some(area => area.risk === 'medium') && (
                          <Badge variant="warning">Medium risiko</Badge>
                        )}
                        {client.riskAreas.every(area => area.risk === 'low') && (
                          <Badge variant="outline">Lav risiko</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Nye kunngjøringer</CardTitle>
                <CardDescription>Fra Brønnøysundregistrene</CardDescription>
              </div>
              <Bell size={18} className="text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-0">
                {mockAnnouncements.slice(0, 5).map(announcement => (
                  <div 
                    key={announcement.id} 
                    className={`py-3 px-6 border-b last:border-b-0 ${!announcement.isRead ? 'bg-muted/50' : ''}`}
                  >
                    <div className="text-sm font-medium flex justify-between">
                      <span>{announcement.clientName}</span>
                      <span className="text-xs text-muted-foreground">{announcement.date}</span>
                    </div>
                    <div className="text-sm mt-1">{announcement.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{announcement.description}</div>
                  </div>
                ))}
              </div>
              <div className="pt-4 px-6">
                <Button variant="outline" className="w-full">Se alle kunngjøringer</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientsOverview;
