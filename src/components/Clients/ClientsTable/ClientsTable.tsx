
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EquityBadge from "./EquityBadge";
import TestDataBadge from "./TestDataBadge";
import { Client } from "@/types/revio";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Upload, RefreshCw, Settings, Filter } from 'lucide-react';

interface ClientsTableProps {
  clients: Client[];
  onRowSelect?: (client: Client) => void;
  selectedClientId?: string | null;
  // Search and filter props
  searchTerm: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  departments: string[];
  groupFilter: string;
  onGroupChange: (value: string) => void;
  groups: string[];
  // Action props
  onRefresh: () => void;
  isRefreshing: boolean;
  hasApiError: boolean;
  refreshProgress?: number;
  onAddClient: () => void;
  onBulkImport: () => void;
  // Advanced features
  onShowAdvancedFilters: () => void;
  onShowColumnsConfig: () => void;
}

const phaseOrder = {
  engagement: 1,
  planning: 2,
  execution: 3,
  completion: 4,
  risk_assessment: 5,
  reporting: 6,
  overview: 7,
} as const;

const getMunicipality = (client: Client) =>
  client.municipality_name?.trim()?.length
    ? client.municipality_name
    : client.municipality_code?.trim()?.length
    ? client.municipality_code
    : "—";

const engagementTypeOrder: Record<string, number> = {
  revisjon: 1,
  regnskap: 2,
  annet: 3,
};

const engagementTypeLabel = (t?: Client["engagement_type"]) => {
  if (t === 'revisjon') return 'Revisjon';
  if (t === 'regnskap') return 'Regnskap';
  if (t === 'annet') return 'Annet';
  return '—';
};

const ClientsTable = ({ 
  clients, 
  onRowSelect, 
  selectedClientId,
  searchTerm,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  departments,
  groupFilter,
  onGroupChange,
  groups,
  onRefresh,
  isRefreshing,
  hasApiError,
  refreshProgress,
  onAddClient,
  onBulkImport,
  onShowAdvancedFilters,
  onShowColumnsConfig
}: ClientsTableProps) => {
  const navigate = useNavigate();

  const columns: StandardDataTableColumn<Client>[] = [
    {
      key: "client",
      header: "Klient",
      accessor: (row) => row.name ?? "",
      sortable: true,
      required: true,
      format: (_v, row) => (
        <div className="flex items-center gap-2">
          <span>{row.name?.trim() || "—"}</span>
          <TestDataBadge isTestData={row.is_test_data} />
        </div>
      ),
    },
    {
      key: "phase",
      header: "Fase",
      accessor: (row) => row.phase,
      sortAccessor: (row) => phaseOrder[row.phase as keyof typeof phaseOrder] ?? 999,
      sortable: true,
      format: (_value, row) => {
        const map = {
          engagement: { label: "Oppdrag", variant: "outline" },
          planning: { label: "Planlegging", variant: "secondary" },
          execution: { label: "Gjennomføring", variant: "default" },
          completion: { label: "Avslutning", variant: "success" },
          risk_assessment: { label: "Risikovurdering", variant: "warning" },
          reporting: { label: "Rapportering", variant: "default" },
          overview: { label: "Oversikt", variant: "secondary" },
        } as const;
        const info = (map as any)[row.phase] || { label: row.phase, variant: "outline" };
        return <Badge variant={info.variant as any}>{info.label}</Badge>;
      },
    },
    {
      key: "progress",
      header: "Progresjon",
      accessor: (row) => row.progress ?? 0,
      sortable: true,
      format: (value) => (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Number(value) ?? 0}%` }}></div>
          </div>
          <span className="text-xs text-gray-500">{Number(value) ?? 0}%</span>
        </div>
      ),
    },
    { key: "org", header: "Org.nummer", accessor: (row) => row.org_number || "—", sortable: true },
    { key: "municipality", header: "Kommune", accessor: (row) => getMunicipality(row), sortable: true },
    {
      key: "mva_registered",
      header: "MVA",
      accessor: (row) => (row.mva_registered ? "Ja" : "Nei"),
      sortable: true,
      format: (_v, row) => (
        <Badge variant={row.mva_registered ? 'success' as any : 'outline'}>
          {row.mva_registered ? 'Ja' : 'Nei'}
        </Badge>
      ),
    },
    {
      key: "nace_code",
      header: "Bransjekode",
      accessor: (row) => row.nace_code?.trim() || "—",
      sortable: true,
    },
    {
      key: "nace_description",
      header: "Bransjenavn",
      accessor: (row) => row.nace_description?.trim() || "—",
      sortable: true,
    },
      {
        key: "accountant_name",
        header: "Regnskapsfører",
        accessor: (row) => row.accountant_name?.trim() || "—",
        sortable: true,
      },
      {
        key: "partner",
        header: "Partner",
        accessor: (row) => row.partner?.trim() || "—",
        sortable: true,
      },
      {
        key: "account_manager",
        header: "Kundeansvarlig",
        accessor: (row) => row.ansv?.trim() || row.account_manager?.trim() || "—",
        sortable: true,
      },
      {
        key: "accounting_system",
        header: "Regnskapssystem",
        accessor: (row) => row.accounting_system?.trim() || "—",
        sortable: true,
      },
      {
        key: "engagement_type",
        header: "Type oppdrag",
        accessor: (row) => engagementTypeLabel(row.engagement_type),
        sortAccessor: (row) => engagementTypeOrder[row.engagement_type || ''] ?? 999,
        sortable: true,
        format: (_v, row) => (
          <Badge variant="secondary">{engagementTypeLabel(row.engagement_type)}</Badge>
        ),
      },

    {
      key: "capital",
      header: "Kapital",
      accessor: (row) => row,
      format: (_v, row) => (
        <EquityBadge equityCapital={row.equity_capital} shareCapital={row.share_capital} />
      ),
    },
    { key: "department", header: "Avdeling", accessor: (row) => row.department?.trim() || "—", sortable: true },
    { key: "group", header: "Gruppe", accessor: (row) => row.client_group?.trim() || "—", sortable: true },

    // Ekstra kolonner: Budsjett og bransje (valgbare via kolonnemanager)
    {
      key: "budget_amount",
      header: "Budsjett (kr)",
      accessor: (row) => (row.budget_amount ?? null) as any,
      sortAccessor: (row) => Number(row.budget_amount ?? 0),
      sortable: true,
      format: (v) =>
        v == null ? "—" : new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(Number(v)),
    },
    {
      key: "budget_hours",
      header: "Budsjett timer",
      accessor: (row) => (row.budget_hours ?? null) as any,
      sortAccessor: (row) => Number(row.budget_hours ?? 0),
      sortable: true,
      format: (v) =>
        v == null ? "—" : new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(Number(v)),
    },
    {
      key: "actual_industry",
      header: "Faktisk bransje",
      accessor: (row) => row.actual_industry?.trim() || "—",
      sortable: true,
    },

    // New "Aktiv" column
    {
      key: "is_active",
      header: "Aktiv",
      accessor: (row) => ((row as any).is_active !== false ? "Ja" : "Nei"),
      sortable: true,
      format: (_v, row) => {
        const active = (row as any).is_active !== false; // default to Ja if undefined (demo data)
        return (
          <Badge variant={active ? ('success' as any) : ('destructive' as any)}>
            {active ? 'Ja' : 'Nei'}
          </Badge>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Klientliste</CardTitle>
        
        {/* Search and Filters Toolbar */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Søk etter klienter..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters and Actions */}
          <div className="flex flex-wrap gap-2">
            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={onDepartmentChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Alle avdelinger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle avdelinger</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Group Filter */}
            <Select value={groupFilter} onValueChange={onGroupChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Alle grupper" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle grupper</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Action Buttons */}
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onShowAdvancedFilters}
              >
                <Filter size={16} />
                Avanserte filtre
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={onShowColumnsConfig}
              >
                <Settings size={16} />
                Kolonner
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? `${refreshProgress || 0}%` : 'Refresh BRREG'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={onBulkImport}
              >
                <Upload size={16} />
                Bulk import
              </Button>
              
              <Button 
                size="sm"
                onClick={onAddClient}
              >
                <Plus size={16} />
                Ny klient
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <StandardDataTable
          title=""
          data={clients}
          columns={columns}
          exportFileName="klienter"
          enablePdfExport={true}
          pdfTitle="Klientoversikt"
          preferencesKey="clients-table-columns"
          defaultColumnState={[
            { key: "client", visible: true, pinnedLeft: true },
            { key: "phase", visible: true },
            { key: "progress", visible: true },
            { key: "org", visible: true },
            { key: "municipality", visible: true },
            { key: "mva_registered", visible: true },
            { key: "nace_code", visible: false },
            { key: "nace_description", visible: false },
             { key: "accountant_name", visible: false },
             { key: "partner", visible: false },
             { key: "account_manager", visible: false },
             { key: "accounting_system", visible: false },
             { key: "engagement_type", visible: true },
             { key: "capital", visible: true },
             { key: "department", visible: true },
             { key: "group", visible: true },
             { key: "budget_amount", visible: false },
             { key: "budget_hours", visible: false },
             { key: "actual_industry", visible: false },
             { key: "is_active", visible: true },
          ]}
          onRowClick={(row) => {
            onRowSelect?.(row);
            navigate(`/clients/${row.id}/dashboard`);
          }}
          getRowClassName={(row) => (selectedClientId === row.id ? "bg-muted" : "")}
          stickyHeader
          maxBodyHeight="60vh"
          wrapInCard={false}
          showSearch={false}
          emptyMessage="Ingen klienter funnet"
          tableName="Klienter"
          disableViews={true}
        />
      </CardContent>
    </Card>
  );
};

export default ClientsTable;
