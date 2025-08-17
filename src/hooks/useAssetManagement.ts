import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type FixedAssets = Database['public']['Tables']['fixed_assets']['Row'];
type AssetCategories = Database['public']['Tables']['asset_categories']['Row'];
type DepreciationSchedules = Database['public']['Tables']['depreciation_schedules']['Row'];
type AssetMaintenanceLog = Database['public']['Tables']['asset_maintenance_log']['Row'];

interface AssetFormData {
  asset_number: string;
  asset_name: string;
  description?: string;
  purchase_date: string;
  purchase_price: number;
  salvage_value?: number;
  useful_life_years: number;
  depreciation_method?: string;
  asset_category_id?: string;
  location?: string;
  serial_number?: string;
  vendor?: string;
  warranty_expiry_date?: string;
}

interface AssetUpdateData extends AssetFormData {
  id: string;
}

interface MaintenanceFormData {
  maintenance_date: string;
  maintenance_type: 'routine' | 'repair' | 'upgrade' | 'inspection';
  description: string;
  cost?: number;
  vendor?: string;
  next_maintenance_date?: string;
}

export function useAssetManagement(clientId: string) {
  const queryClient = useQueryClient();

  // Fetch assets for client
  const {
    data: assets,
    isLoading: assetsLoading,
    error: assetsError
  } = useQuery({
    queryKey: ['assets', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixed_assets')
        .select(`
          *,
          asset_categories (
            id,
            name,
            description
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  // Fetch asset categories
  const {
    data: assetCategories,
    isLoading: categoriesLoading
  } = useQuery({
    queryKey: ['assetCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch asset summary
  const {
    data: assetSummary,
    isLoading: summaryLoading
  } = useQuery({
    queryKey: ['assetSummary', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_asset_summary', { p_client_id: clientId });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: async (assetData: AssetFormData) => {
      const { data, error } = await supabase
        .from('fixed_assets')
        .insert({
          ...assetData,
          client_id: clientId,
          book_value: assetData.purchase_price,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['assetSummary', clientId] });
    }
  });

  // Update asset mutation
  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, ...assetData }: AssetUpdateData) => {
      const { data, error } = await supabase
        .from('fixed_assets')
        .update(assetData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['assetSummary', clientId] });
    }
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('fixed_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['assetSummary', clientId] });
    }
  });

  // Generate depreciation schedule mutation
  const generateDepreciationMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { data, error } = await supabase
        .rpc('generate_depreciation_schedule', { p_asset_id: assetId });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depreciationSchedules'] });
    }
  });

  // Add maintenance log mutation
  const addMaintenanceMutation = useMutation({
    mutationFn: async ({ assetId, ...maintenanceData }: MaintenanceFormData & { assetId: string }) => {
      const { data, error } = await supabase
        .from('asset_maintenance_log')
        .insert({
          ...maintenanceData,
          fixed_asset_id: assetId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceLog'] });
    }
  });

  return {
    assets,
    assetsLoading,
    assetsError,
    assetCategories,
    categoriesLoading,
    assetSummary,
    summaryLoading,
    createAsset: createAssetMutation.mutate,
    updateAsset: updateAssetMutation.mutate,
    deleteAsset: deleteAssetMutation.mutate,
    generateDepreciation: generateDepreciationMutation.mutate,
    addMaintenance: addMaintenanceMutation.mutate,
    isCreating: createAssetMutation.isPending,
    isUpdating: updateAssetMutation.isPending,
    isDeleting: deleteAssetMutation.isPending,
    isGeneratingSchedule: generateDepreciationMutation.isPending,
    isAddingMaintenance: addMaintenanceMutation.isPending
  };
}

export function useDepreciationSchedules(assetId?: string) {
  return useQuery({
    queryKey: ['depreciationSchedules', assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depreciation_schedules')
        .select('*')
        .eq('fixed_asset_id', assetId!)
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!assetId
  });
}

export function useAssetMaintenanceLog(assetId?: string) {
  return useQuery({
    queryKey: ['maintenanceLog', assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_maintenance_log')
        .select('*')
        .eq('fixed_asset_id', assetId!)
        .order('maintenance_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!assetId
  });
}