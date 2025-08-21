import * as XLSX from 'xlsx';
import { LEGAL_PROVISION_FIELDS } from '@/utils/legalProvisionFields';

// Generate Excel template for legal provisions
export function generateLegalProvisionTemplate(lawIdentifier: string, lawTitle: string): void {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create headers based on field definitions
  const headers = LEGAL_PROVISION_FIELDS.map(field => field.label);
  
  // Create example data for the specific law
  const exampleData = [
    [
      'rskl-1-1', // provision_id
      lawIdentifier, // law_identifier
      'section', // provision_type
      '1-1', // provision_number
      'Formål', // title
      'Formålet med denne loven er å...', // content
      '', // parent_provision_id
      '2023-01-01', // valid_from
      '' // valid_until
    ],
    [
      'rskl-1-2', // provision_id
      lawIdentifier, // law_identifier
      'subsection', // provision_type
      '1-2', // provision_number
      'Virkeområde', // title
      'Loven gjelder for...', // content
      'rskl-1-1', // parent_provision_id
      '2023-01-01', // valid_from
      '' // valid_until
    ],
    [
      'rskl-2-1', // provision_id
      lawIdentifier, // law_identifier
      'section', // provision_type
      '2-1', // provision_number
      'Definisjoner', // title
      'I denne loven betyr...', // content
      '', // parent_provision_id
      '2023-01-01', // valid_from
      '' // valid_until
    ]
  ];

  // Create worksheet data with headers and examples
  const wsData = [headers, ...exampleData];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  const colWidths = [
    { wch: 15 }, // provision_id
    { wch: 15 }, // law_identifier
    { wch: 12 }, // provision_type
    { wch: 15 }, // provision_number
    { wch: 25 }, // title
    { wch: 50 }, // content
    { wch: 18 }, // parent_provision_id
    { wch: 12 }, // valid_from
    { wch: 12 }  // valid_until
  ];
  ws['!cols'] = colWidths;
  
  // Style the header row
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E3F2FD' } },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Bestemmelser');
  
  // Create info sheet with field descriptions
  const infoData = [
    ['Felt', 'Beskrivelse', 'Påkrevd', 'Eksempel'],
    ['Bestemmelse ID', 'Unik identifikator for bestemmelsen', 'Ja', 'rskl-1-1'],
    ['Lov ID/Kode', 'Identifikator for loven (automatisk utfylt)', 'Ja', lawIdentifier],
    ['Type', 'Type bestemmelse (law, chapter, section, subsection, letter)', 'Ja', 'section'],
    ['Paragrafnummer', 'Paragraf- eller bestemmelsesnummer', 'Ja', '1-1, 2-3, etc.'],
    ['Tittel', 'Tittel på bestemmelsen', 'Ja', 'Formål'],
    ['Innhold/Tekst', 'Selve innholdet i bestemmelsen', 'Ja', 'Formålet med denne loven er å...'],
    ['Overordnet bestemmelse', 'ID til overordnet bestemmelse (for hierarki)', 'Nei', 'rskl-1'],
    ['Gyldig fra', 'Dato bestemmelsen trådte/trer i kraft', 'Nei', '2023-01-01'],
    ['Gyldig til', 'Dato bestemmelsen opphører (hvis aktuelt)', 'Nei', '2024-12-31']
  ];
  
  const infoWs = XLSX.utils.aoa_to_sheet(infoData);
  infoWs['!cols'] = [
    { wch: 20 },
    { wch: 50 },
    { wch: 10 },
    { wch: 25 }
  ];
  
  // Style info sheet header
  const infoHeaderRange = XLSX.utils.decode_range(infoWs['!ref'] || 'A1');
  for (let col = infoHeaderRange.s.c; col <= infoHeaderRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!infoWs[cellAddress]) continue;
    
    infoWs[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'F3E5F5' } }
    };
  }
  
  XLSX.utils.book_append_sheet(wb, infoWs, 'Feltbeskrivelser');
  
  // Download the template
  const fileName = `juridisk-bestemmelser-template-${lawIdentifier.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Get field definitions for use in other components
export function getLegalProvisionFieldDefinitions() {
  return LEGAL_PROVISION_FIELDS;
}