import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type HistoricalPrice = Database['public']['Tables']['historical_prices']['Row'];
type InvestmentSecurity = Database['public']['Tables']['investment_securities']['Row'];

export function useHistoricalPrices() {
  const [prices, setPrices] = useState<HistoricalPrice[]>([]);
  const [securities, setSecurities] = useState<InvestmentSecurity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch historical prices with security details
      const { data: pricesData, error: pricesError } = await supabase
        .from('historical_prices')
        .select(`
          *,
          investment_securities (
            id,
            name,
            isin_code,
            currency_code
          )
        `)
        .order('price_date', { ascending: false });

      if (pricesError) throw pricesError;

      // Fetch all securities for dropdowns
      const { data: securitiesData, error: securitiesError } = await supabase
        .from('investment_securities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (securitiesError) throw securitiesError;

      setPrices(pricesData || []);
      setSecurities(securitiesData || []);
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      toast({
        variant: "destructive",
        title: "Feil ved henting av data",
        description: "Kunne ikke laste historiske kurser."
      });
    } finally {
      setLoading(false);
    }
  };

  const createPrice = async (priceData: {
    security_id: string;
    price_date: string;
    closing_price: number;
    opening_price?: number;
    high_price?: number;
    low_price?: number;
    volume?: number;
    currency_code: string;
    source?: string;
    source_reference?: string;
    is_year_end?: boolean;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('historical_prices')
        .insert(priceData)
        .select(`
          *,
          investment_securities (
            id,
            name,
            isin_code,
            currency_code
          )
        `)
        .single();

      if (error) throw error;

      setPrices(prev => [data, ...prev]);
      
      toast({
        title: "Kurs registrert",
        description: `Kursen for ${priceData.price_date} er lagret.`
      });

      return data;
    } catch (error) {
      console.error('Error creating price:', error);
      toast({
        variant: "destructive",
        title: "Feil ved registrering",
        description: "Kunne ikke registrere kurs. Sjekk at dato og verdipapir ikke allerede eksisterer."
      });
      throw error;
    }
  };

  const updatePrice = async (id: string, updates: Partial<HistoricalPrice>) => {
    try {
      const { data, error } = await supabase
        .from('historical_prices')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          investment_securities (
            id,
            name,
            isin_code,
            currency_code
          )
        `)
        .single();

      if (error) throw error;

      setPrices(prev => prev.map(price => price.id === id ? data : price));
      
      toast({
        title: "Kurs oppdatert",
        description: "Endringene er lagret."
      });

      return data;
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        variant: "destructive",
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere kurs."
      });
      throw error;
    }
  };

  const deletePrice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('historical_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrices(prev => prev.filter(price => price.id !== id));
      
      toast({
        title: "Kurs slettet",
        description: "Kursen er fjernet."
      });
    } catch (error) {
      console.error('Error deleting price:', error);
      toast({
        variant: "destructive",
        title: "Feil ved sletting",
        description: "Kunne ikke slette kurs."
      });
      throw error;
    }
  };

  const getPricesForSecurity = (securityId: string) => {
    return prices.filter(price => price.security_id === securityId);
  };

  const getYearEndPrices = () => {
    return prices.filter(price => price.is_year_end);
  };

  const getLatestPriceForSecurity = (securityId: string) => {
    const securityPrices = getPricesForSecurity(securityId);
    return securityPrices.length > 0 ? securityPrices[0] : null;
  };

  return {
    prices,
    securities,
    loading,
    createPrice,
    updatePrice,
    deletePrice,
    getPricesForSecurity,
    getYearEndPrices,
    getLatestPriceForSecurity,
    refetch: fetchData
  };
}