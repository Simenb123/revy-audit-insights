import { Client, Announcement } from '@/types/revio';

export const mockClients: Client[] = [
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

export const mockAnnouncements: Announcement[] = [
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
