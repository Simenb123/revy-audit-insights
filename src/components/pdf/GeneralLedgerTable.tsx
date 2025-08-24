import React from 'react';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download } from 'lucide-react';
import { BilagPayload, BilagType } from '@/types/bilag';
import { formatNOK, formatNumber } from '@/utils/money';

interface GeneralLedgerRow {
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
  leverandornavn?: string;
  kundeorgnr?: string;
  leverandororgnr?: string;
  antall?: number;
  enhet?: string;
  enhetspris?: number;
  netto?: number;
  mva_sats?: number;
  mva_belop?: number;
  mva_kode_navn?: string;
  debet?: number;
  kredit?: number;
  valuta?: string;
  ordrenr?: string;
  prosjektnr?: string;
  referanse?: string;
  kid?: string;
  bankkonto?: string;
  mvaMerknad?: string;
  [key: string]: any;
}

interface GeneralLedgerTableProps {
  rows: GeneralLedgerRow[];
  bilagGroups: Record<string, any[]>;
  payloads?: BilagPayload[];
  onViewReceipt?: (payload: BilagPayload) => void;
  onDownloadPdf?: (payload: BilagPayload) => void;
}

export const GeneralLedgerTable: React.FC<GeneralLedgerTableProps> = ({
  rows,
  bilagGroups,
  payloads = [],
  onViewReceipt,
  onDownloadPdf
}) => {
  // Function to find related payload for a row
  const findPayloadForRow = (row: GeneralLedgerRow): BilagPayload | undefined => {
    const bilagKey = row.bilag?.toString() || row.fakturanummer?.toString();
    if (!bilagKey) return undefined;
    
    return payloads.find(payload => 
      payload.bilag?.toString() === bilagKey || 
      payload.doknr?.toString() === bilagKey
    );
  };

  // Function to get voucher type based on accounts in the group
  const getVoucherType = (row: GeneralLedgerRow): BilagType => {
    const bilagKey = row.bilag?.toString() || row.fakturanummer?.toString();
    if (!bilagKey) return 'diversebilag';
    
    const group = bilagGroups[bilagKey];
    if (!group) return 'diversebilag';
    
    const accounts = group.map(r => r.konto).filter(Boolean);
    
    if (accounts.some(a => a >= 3000 && a < 4000)) return 'salgsfaktura';
    if (accounts.some(a => a >= 4000 && a < 8000)) return 'leverandorfaktura';
    if (accounts.includes(1920) && accounts.includes(1500)) return 'kundebetaling';
    if (accounts.includes(1920) && accounts.includes(2400)) return 'leverandorbetaling';
    if (accounts.includes(8160)) return 'bankbilag';
    
    return 'diversebilag';
  };

  // Function to get badge variant for voucher type
  const getBadgeVariant = (type: BilagType): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'salgsfaktura': return 'default';
      case 'leverandorfaktura': return 'secondary';
      case 'kundebetaling': return 'outline';
      case 'leverandorbetaling': return 'outline';
      case 'bankbilag': return 'destructive';
      default: return 'secondary';
    }
  };

  // Function to get display name for voucher type
  const getTypeDisplayName = (type: BilagType): string => {
    switch (type) {
      case 'salgsfaktura': return 'Salgsfaktura';
      case 'leverandorfaktura': return 'Innkjøpsfaktura';
      case 'kundebetaling': return 'Kundebetaling';
      case 'leverandorbetaling': return 'Leverandørbetaling';
      case 'bankbilag': return 'Bankbilag';
      case 'diversebilag': return 'Diversebilag';
      default: return 'Ukjent';
    }
  };

  // Helper function to get motpart (customer or supplier name)
  const getMotpart = (row: GeneralLedgerRow): string => {
    return row.kundenavn || row.leverandornavn || '';
  };

  // Helper function to get motpart orgnr
  const getMotpartOrgnr = (row: GeneralLedgerRow): string => {
    return row.kundeorgnr || row.leverandororgnr || '';
  };

  // Helper function to calculate total amount (prioritize netto, then debet-kredit)
  const getTotalAmount = (row: GeneralLedgerRow): number => {
    if (row.netto !== undefined && row.netto !== 0) return row.netto;
    return (row.debet || 0) - (row.kredit || 0);
  };

  const columns: StandardDataTableColumn<GeneralLedgerRow>[] = [
    {
      key: 'bilag',
      header: 'Bilag',
      accessor: 'bilag',
      sortable: true,
      searchable: true,
    },
    {
      key: 'fakturadato',
      header: 'Dato',
      accessor: 'fakturadato',
      sortable: true,
      searchable: true,
      format: (value) => value ? new Date(value).toLocaleDateString('no-NO') : '',
    },
    {
      key: 'konto',
      header: 'Konto',
      accessor: 'konto',
      sortable: true,
      searchable: true,
      align: 'right',
    },
    {
      key: 'kontonavn',
      header: 'Kontonavn',
      accessor: 'kontonavn',
      sortable: true,
      searchable: true,
    },
    {
      key: 'beskrivelse',
      header: 'Beskrivelse',
      accessor: 'beskrivelse',
      sortable: true,
      searchable: true,
    },
    {
      key: 'totalAmount',
      header: 'Beløp',
      accessor: (row) => getTotalAmount(row),
      sortable: true,
      align: 'right',
      format: (value) => value ? formatNOK(value) : '',
    },
    {
      key: 'debet',
      header: 'Debet',
      accessor: 'debet',
      sortable: true,
      align: 'right',
      format: (value) => value ? formatNOK(value) : '',
    },
    {
      key: 'kredit',
      header: 'Kredit',
      accessor: 'kredit',
      sortable: true,
      align: 'right',
      format: (value) => value ? formatNOK(value) : '',
    },
    {
      key: 'motpart',
      header: 'Motpart',
      accessor: (row) => getMotpart(row),
      sortable: true,
      searchable: true,
    },
    {
      key: 'motpartOrgnr',
      header: 'Orgnr',
      accessor: (row) => getMotpartOrgnr(row),
      sortable: true,
      searchable: true,
    },
    {
      key: 'mva_belop',
      header: 'MVA',
      accessor: 'mva_belop',
      sortable: true,
      align: 'right',
      format: (value) => value ? formatNOK(value) : '',
    },
    {
      key: 'mva_sats',
      header: 'MVA %',
      accessor: 'mva_sats',
      sortable: true,
      align: 'right',
      format: (value) => value ? `${formatNumber(value, 0)}%` : '',
    },
    {
      key: 'mva_kode_navn',
      header: 'MVA-kodenavn',
      accessor: 'mva_kode_navn',
      sortable: true,
      searchable: true,
    },
    {
      key: 'ordrenr',
      header: 'Ordrenr',
      accessor: 'ordrenr',
      sortable: true,
      searchable: true,
    },
    {
      key: 'forfallsdato',
      header: 'Forfall',
      accessor: 'forfallsdato',
      sortable: true,
      searchable: true,
      format: (value) => value ? new Date(value).toLocaleDateString('no-NO') : '',
    },
    {
      key: 'dokumenttype',
      header: 'Dokumenttype',
      accessor: 'dokumenttype',
      sortable: true,
      searchable: true,
      format: (value) => value ? (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      ) : '',
    },
    {
      key: 'valuta',
      header: 'Valuta',
      accessor: 'valuta',
      sortable: true,
      searchable: true,
      format: (value) => value && value !== 'NOK' ? (
        <Badge variant="secondary" className="text-xs">
          {value}
        </Badge>
      ) : '',
    },
    {
      key: 'referanse',
      header: 'Referanse',
      accessor: 'referanse',
      sortable: true,
      searchable: true,
    },
    {
      key: 'kid',
      header: 'KID',
      accessor: 'kid',
      sortable: true,
      searchable: true,
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (row) => getVoucherType(row),
      sortable: true,
      format: (value, row) => {
        const type = getVoucherType(row);
        return (
          <Badge variant={getBadgeVariant(type)} className="text-xs">
            {getTypeDisplayName(type)}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Handlinger',
      accessor: () => '',
      sortable: false,
      format: (_, row) => {
        const payload = findPayloadForRow(row);
        const hasPayload = !!payload;
        
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => payload && onViewReceipt?.(payload)}
              disabled={!hasPayload}
              className="h-8 px-2"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => payload && onDownloadPdf?.(payload)}
              disabled={!hasPayload}
              className="h-8 px-2"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <StandardDataTable
      title="Hovedbok"
      columns={columns}
      data={rows}
      tableName="general-ledger"
      searchPlaceholder="Søk i hovedbok..."
      emptyMessage="Ingen hovedboksdata funnet"
      enableExport={true}
      enableColumnManager={true}
      enablePdfExport={false}
      pageSize={25}
      enablePagination={true}
      maxBodyHeight="60vh"
    />
  );
};