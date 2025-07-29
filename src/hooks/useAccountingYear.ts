import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAccountingYear = (clientId: string) => {
  const [accountingYear, setAccountingYear] = useState<number>(2024);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    const fetchAccountingYear = async () => {
      try {
        const { data: client, error } = await supabase
          .from('clients')
          .select('current_accounting_year')
          .eq('id', clientId)
          .single();

        if (error) throw error;

        setAccountingYear(client.current_accounting_year || 2024);
      } catch (error) {
        console.error('Error fetching accounting year:', error);
        setAccountingYear(2024);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountingYear();
  }, [clientId]);

  const updateAccountingYear = async (newYear: number) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ current_accounting_year: newYear })
        .eq('id', clientId);

      if (error) throw error;

      setAccountingYear(newYear);
      toast.success(`Regnskapsår oppdatert til ${newYear}`);
    } catch (error) {
      console.error('Error updating accounting year:', error);
      toast.error('Feil ved oppdatering av regnskapsår');
    }
  };

  return {
    accountingYear,
    setAccountingYear: updateAccountingYear,
    isLoading
  };
};