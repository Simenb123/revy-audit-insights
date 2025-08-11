
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";

export const useCurrentFirmId = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["current-firm-id", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async (): Promise<string | null> => {
      if (!session?.user?.id) return null;
      // any-cast until types include audit_firm_id
      const { data, error } = await (supabase as any)
        .from("profiles" as any)
        .select("audit_firm_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      return (data?.audit_firm_id as string) ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });
};
