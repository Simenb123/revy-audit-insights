import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type InvestmentSecurity = Database['public']['Tables']['investment_securities']['Row'];
type CountryRiskClassification = Database['public']['Tables']['country_risk_classifications']['Row'];

export function useInvestmentSecurities() {
  const [securities, setSecurities] = useState<InvestmentSecurity[]>([]);
  const [countryRisks, setCountryRisks] = useState<CountryRiskClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch securities and country risk classifications
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch securities
      const { data: securitiesData, error: securitiesError } = await supabase
        .from('investment_securities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (securitiesError) throw securitiesError;

      // Fetch country risk classifications
      const { data: countryData, error: countryError } = await supabase
        .from('country_risk_classifications')
        .select('*')
        .eq('is_active', true)
        .order('country_name');

      if (countryError) throw countryError;

      setSecurities(securitiesData || []);
      setCountryRisks(countryData || []);
    } catch (error) {
      console.error('Error fetching investment data:', error);
      toast({
        variant: "destructive",
        title: "Feil ved henting av data",
        description: "Kunne ikke laste verdipapirer og risikoklassifiseringer."
      });
    } finally {
      setLoading(false);
    }
  };

  const createSecurity = async (securityData: {
    isin_code: string;
    name: string;
    security_type: string;
    country_code?: string;
    currency_code: string;
    exchange?: string;
    sector?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('investment_securities')
        .insert(securityData)
        .select()
        .single();

      if (error) throw error;

      setSecurities(prev => [data, ...prev]);
      
      toast({
        title: "Verdipapir opprettet",
        description: `${data.name} (${data.isin_code}) er registrert.`
      });

      return data;
    } catch (error) {
      console.error('Error creating security:', error);
      toast({
        variant: "destructive",
        title: "Feil ved opprettelse",
        description: "Kunne ikke opprette verdipapir. Sjekk at ISIN-koden ikke allerede eksisterer."
      });
      throw error;
    }
  };

  const updateSecurity = async (id: string, updates: Partial<InvestmentSecurity>) => {
    try {
      const { data, error } = await supabase
        .from('investment_securities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSecurities(prev => prev.map(sec => sec.id === id ? data : sec));
      
      toast({
        title: "Verdipapir oppdatert",
        description: "Endringene er lagret."
      });

      return data;
    } catch (error) {
      console.error('Error updating security:', error);
      toast({
        variant: "destructive",
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere verdipapir."
      });
      throw error;
    }
  };

  const deleteSecurity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('investment_securities')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setSecurities(prev => prev.filter(sec => sec.id !== id));
      
      toast({
        title: "Verdipapir slettet",
        description: "Verdipapiret er deaktivert."
      });
    } catch (error) {
      console.error('Error deleting security:', error);
      toast({
        variant: "destructive",
        title: "Feil ved sletting",
        description: "Kunne ikke slette verdipapir."
      });
      throw error;
    }
  };

  const getRiskClassificationForCountry = (countryCode: string): CountryRiskClassification | undefined => {
    return countryRisks.find(risk => risk.country_code === countryCode);
  };

  return {
    securities,
    countryRisks,
    loading,
    createSecurity,
    updateSecurity,
    deleteSecurity,
    getRiskClassificationForCountry,
    refetch: fetchData
  };
}