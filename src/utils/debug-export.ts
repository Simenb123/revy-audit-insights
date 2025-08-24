import * as XLSX from 'xlsx';
import { BilagType } from '@/types/bilag';

interface DebugExportData {
  originalData: any[];
  mappedData: any[];
  columnMapping: Record<string, string>;
  bilagGroups: Record<string, any[]>;
  detectedColumns: string[];
  typeDistribution: Record<BilagType, number>;
}

export const generateDebugFile = async (data: DebugExportData) => {
  const {
    originalData,
    mappedData,
    columnMapping,
    bilagGroups,
    detectedColumns,
    typeDistribution
  } = data;

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Mapping Overview
  const mappingData = [
    ['Kolonnmapping Oversikt', '', ''],
    ['Original Kolonne', 'Mappet til', 'Status'],
    ...Object.entries(columnMapping).map(([original, mapped]) => [
      original,
      mapped || 'IKKE MAPPET',
      mapped ? 'OK' : 'MANGLER'
    ]),
    ['', '', ''],
    ['Detaljert info:', '', ''],
    ['Totale rader:', mappedData.length, ''],
    ['Totale bilag:', Object.keys(bilagGroups).length, ''],
    ['Mappede kolonner:', detectedColumns.length, ''],
    ['Kolonner med data:', Object.keys(mappedData[0] || {}).filter(key => 
      mappedData.some(row => row[key] && row[key].toString().trim() !== '')
    ).length, ''],
    ['', '', ''],
    ['Kolonne-mapping detaljer:', '', ''],
    ['Original → Normalisert → Målkolonne:', '', ''],
    ...Object.entries(data.columnMapping).map(([original, target]) => [
      original, 
      `${original.toLowerCase().replace(/\s+/g, '_').replace(/[æå]/g, 'aa').replace(/ø/g, 'oe').replace(/[^\w_]/g, '')}`, 
      target || 'IKKE MAPPET'
    ]),
    ['', '', ''],
    ['Bilagtype fordeling:', '', ''],
    ...Object.entries(typeDistribution).map(([type, count]) => [
      getTypeName(type as BilagType),
      count,
      ''
    ])
  ];

  const mappingSheet = XLSX.utils.aoa_to_sheet(mappingData);
  XLSX.utils.book_append_sheet(workbook, mappingSheet, 'Kolonnmapping');

  // Sheet 2: Mapped Data (first 1000 rows for performance)
  if (mappedData.length > 0) {
    const limitedMappedData = mappedData.slice(0, 1000);
    const mappedSheet = XLSX.utils.json_to_sheet(limitedMappedData);
    XLSX.utils.book_append_sheet(workbook, mappedSheet, 'Mappet Data');
  }

  // Sheet 3: Original Data (first 1000 rows for performance)
  if (originalData.length > 0) {
    const limitedOriginalData = originalData.slice(0, 1000);
    const originalSheet = XLSX.utils.json_to_sheet(limitedOriginalData);
    XLSX.utils.book_append_sheet(workbook, originalSheet, 'Original Data');
  }

  // Sheet 4: Bilag Analysis
  const bilagAnalysis = [
    ['Bilagsanalyse', '', '', '', ''],
    ['Bilag Nr', 'Type', 'Rader', 'Første Rad', 'Status'],
    ...Object.entries(bilagGroups).map(([bilagNr, group]) => {
      const firstRow = group[0] || {};
      const type = detectBilagType(group);
      return [
        bilagNr,
        getTypeName(type),
        group.length,
        JSON.stringify(firstRow).substring(0, 100) + '...',
        group.length > 0 ? 'OK' : 'TOM'
      ];
    })
  ];

  const bilagSheet = XLSX.utils.aoa_to_sheet(bilagAnalysis);
  XLSX.utils.book_append_sheet(workbook, bilagSheet, 'Bilagsanalyse');

  // Sheet 5: Troubleshooting Guide
  const troubleshootingData = [
    ['Feilsøkingsguide for PDF Creator', '', ''],
    ['', '', ''],
    ['Vanlige problemer og løsninger:', '', ''],
    ['', '', ''],
    ['Problem: Ingen bilag genereres', '', ''],
    ['Løsning: Sjekk at "bilag" kolonnen er mappet', '', ''],
    ['Løsning: Sjekk at bilagsnummer finnes i dataene', '', ''],
    ['', '', ''],
    ['Problem: Feil bilagstype', '', ''],
    ['Løsning: Sjekk "type_transaksjon" kolonne mapping', '', ''],
    ['Løsning: Sjekk kontonummer mapping (3000-3999=Salg)', '', ''],
    ['', '', ''],
    ['Problem: Manglende beløp', '', ''],
    ['Løsning: Sjekk "belop" eller "kredit"/"debet" mapping', '', ''],
    ['', '', ''],
    ['Kolonner som må mappes for gode resultater:', '', ''],
    ['- bilag (påkrevd)', '', ''],
    ['- fakturadato eller bilagsdato (påkrevd)', '', ''],
    ['- type_transaksjon (anbefalt)', '', ''],
    ['- belop eller kredit/debet (anbefalt)', '', ''],
    ['- motpart eller kunde (anbefalt)', '', ''],
    ['- konto (for automatisk type-deteksjon)', '', '']
  ];

  const troubleshootingSheet = XLSX.utils.aoa_to_sheet(troubleshootingData);
  XLSX.utils.book_append_sheet(workbook, troubleshootingSheet, 'Feilsøking');

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const filename = `pdf-creator-debug-${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);
};

// Helper function to detect bilag type from group
const detectBilagType = (group: any[]): BilagType => {
  if (group.length === 0) return 'diversebilag';
  
  const accounts = group.map(r => r.konto).filter(Boolean);
  
  if (accounts.some(a => a >= 3000 && a < 4000)) return 'salgsfaktura';
  if (accounts.some(a => a >= 4000 && a < 8000)) return 'leverandorfaktura';
  if (accounts.includes(1920) && accounts.includes(1500)) return 'kundebetaling';
  if (accounts.includes(1920) && accounts.includes(2400)) return 'leverandorbetaling';
  if (accounts.includes(8160)) return 'bankbilag';
  
  return 'diversebilag';
};

// Helper function to get Norwegian type names
const getTypeName = (type: BilagType): string => {
  const typeNames: Record<BilagType, string> = {
    'salgsfaktura': 'Salgsfaktura',
    'leverandorfaktura': 'Innkjøpsfaktura',
    'kundebetaling': 'Kundebetaling',
    'leverandorbetaling': 'Leverandørbetaling',
    'bankbilag': 'Bankbilag',
    'diversebilag': 'Diversebilag'
  };
  
  return typeNames[type] || type;
};