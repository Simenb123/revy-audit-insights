
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle>Timesatser (NOK)</CardTitle>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Vis aktiv sats pr. dato</label>
          <Input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="w-[180px]"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medarbeider</TableHead>
                <TableHead className="text-right">Aktiv sats</TableHead>
                <TableHead className="text-right">Ny sats</TableHead>
                <TableHead className="text-right">Gyldig fra</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{`${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || e.email || e.id}</span>
                      <span className="text-xs text-muted-foreground capitalize">{e.user_role ?? "employee"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNOK(effectiveRates[e.id])}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      inputMode="decimal"
                      placeholder="f.eks. 2000"
                      className="w-28 ml-auto text-right"
                      value={newRateByUser[e.id] ?? ""}
                      onChange={(ev) => {
                        const v = parseFloat(ev.target.value);
                        setNewRateByUser((prev) => ({ ...prev, [e.id]: isNaN(v) ? 0 : v }));
                      }}
                      aria-label={`Ny timesats for ${e.first_name ?? e.email ?? e.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input type="date" className="w-36 ml-auto text-right" value={effectiveDate} readOnly />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="default"
                      disabled={!firmId || !newRateByUser[e.id] || newRateByUser[e.id] <= 0 || setRateMutation.isPending}
                      onClick={() => {
                        if (!firmId) return;
                        const rate = Number(newRateByUser[e.id] ?? 0);
                        if (!rate || rate <= 0) return;
                        setRateMutation.mutate({
                          firmId,
                          userId: e.id,
                          hourlyRate: rate,
                          validFromISO: effectiveDate,
                        });
                      }}
                    >
                      Lagre
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Ingen ansatte funnet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingRatesManager;
