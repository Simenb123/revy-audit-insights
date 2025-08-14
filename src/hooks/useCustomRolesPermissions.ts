import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustomPermission {
  id: string;
  audit_firm_id: string | null;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomRole {
  id: string;
  audit_firm_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  is_system_role: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  permissions?: CustomPermission[];
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_at: string;
}

export const useCustomPermissions = () => {
  return useQuery({
    queryKey: ['custom-permissions'],
    queryFn: async (): Promise<CustomPermission[]> => {
      const { data, error } = await supabase
        .from('custom_permissions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CustomPermission[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCustomRoles = () => {
  return useQuery({
    queryKey: ['custom-roles'],
    queryFn: async (): Promise<CustomRole[]> => {
      const { data, error } = await supabase
        .from('custom_roles')
        .select(`
          *,
          permissions:custom_role_permissions(
            permission:custom_permissions(*)
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Transform the data to flatten permissions
      return (data || []).map(role => ({
        ...role,
        permissions: role.permissions?.map((rp: any) => rp.permission).filter(Boolean) || []
      })) as CustomRole[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateCustomRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      permissionIds: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's firm
      const { data: profile } = await supabase
        .from('profiles')
        .select('audit_firm_id')
        .eq('id', user.id)
        .single();

      if (!profile?.audit_firm_id) throw new Error('No firm associated with user');

      // Create the role
      const { data: role, error: roleError } = await supabase
        .from('custom_roles')
        .insert({
          audit_firm_id: profile.audit_firm_id,
          name: params.name,
          description: params.description,
          created_by: user.id,
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Add permissions to the role
      if (params.permissionIds.length > 0) {
        const rolePermissions = params.permissionIds.map(permissionId => ({
          role_id: role.id,
          permission_id: permissionId,
        }));

        const { error: permError } = await supabase
          .from('custom_role_permissions')
          .insert(rolePermissions);

        if (permError) throw permError;
      }

      return role;
    },
    onSuccess: () => {
      toast({
        title: 'Rolle opprettet',
        description: 'Ny tilpasset rolle er opprettet.',
      });
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved oppretting',
        description: error?.message || 'Kunne ikke opprette rolle.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      roleId: string;
      permissionIds: string[];
    }) => {
      // First, remove all existing permissions for this role
      await supabase
        .from('custom_role_permissions')
        .delete()
        .eq('role_id', params.roleId);

      // Then add the new permissions
      if (params.permissionIds.length > 0) {
        const rolePermissions = params.permissionIds.map(permissionId => ({
          role_id: params.roleId,
          permission_id: permissionId,
        }));

        const { error } = await supabase
          .from('custom_role_permissions')
          .insert(rolePermissions);

        if (error) throw error;
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Tillatelser oppdatert',
        description: 'Rolletillatelser er oppdatert.',
      });
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved oppdatering',
        description: error?.message || 'Kunne ikke oppdatere tillatelser.',
        variant: 'destructive',
      });
    },
  });
};