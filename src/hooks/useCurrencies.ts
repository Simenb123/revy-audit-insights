import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Currency = Database['public']['Tables']['currencies']['Row'];
type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row'];

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch currencies
      const { data: currenciesData, error: currenciesError } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('currency_code');

      if (currenciesError) throw currenciesError;

      // Fetch exchange rates
      const { data: ratesData, error: ratesError } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('rate_date', { ascending: false });

      if (ratesError) throw ratesError;

      setCurrencies(currenciesData || []);
      setExchangeRates(ratesData || []);
    } catch (error) {
      console.error('Error fetching currency data:', error);
      toast({
        variant: "destructive",
        title: "Feil ved henting av data",
        description: "Kunne ikke laste valutaer og kurser."
      });
    } finally {
      setLoading(false);
    }
  };

  const createExchangeRate = async (rateData: {
    from_currency_code: string;
    to_currency_code: string;
    rate_date: string;
    exchange_rate: number;
    source?: string;
    source_reference?: string;
    is_year_end?: boolean;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .insert({
          ...rateData,
          to_currency_code: rateData.to_currency_code || 'NOK'
        })
        .select()
        .single();

      if (error) throw error;

      setExchangeRates(prev => [data, ...prev]);
      
      toast({
        title: "Valutakurs registrert",
        description: `Kursen for ${rateData.from_currency_code}/${rateData.to_currency_code || 'NOK'} på ${rateData.rate_date} er lagret.`
      });

      return data;
    } catch (error) {
      console.error('Error creating exchange rate:', error);
      toast({
        variant: "destructive",
        title: "Feil ved registrering",
        description: "Kunne ikke registrere valutakurs. Sjekk at dato og valutapar ikke allerede eksisterer."
      });
      throw error;
    }
  };

  const updateExchangeRate = async (id: string, updates: Partial<ExchangeRate>) => {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setExchangeRates(prev => prev.map(rate => rate.id === id ? data : rate));
      
      toast({
        title: "Valutakurs oppdatert",
        description: "Endringene er lagret."
      });

      return data;
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      toast({
        variant: "destructive",
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere valutakurs."
      });
      throw error;
    }
  };

  const deleteExchangeRate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exchange_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExchangeRates(prev => prev.filter(rate => rate.id !== id));
      
      toast({
        title: "Valutakurs slettet",
        description: "Kursen er fjernet."
      });
    } catch (error) {
      console.error('Error deleting exchange rate:', error);
      toast({
        variant: "destructive",
        title: "Feil ved sletting",
        description: "Kunne ikke slette valutakurs."
      });
      throw error;
    }
  };

  const getLatestRate = (fromCurrency: string, toCurrency: string = 'NOK') => {
    return exchangeRates
      .filter(rate => rate.from_currency_code === fromCurrency && rate.to_currency_code === toCurrency)
      .sort((a, b) => new Date(b.rate_date).getTime() - new Date(a.rate_date).getTime())[0];
  };

  const getYearEndRates = () => {
    return exchangeRates.filter(rate => rate.is_year_end);
  };

  const getCurrencyByCode = (code: string) => {
    return currencies.find(currency => currency.currency_code === code);
  };

  const getBaseCurrency = () => {
    return currencies.find(currency => currency.is_base_currency) || currencies.find(c => c.currency_code === 'NOK');
  };

  const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string = 'NOK', date?: string) => {
    if (fromCurrency === toCurrency) return amount;

    try {
      const { data, error } = await supabase.rpc('convert_currency', {
        p_amount: amount,
        p_from_currency: fromCurrency,
        p_to_currency: toCurrency,
        p_date: date || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error converting currency:', error);
      return null;
    }
  };

  return {
    currencies,
    exchangeRates,
    loading,
    createExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    getLatestRate,
    getYearEndRates,
    getCurrencyByCode,
    getBaseCurrency,
    convertAmount,
    refetch: fetchData
  };
}