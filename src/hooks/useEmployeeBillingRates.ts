
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EmployeeBillingRate {
  id: string;
  audit_firm_id: string;
  user_id: string;
  hourly_rate: number;
  valid_from: string; // ISO date
  valid_to: string | null;
  created_at: string;
  updated_at: string;
}

// List rates for a specific employee (history)
export const useEmployeeRates = (userId?: string) => {
  return useQuery({
    queryKey: ["employee-billing-rates", userId],
    enabled: !!userId,
    queryFn: async (): Promise<EmployeeBillingRate[]> => {
      if (!userId) return [];
      const { data, error } = await (supabase as any)
        .from("employee_billing_rates" as any)
        .select("*")
        .eq("user_id", userId)
        .order("valid_from", { ascending: false });

      if (error) throw error;
      return (data || []) as EmployeeBillingRate[];
    },
    staleTime: 1000 * 60 * 2,
  });
};

// Get active rate for date (falls back to null if none)
export const useActiveEmployeeRate = (userId?: string, dateISO?: string) => {
  return useQuery({
    queryKey: ["employee-active-rate", userId, dateISO],
    enabled: !!userId && !!dateISO,
    queryFn: async (): Promise<EmployeeBillingRate | null> => {
      if (!userId || !dateISO) return null;
      const { data, error } = await (supabase as any)
        .from("employee_billing_rates" as any)
        .select("*")
        .eq("user_id", userId)
        .lte("valid_from", dateISO)
        .or(`valid_to.is.null,valid_to.gte.${dateISO}`)
        .order("valid_from", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as EmployeeBillingRate) ?? null;
    },
    staleTime: 1000 * 60,
  });
};

type SetEmployeeRateInput = {
  firmId: string;
  userId: string;
  hourlyRate: number;
  validFromISO: string; // YYYY-MM-DD
};

// Sets a new rate effective from validFrom, and closes overlapping previous periods (valid_to = day before)
export const useSetEmployeeRate = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  function dayBefore(iso: string) {
    const d = new Date(iso);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  return useMutation({
    mutationFn: async (input: SetEmployeeRateInput) => {
      const { firmId, userId, hourlyRate, validFromISO } = input;

      // 1) Close any existing overlapping periods up to the day before
      // a) rows with open-ended valid_to IS NULL and valid_from <= validFrom
      {
        const { error } = await (supabase as any)
          .from("employee_billing_rates" as any)
          .update({ valid_to: dayBefore(validFromISO) } as any)
          .eq("audit_firm_id", firmId)
          .eq("user_id", userId)
          .is("valid_to", null)
          .lte("valid_from", validFromISO);
        if (error) throw error;
      }
      // b) rows where valid_to >= validFrom and valid_from <= validFrom
      {
        const { error } = await (supabase as any)
          .from("employee_billing_rates" as any)
          .update({ valid_to: dayBefore(validFromISO) } as any)
          .eq("audit_firm_id", firmId)
          .eq("user_id", userId)
          .gte("valid_to", validFromISO)
          .lte("valid_from", validFromISO);
        if (error) throw error;
      }

      // 2) Insert new rate period (open ended)
      const { error: insertErr } = await (supabase as any)
        .from("employee_billing_rates" as any)
        .insert({
          audit_firm_id: firmId,
          user_id: userId,
          hourly_rate: hourlyRate,
          valid_from: validFromISO,
          valid_to: null,
        } as any);
      if (insertErr) throw insertErr;
    },
    meta: {
      onError: (err: unknown) => {
        console.error("Failed to set employee rate:", err);
      },
    },
    onSuccess: (_data, vars) => {
      toast({
        title: "Lagret",
        description: "Timesats oppdatert.",
      });
      qc.invalidateQueries({ queryKey: ["employee-billing-rates", vars.userId] });
      qc.invalidateQueries({ queryKey: ["employee-active-rate", vars.userId] });
      qc.invalidateQueries({ queryKey: ["effective-billing-rates"] });
    },
    onError: (err: any) => {
      toast({
        title: "Feil ved lagring",
        description: err?.message ?? "Ukjent feil",
        variant: "destructive",
      });
    },
  });
};
