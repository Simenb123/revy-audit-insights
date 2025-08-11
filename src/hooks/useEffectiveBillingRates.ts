
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EffectiveRatesMap = Record<string, number | null>;

/**
 * Fetch effective billing rates (NOK) for a set of users on a given date, optionally for a specific client.
 * Uses the database function public.get_effective_billing_rate.
 */
export const useEffectiveBillingRates = (params: {
  userIds: string[];
  dateISO: string | null | undefined;
  clientId?: string | null;
}) => {
  const { userIds, dateISO, clientId } = params;

  return useQuery({
    queryKey: ["effective-billing-rates", userIds.sort().join(","), dateISO, clientId ?? null],
    enabled: !!dateISO && Array.isArray(userIds) && userIds.length > 0,
    queryFn: async (): Promise<EffectiveRatesMap> => {
      if (!dateISO || !userIds.length) return {};
      const entries = await Promise.all(
        userIds.map(async (uid) => {
          const { data, error } = await supabase.rpc("get_effective_billing_rate", {
            p_user_id: uid,
            p_date: dateISO,
            p_client_id: clientId ?? null,
          });
          if (error) throw error;
          return [uid, data as number | null] as const;
        })
      );
      const map: EffectiveRatesMap = {};
      entries.forEach(([uid, rate]) => {
        map[uid] = rate;
      });
      return map;
    },
    staleTime: 1000 * 60,
  });
};
