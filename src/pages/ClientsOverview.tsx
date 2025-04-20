
import React, { useState } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client, Announcement } from '@/types/revio';
import ClientStatsGrid from '@/components/Clients/ClientStats/ClientStatsGrid';
import ClientsTable from '@/components/Clients/ClientsTable/ClientsTable';
import AnnouncementsList from '@/components/Clients/Announcements/AnnouncementsList';
import ClientFilters from '@/components/Clients/ClientFilters/ClientFilters';

// Mock data for clients
const mockClients: Client[] = [
  {
    id: '1',
    name: 'Nordheim AS',
    companyName: 'Nordheim Konsern',
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
    companyName: 'Sørland Gruppe',
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
    companyName: 'Vesthavet Gruppe',
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
    companyName: 'Østland Konsern',
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
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mine klienter</h1>
          <p className="text-muted-foreground mt-1">
            Oversikt over klienter og revisjonsstatus
          </p>
        </div>
        
        <ClientFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          departments={departments}
        />
      </div>
      
      <div className="w-full">
        <ClientStatsGrid clients={mockClients} announcements={mockAnnouncements} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          <div className="col-span-1 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Klientliste</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientsTable clients={filteredClients} />
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-1">
            <AnnouncementsList announcements={mockAnnouncements} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsOverview;
