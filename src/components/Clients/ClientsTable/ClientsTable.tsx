
import {
  Badge
} from "@/components/ui/badge";
import DataTable, { DataTableColumn } from "@/components/ui/data-table";
import EquityBadge from "./EquityBadge";
import TestDataBadge from "./TestDataBadge";
import { Client } from "@/types/revio";
import { useNavigate } from "react-router-dom";

interface ClientsTableProps {
  clients: Client[];
  onRowSelect?: (client: Client) => void;
  selectedClientId?: string | null;
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

const ClientsTable = ({ clients, onRowSelect, selectedClientId }: ClientsTableProps) => {
  const navigate = useNavigate();

  const columns: DataTableColumn<Client>[] = [
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
      key: "capital",
      header: "Kapital",
      accessor: (row) => row,
      format: (_v, row) => (
        <EquityBadge equityCapital={row.equity_capital} shareCapital={row.share_capital} />
      ),
    },
    { key: "department", header: "Avdeling", accessor: (row) => row.department?.trim() || "—", sortable: true },
    { key: "group", header: "Gruppe", accessor: (row) => row.client_group?.trim() || "—", sortable: true },
  ];

  return (
    <DataTable
      title="Klienter"
      data={clients}
      columns={columns}
      enableExport={false}
      enableColumnManager
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
        { key: "capital", visible: true },
        { key: "department", visible: true },
        { key: "group", visible: true },
      ]}
      onRowClick={(row) => {
        onRowSelect?.(row);
        navigate(`/clients/${row.id}`);
      }}
      getRowClassName={(row) => (selectedClientId === row.id ? "bg-muted" : "")}
      stickyHeader
      maxBodyHeight="70vh"
      wrapInCard={false}
      showSearch={false}
      emptyMessage="Ingen klienter funnet"
    />
  );
};

export default ClientsTable;
