import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PDFCompany {
  id: string;
  user_id: string;
  name: string;
  org_number?: string;
  address?: string;
  is_vat_registered: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const usePDFCompanies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: companies = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['pdf-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_creator_companies')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data as PDFCompany[];
    }
  });

  const createCompany = useMutation({
    mutationFn: async (company: Omit<PDFCompany, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('Bruker ikke autentisert');
      
      const { data, error } = await supabase
        .from('pdf_creator_companies')
        .insert({
          name: company.name,
          org_number: company.org_number,
          address: company.address,
          is_vat_registered: company.is_vat_registered,
          is_favorite: company.is_favorite,
          user_id: user.user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-companies'] });
      toast({
        title: "Selskap lagret",
        description: "Selskapet er nå lagret for gjenbruk"
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved lagring",
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: "destructive"
      });
    }
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PDFCompany> & { id: string }) => {
      const { data, error } = await supabase
        .from('pdf_creator_companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-companies'] });
      toast({
        title: "Selskap oppdatert",
        description: "Endringene er lagret"
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved oppdatering",
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: "destructive"
      });
    }
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pdf_creator_companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-companies'] });
      toast({
        title: "Selskap slettet",
        description: "Selskapet er fjernet fra listen"
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved sletting",
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: "destructive"
      });
    }
  });

  const toggleFavorite = useMutation({
    mutationFn: async (id: string) => {
      const company = companies.find(c => c.id === id);
      if (!company) throw new Error('Selskap ikke funnet');
      
      const { error } = await supabase
        .from('pdf_creator_companies')
        .update({ is_favorite: !company.is_favorite })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-companies'] });
    }
  });

  return {
    companies,
    isLoading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
    toggleFavorite
  };
};