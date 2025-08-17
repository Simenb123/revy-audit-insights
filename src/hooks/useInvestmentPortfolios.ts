import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type InvestmentPortfolio = Database['public']['Tables']['investment_portfolios']['Row'];
type InvestmentHolding = Database['public']['Tables']['investment_holdings']['Row'];
type InvestmentTransaction = Database['public']['Tables']['investment_transactions']['Row'];
type PortfolioValuation = Database['public']['Tables']['portfolio_valuations']['Row'];

interface PortfolioWithSummary {
  id: string;
  portfolio_name: string;
  client_id: string;
  portfolio_type: string;
  currency_code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  total_holdings?: number;
  total_cost_basis?: number;
  total_market_value?: number;
  total_unrealized_gain_loss?: number;
  total_return_percentage?: number;
}

interface HoldingWithDetails {
  id: string;
  portfolio_id: string;
  security_id: string;
  quantity: number;
  average_cost_price?: number;
  cost_price_currency?: string;
  acquisition_date?: string;
  holding_type: string;
  cost_basis?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  security_name?: string;
  isin_code?: string;
  current_price?: number;
  market_value?: number;
  unrealized_gain_loss?: number;
  return_percentage?: number;
}

export function useInvestmentPortfolios() {
  const [portfolios, setPortfolios] = useState<PortfolioWithSummary[]>([]);
  const [holdings, setHoldings] = useState<HoldingWithDetails[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch portfolios with summary data
      const { data: portfoliosData, error: portfoliosError } = await supabase
        .from('portfolio_summaries')
        .select('*')
        .order('portfolio_name');

      if (portfoliosError) throw portfoliosError;

      // Fetch current holdings with market values
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('current_portfolio_holdings')
        .select('*')
        .order('security_name');

      if (holdingsError) throw holdingsError;

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('investment_transactions')
        .select(`
          *,
          investment_holdings!inner (
            id,
            investment_portfolios!inner (
              portfolio_name
            ),
            investment_securities!inner (
              name,
              isin_code
            )
          )
        `)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;

      setPortfolios((portfoliosData as any) || []);
      setHoldings((holdingsData as any) || []);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      toast({
        variant: "destructive",
        title: "Feil ved henting av data",
        description: "Kunne ikke laste porteføljedata."
      });
    } finally {
      setLoading(false);
    }
  };

  const createPortfolio = async (portfolioData: {
    client_id: string;
    portfolio_name: string;
    portfolio_type?: string;
    currency_code?: string;
    description?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('investment_portfolios')
        .insert({
          ...portfolioData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setPortfolios(prev => [data, ...prev]);
      
      toast({
        title: "Portefølje opprettet",
        description: `Porteføljen "${portfolioData.portfolio_name}" er opprettet.`
      });

      return data;
    } catch (error) {
      console.error('Error creating portfolio:', error);
      toast({
        variant: "destructive",
        title: "Feil ved opprettelse",
        description: "Kunne ikke opprette portefølje."
      });
      throw error;
    }
  };

  const updatePortfolio = async (id: string, updates: Partial<InvestmentPortfolio>) => {
    try {
      const { data, error } = await supabase
        .from('investment_portfolios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPortfolios(prev => prev.map(portfolio => 
        portfolio.id === id ? { ...portfolio, ...data } : portfolio
      ));
      
      toast({
        title: "Portefølje oppdatert",
        description: "Endringene er lagret."
      });

      return data;
    } catch (error) {
      console.error('Error updating portfolio:', error);
      toast({
        variant: "destructive",
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere portefølje."
      });
      throw error;
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      const { error } = await supabase
        .from('investment_portfolios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPortfolios(prev => prev.filter(portfolio => portfolio.id !== id));
      
      toast({
        title: "Portefølje slettet",
        description: "Porteføljen er fjernet."
      });
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      toast({
        variant: "destructive",
        title: "Feil ved sletting",
        description: "Kunne ikke slette portefølje."
      });
      throw error;
    }
  };

  const createHolding = async (holdingData: {
    portfolio_id: string;
    security_id: string;
    quantity: number;
    average_cost_price?: number;
    cost_price_currency?: string;
    acquisition_date?: string;
    cost_basis?: number;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('investment_holdings')
        .insert({
          ...holdingData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select(`
          *,
          investment_securities (
            name,
            isin_code,
            currency_code
          )
        `)
        .single();

      if (error) throw error;

      // Refresh holdings data
      await fetchData();
      
      toast({
        title: "Beholdning registrert",
        description: "Den nye beholdningen er lagt til porteføljen."
      });

      return data;
    } catch (error) {
      console.error('Error creating holding:', error);
      toast({
        variant: "destructive",
        title: "Feil ved registrering",
        description: "Kunne ikke registrere beholdning."
      });
      throw error;
    }
  };

  const updateHolding = async (id: string, updates: Partial<InvestmentHolding>) => {
    try {
      const { data, error } = await supabase
        .from('investment_holdings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Refresh holdings data
      await fetchData();
      
      toast({
        title: "Beholdning oppdatert",
        description: "Endringene er lagret."
      });

      return data;
    } catch (error) {
      console.error('Error updating holding:', error);
      toast({
        variant: "destructive",
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere beholdning."
      });
      throw error;
    }
  };

  const deleteHolding = async (id: string) => {
    try {
      const { error } = await supabase
        .from('investment_holdings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHoldings(prev => prev.filter(holding => holding.id !== id));
      
      toast({
        title: "Beholdning slettet",
        description: "Beholdningen er fjernet."
      });
    } catch (error) {
      console.error('Error deleting holding:', error);
      toast({
        variant: "destructive",
        title: "Feil ved sletting",
        description: "Kunne ikke slette beholdning."
      });
      throw error;
    }
  };

  const createTransaction = async (transactionData: any): Promise<null> => {
    // Transaction creation will be implemented when table structure is finalized
    toast({
      title: "Ikke implementert",
      description: "Transaksjonsfunksjonalitet kommer snart."
    });
    return null;
  };

  const getPortfolioHoldings = (portfolioId: string) => {
    return holdings.filter(holding => holding.portfolio_id === portfolioId);
  };

  const getHoldingTransactions = (holdingId: string): any[] => {
    return []; // Transactions will be implemented when table structure is finalized
  };

  const getPortfolioSummary = (portfolioId: string) => {
    return portfolios.find(portfolio => portfolio.id === portfolioId);
  };

  return {
    portfolios,
    holdings,
    transactions,
    loading,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    createHolding,
    updateHolding,
    deleteHolding,
    createTransaction,
    getPortfolioHoldings,
    getHoldingTransactions,
    getPortfolioSummary,
    refetch: fetchData
  };
}