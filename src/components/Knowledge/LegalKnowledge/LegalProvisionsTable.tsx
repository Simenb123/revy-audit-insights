import React from 'react';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import type { LegalProvision } from '@/types/legal-knowledge';

interface LegalProvisionsTableProps {
  provisions: LegalProvision[];
  isLoading?: boolean;
  error?: any;
  onLawClick?: (lawIdentifier: string, lawTitle: string) => void;
}

const LegalProvisionsTable: React.FC<LegalProvisionsTableProps> = ({
  provisions,
  isLoading,
  error,
  onLawClick
}) => {
  // Create readable law name from identifier if full name not available
  const getReadableLawName = (identifier: string) => {
    // Map specific law identifiers to their proper names
    const lawMap: Record<string, string> = {
      'LOV-1998-07-17-56': 'Lov om årsregnskap m.v. (regnskapsloven)',
      'LOV-1999-01-15-2': 'Lov om revisor og revisjon (revisorloven)',
      'LOV-1997-06-13-44': 'Lov om aksjeselskaper (aksjeloven)',
      'LOV-1997-06-13-45': 'Lov om allmennaksjeselskaper (allmennaksjeloven)',
      'LOV-2004-11-19-73': 'Lov om bokføring (bokføringsloven)',
      'LOV-2005-06-17-67': 'Lov om betaling og innkreving av skatte- og avgiftskrav (skattebetalingsloven)',
      'LOV-1999-03-26-14': 'Lov om skatt av formue og inntekt (skatteloven)'
    };
    
    // Check for exact match first
    if (lawMap[identifier]) {
      return lawMap[identifier];
    }
    
    // Fallback patterns for common law types
    if (identifier.includes('regnskaps') || identifier === 'LOV-1998-07-17-56') return 'Lov om årsregnskap m.v. (regnskapsloven)';
    if (identifier.includes('revisor') || identifier === 'LOV-1999-01-15-2') return 'Lov om revisor og revisjon (revisorloven)';
    if (identifier.includes('aksje') && !identifier.includes('allmenn')) return 'Lov om aksjeselskaper (aksjeloven)';
    if (identifier.includes('allmennaksje')) return 'Lov om allmennaksjeselskaper (allmennaksjeloven)';
    if (identifier.includes('bokføring')) return 'Lov om bokføring (bokføringsloven)';
    
    // Generic fallback for LOV format
    if (identifier.match(/^LOV-\d{4}-/)) {
      return `Lov ${identifier}`;
    }
    
    return identifier.charAt(0).toUpperCase() + identifier.slice(1);
  };

  const columns: StandardDataTableColumn<LegalProvision>[] = [
    {
      key: 'law_identifier',
      header: 'Lovkode',
      accessor: 'law_identifier',
      sortable: true,
      searchable: true,
      format: (value) => (
        <div className="font-mono text-sm">{value}</div>
      )
    },
    {
      key: 'law_full_name',
      header: 'Lovnavn',
      accessor: 'law_full_name',
      sortable: true,
      searchable: true,
      format: (value, item) => (
        <div className="font-medium text-sm">
          {value || getReadableLawName(item.law_identifier)}
        </div>
      )
    },
    {
      key: 'provision_number',
      header: 'Paragraf',
      accessor: 'provision_number',
      sortable: true,
      searchable: true,
      format: (value) => (
        <Badge variant="outline" className="font-mono">
          § {value}
        </Badge>
      )
    },
    {
      key: 'title',
      header: 'Tittel',
      accessor: 'title',
      sortable: true,
      searchable: true,
      format: (value) => (
        <div className="max-w-md">
          <div className="font-medium text-sm truncate">{value}</div>
        </div>
      )
    },
    {
      key: 'provision_type',
      header: 'Type',
      accessor: 'provision_type',
      sortable: true,
      format: (value) => (
        <Badge variant="secondary" className="text-xs">
          {value}
        </Badge>
      )
    },
    {
      key: 'content',
      header: 'Innhold',
      accessor: 'content',
      searchable: true,
      format: (value) => (
        <div className="max-w-xs">
          {value ? (
            <div className="text-sm text-muted-foreground truncate">
              {value.substring(0, 100)}...
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">Ingen innhold</div>
          )}
        </div>
      )
    },
    {
      key: 'valid_from',
      header: 'Gyldig fra',
      accessor: 'valid_from',
      sortable: true,
      align: 'center',
      format: (value) => value ? new Date(value).toLocaleDateString('nb-NO') : 'Ikke satt'
    },
    {
      key: 'actions',
      header: 'Handlinger',
      accessor: 'id',
      align: 'center',
      format: (_, item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onLawClick?.(item.law_identifier, item.law_full_name || item.law_identifier)}
          className="flex items-center gap-1 text-xs"
        >
          <Upload className="h-3 w-3" />
          Last opp flere
        </Button>
      )
    }
  ];

  return (
    <StandardDataTable
      title="Juridiske Bestemmelser"
      description="Oversikt over alle juridiske bestemmelser i kunnskapsbasen"
      data={provisions}
      columns={columns}
      isLoading={isLoading}
      error={error}
      tableName="legal-provisions"
      exportFileName="juridiske-bestemmelser-export"
      enableNorwegianCharacters={true}
      autoFixColumnAlignment={true}
    />
  );
};

export default LegalProvisionsTable;