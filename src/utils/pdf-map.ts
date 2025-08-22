import { BilagType, BilagPayload, BilagLine } from '@/types/bilag';
import { parseNumber, round2 } from './money';

interface MappedRow {
  bilag?: string | number;
  dokumenttype?: string;
  fakturanummer?: string;
  fakturadato?: string;
  forfallsdato?: string;
  leveringsdato?: string;
  konto?: number;
  kontonavn?: string;
  beskrivelse?: string;
  type_transaksjon?: string;
  kundenavn?: string;
  kundeadresse?: string;
  leverandornavn?: string;
  leverandøradresse?: string;
  leverandororgnr?: string;
  kundeorgnr?: string;
  antall?: number;
  enhet?: string;
  enhetspris?: number;
  netto?: number;
  mva_sats?: number;
  mva_belop?: number;
  debet?: number;
  kredit?: number;
  valuta?: string;
  ordrenr?: string;
  prosjektnr?: string;
  referanse?: string;
  kid?: string;
  iban?: string;
  bic?: string;
  bankkonto?: string;
  mvaMerknad?: string;
}

/**
 * Map raw row to normalized structure
 */
export function mapRow(row: any): MappedRow {
  const mapped: MappedRow = {};
  
  // Map common fields with various possible names
  const fieldMappings: Record<string, string[]> = {
    bilag: ['bilag', 'voucher', 'voucher_no'],
    dokumenttype: ['dokumenttype', 'document_type', 'doktype'],
    fakturanummer: ['fakturanummer', 'invoice_no', 'invoice_number', 'doknr'],
    fakturadato: ['fakturadato', 'invoice_date', 'dato', 'date'],
    forfallsdato: ['forfallsdato', 'due_date', 'forfall'],
    leveringsdato: ['leveringsdato', 'delivery_date', 'levering'],
    konto: ['konto', 'account', 'account_no', 'account_number'],
    kontonavn: ['kontonavn', 'account_name', 'konto_navn'],
    beskrivelse: ['beskrivelse', 'description', 'text', 'memo'],
    type_transaksjon: ['type_transaksjon', 'transaction_type', 'type'],
    kundenavn: ['kundenavn', 'customer_name', 'kunde'],
    kundeadresse: ['kundeadresse', 'customer_address'],
  leverandornavn: ['leverandornavn', 'supplier_name', 'leverandr'],
  leverandøradresse: ['leverandøradresse', 'supplier_address'],
  leverandororgnr: ['leverandororgnr', 'supplier_orgnr', 'leverandor_orgnr'],
  kundeorgnr: ['kundeorgnr', 'customer_orgnr', 'kunde_orgnr'],
    antall: ['antall', 'quantity', 'qty'],
    enhet: ['enhet', 'unit'],
    enhetspris: ['enhetspris', 'unit_price', 'pris'],
    netto: ['netto', 'net', 'net_amount'],
    mva_sats: ['mva_sats', 'vat_rate', 'mva_prosent'],
    mva_belop: ['mva_belop', 'vat_amount', 'mva'],
    debet: ['debet', 'debit'],
    kredit: ['kredit', 'credit'],
    valuta: ['valuta', 'currency'],
    ordrenr: ['ordrenr', 'order_no'],
    prosjektnr: ['prosjektnr', 'project_no'],
    referanse: ['referanse', 'reference', 'ref'],
    kid: ['kid', 'kid_number'],
    iban: ['iban'],
    bic: ['bic', 'swift'],
    bankkonto: ['bankkonto', 'bank_account'],
    mvaMerknad: ['mva_merknad', 'vat_note']
  };
  
  // Map fields
  Object.entries(fieldMappings).forEach(([targetField, sourceFields]) => {
    for (const sourceField of sourceFields) {
      if (row[sourceField] !== undefined && row[sourceField] !== '') {
        const value = row[sourceField];
        
        // Parse numbers for numeric fields
        if (['konto', 'antall', 'enhetspris', 'netto', 'mva_sats', 'mva_belop', 'debet', 'kredit'].includes(targetField)) {
          (mapped as any)[targetField] = parseNumber(value);
        } else {
          (mapped as any)[targetField] = value;
        }
        break;
      }
    }
  });
  
  return mapped;
}

/**
 * Classify transaction type based on accounts
 */
export function classify(group: MappedRow[]): BilagType {
  // Check if explicitly set
  const explicitType = group[0]?.type_transaksjon;
  if (explicitType) {
    const typeMap: Record<string, BilagType> = {
      'salgsfaktura': 'salgsfaktura',
      'leverandorfaktura': 'leverandorfaktura', 
      'kundebetaling': 'kundebetaling',
      'leverandorbetaling': 'leverandorbetaling',
      'bankbilag': 'bankbilag',
      'diversebilag': 'diversebilag'
    };
    if (typeMap[explicitType.toLowerCase()]) {
      return typeMap[explicitType.toLowerCase()];
    }
  }
  
  // Classify based on account patterns
  const accounts = group.map(r => r.konto).filter(Boolean);
  const accountSet = new Set(accounts);
  
  // Sales invoice: 1500+2700+3xxx
  if (accountSet.has(1500) && accountSet.has(2700) && 
      accounts.some(a => a && a >= 3000 && a < 4000)) {
    return 'salgsfaktura';
  }
  
  // Purchase invoice: 2400+2710+4xxx-7xxx
  if (accountSet.has(2400) && accountSet.has(2710) && 
      accounts.some(a => a && a >= 4000 && a < 8000)) {
    return 'leverandorfaktura';
  }
  
  // Customer payment: 1920+1500 (only these)
  if (accountSet.has(1920) && accountSet.has(1500) && accountSet.size === 2) {
    return 'kundebetaling';
  }
  
  // Supplier payment: 1920+2400 (only these)
  if (accountSet.has(1920) && accountSet.has(2400) && accountSet.size === 2) {
    return 'leverandorbetaling';
  }
  
  // Bank transaction: 8160+1920
  if (accountSet.has(8160) && accountSet.has(1920)) {
    return 'bankbilag';
  }
  
  return 'diversebilag';
}

/**
 * Convert grouped rows to BilagPayload
 */
export function groupsToPayloads(
  groups: Record<string, MappedRow[]>, 
  selskapInfo: { navn: string; orgnr?: string; mvaRegistrert?: boolean; adresse?: string }
): BilagPayload[] {
  const payloads: BilagPayload[] = [];
  
  Object.entries(groups).forEach(([key, group]) => {
    const type = classify(group);
    const first = group[0];
    
    const payload: BilagPayload = {
      type,
      doknr: first.fakturanummer || key,
      bilag: first.bilag || key,
      dato: first.fakturadato || first.leveringsdato || new Date().toISOString().split('T')[0],
      forfall: first.forfallsdato,
      levering: first.leveringsdato || first.fakturadato,
      valuta: first.valuta || 'NOK',
      selskap: selskapInfo
    };
    
    // Handle different bilag types
    if (type === 'salgsfaktura' || type === 'leverandorfaktura') {
      // Build invoice lines
      const lines: BilagLine[] = [];
      
      // Check if we have explicit line items
      const hasLineItems = group.some(r => r.antall || r.enhetspris || r.netto);
      
      if (hasLineItems) {
        group.forEach(row => {
          if (row.netto && row.netto !== 0) {
            const line: BilagLine = {
              beskrivelse: row.beskrivelse || 'Ingen beskrivelse',
              netto: row.netto,
              antall: row.antall,
              enhet: row.enhet,
              mvaSats: row.mva_sats,
              mva: row.mva_belop
            };
            
            // Calculate brutto if missing
            if (!line.mva && line.mvaSats) {
              line.mva = round2(line.netto * line.mvaSats / 100);
            }
            line.brutto = round2(line.netto + (line.mva || 0));
            
            lines.push(line);
          }
        });
      } else {
        // Build from account postings
        const salesAccounts = group.filter(r => r.konto && r.konto >= 3000 && r.konto < 4000);
        const purchaseAccounts = group.filter(r => r.konto && r.konto >= 4000 && r.konto < 8000);
        const relevantAccounts = type === 'salgsfaktura' ? salesAccounts : purchaseAccounts;
        
        relevantAccounts.forEach(row => {
          const amount = (row.kredit || 0) - (row.debet || 0);
          if (amount !== 0) {
            const line: BilagLine = {
              beskrivelse: row.beskrivelse || row.kontonavn || `Konto ${row.konto}`,
              netto: Math.abs(amount)
            };
            
            // Try to find corresponding VAT
            const vatRow = group.find(r => 
              (r.konto === 2700 && type === 'salgsfaktura') ||
              (r.konto === 2710 && type === 'leverandorfaktura')
            );
            
            if (vatRow) {
              line.mva = Math.abs((vatRow.kredit || 0) - (vatRow.debet || 0));
              if (line.netto > 0) {
                line.mvaSats = round2((line.mva / line.netto) * 100);
              }
            }
            
            line.brutto = round2(line.netto + (line.mva || 0));
            lines.push(line);
          }
        });
      }
      
      payload.linjer = lines;
      
      // Set customer/supplier info
      if (type === 'salgsfaktura') {
        payload.motpart = first.kundenavn;
        payload.motpartAdresse = first.kundeadresse;
        payload.motpartNr = first.kundeorgnr;
      } else {
        payload.motpart = first.leverandornavn;
        payload.motpartAdresse = first.leverandøradresse; 
        payload.motpartOrgnr = first.leverandororgnr;
      }
      
      // Check for credit note
      const totalSum = lines.reduce((sum, line) => sum + line.netto, 0);
      if (first.dokumenttype?.toLowerCase().includes('kredit') || totalSum < 0) {
        payload.dokumenttype = 'kreditnota';
      }
      
    } else if (type === 'kundebetaling' || type === 'leverandorbetaling' || type === 'bankbilag') {
      // Payment vouchers
      const totalDebet = group.reduce((sum, r) => sum + (r.debet || 0), 0);
      const totalKredit = group.reduce((sum, r) => sum + (r.kredit || 0), 0);
      payload.belop = Math.abs(totalDebet - totalKredit);
      
      // Payment details
      payload.kid = first.kid;
      payload.iban = first.iban;
      payload.bic = first.bic;
      payload.bankkonto = first.bankkonto;
      payload.referanse = first.referanse;
      
      if (type === 'kundebetaling') {
        payload.motpart = first.kundenavn;
      } else if (type === 'leverandorbetaling') {
        payload.motpart = first.leverandornavn;
      }
      
    } else {
      // Journal entries (diversebilag)
      payload.poster = group.map(row => ({
        konto: row.konto || 0,
        kontonavn: row.kontonavn,
        beskrivelse: row.beskrivelse,
        debet: row.debet || 0,
        kredit: row.kredit || 0
      }));
    }
    
    // Add additional fields
    payload.ordrenr = first.ordrenr;
    payload.prosjektnr = first.prosjektnr;
    payload.mvaMerknad = first.mvaMerknad;
    
    payloads.push(payload);
  });
  
  return payloads;
}