import { supabase } from '@/integrations/supabase/client';

// Hent Map<kode, navn> for active=true NA-koder fra database
export async function fetchNaeringsMapFromDB(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('naeringsspesifikasjon')
    .select('kode, navn')
    .eq('active', true);
  
  if (error) throw error;
  
  return new Map((data ?? []).map((r: any) => [String(r.kode), String(r.navn)]));
}