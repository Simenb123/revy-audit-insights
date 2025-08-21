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
  const columns: StandardDataTableColumn<LegalProvision>[] = [
    {
      key: 'law_identifier',
      header: 'Lov',
      accessor: 'law_identifier',
      sortable: true,
      searchable: true,
      format: (value, item) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{value}</div>
          {item.law_full_name && (
            <div className="text-xs text-muted-foreground">{item.law_full_name}</div>
          )}
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