
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEmployees } from "@/hooks/useEmployees";
import { useCurrentFirmId } from "@/hooks/useCurrentFirmId";
import { useSetEmployeeRate } from "@/hooks/useEmployeeBillingRates";
import { useEffectiveBillingRates } from "@/hooks/useEffectiveBillingRates";

function formatNOK(n?: number | null) {
  if (typeof n !== "number" || isNaN(n)) return "—";
  return n.toLocaleString("nb-NO", { maximumFractionDigits: 0 }) + " kr";
}

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

const defaultStart = () => {
  const today = new Date();
  // Default to first day of current month for simple period starts
  return toISO(new Date(today.getFullYear(), today.getMonth(), 1));
};

const BillingRatesManager: React.FC = () => {
  const { data: employees = [] } = useEmployees();
  const { data: firmId } = useCurrentFirmId();

  const [effectiveDate, setEffectiveDate] = React.useState<string>(defaultStart());
  const [newRateByUser, setNewRateByUser] = React.useState<Record<string, number>>({});

  const userIds = React.useMemo(() => employees.map((e) => e.id), [employees]);

  const { data: effectiveRates = {} } = useEffectiveBillingRates({
    userIds,
    dateISO: effectiveDate,
  });

  const setRateMutation = useSetEmployeeRate();

  const billingColumns: StandardDataTableColumn<any>[] = [
    {
      key: 'employee_name',
      header: 'Medarbeider',
      accessor: (employee) => `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || employee.email || employee.id,
      sortable: true,
      searchable: true,
      format: (value, employee) => (
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          <span className="text-xs text-muted-foreground capitalize">{employee.user_role ?? "employee"}</span>
        </div>
      )
    },
    {
      key: 'current_rate',
      header: 'Aktiv sats',
      accessor: (employee) => effectiveRates[employee.id],
      align: 'right',
      format: (value) => formatNOK(value)
    },
    {
      key: 'new_rate_input',
      header: 'Ny sats',
      accessor: () => '',
      align: 'right',
      format: (_, employee) => (
        <Input
          inputMode="decimal"
          placeholder="f.eks. 2000"
          className="w-28 ml-auto text-right"
          value={newRateByUser[employee.id] ?? ""}
          onChange={(ev) => {
            const v = parseFloat(ev.target.value);
            setNewRateByUser((prev) => ({ ...prev, [employee.id]: isNaN(v) ? 0 : v }));
          }}
          aria-label={`Ny timesats for ${employee.first_name ?? employee.email ?? employee.id}`}
        />
      )
    },
    {
      key: 'valid_from',
      header: 'Gyldig fra',
      accessor: () => effectiveDate,
      align: 'right',
      format: () => (
        <Input type="date" className="w-36 ml-auto text-right" value={effectiveDate} readOnly />
      )
    },
    {
      key: 'actions',
      header: '',
      accessor: () => '',
      align: 'right',
      format: (_, employee) => (
        <Button
          variant="default"
          disabled={!firmId || !newRateByUser[employee.id] || newRateByUser[employee.id] <= 0 || setRateMutation.isPending}
          onClick={() => {
            if (!firmId) return;
            const rate = Number(newRateByUser[employee.id] ?? 0);
            if (!rate || rate <= 0) return;
            setRateMutation.mutate({
              firmId,
              userId: employee.id,
              hourlyRate: rate,
              validFromISO: effectiveDate,
            });
          }}
        >
          Lagre
        </Button>
      )
    }
  ];

  return (
    <StandardDataTable
      title="Timesatser (NOK)"
      description="Administrer timesatser for medarbeidere"
      data={employees}
      columns={billingColumns}
      tableName="billing-rates"
      exportFileName="timesatser"
      emptyMessage="Ingen ansatte funnet."
      icon={
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm text-muted-foreground">Vis aktiv sats pr. dato</label>
          <Input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
      }
    />
  );
};

export default BillingRatesManager;
