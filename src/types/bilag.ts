export type BilagType =
  | 'salgsfaktura'
  | 'leverandorfaktura'
  | 'kundebetaling' 
  | 'leverandorbetaling'
  | 'bankbilag'
  | 'diversebilag';

export interface BilagLine {
  beskrivelse: string;
  netto: number;
  mvaSats?: number;  // kan mangle – avled fra mvaBeløp om tilstede
  mva?: number;      // kan være gitt i data
  brutto?: number;   // beregnes hvis ikke gitt
  antall?: number;
  enhet?: string;
}

export interface BilagPayload {
  type: BilagType;
  dokumenttype?: 'faktura' | 'kreditnota'; // styrer "KREDITNOTA"-markering, men fortegn beholdes fra data
  doknr: string;
  bilag: string | number;
  dato: string;
  forfall?: string;
  levering?: string;
  valuta?: string;

  // motpart
  motpart?: string;
  motpartAdresse?: string;
  motpartNr?: string;
  motpartOrgnr?: string;

  // linjer for faktura/kreditnota
  linjer?: BilagLine[];

  // beløp for betalingsbilag
  belop?: number;

  // referanse/betaling (vises i header/betalingsboks)
  ordrenr?: string;
  prosjektnr?: string;
  referanse?: string;
  kid?: string;
  iban?: string;
  bic?: string;
  bankkonto?: string;
  mvaMerknad?: string;

  // diversebilag (journal)
  poster?: Array<{ 
    konto: number; 
    kontonavn?: string; 
    beskrivelse?: string; 
    debet: number; 
    kredit: number;
  }>;

  selskap: { 
    navn: string; 
    orgnr?: string; 
    mvaRegistrert?: boolean; 
    adresse?: string;
  };
}

export interface GeneratedVoucher {
  id: string;
  client_id: string;
  bilag?: string;
  doknr?: string;
  type: BilagType;
  dokumenttype?: string;
  storage_key: string;
  sha256?: string;
  file_size?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}