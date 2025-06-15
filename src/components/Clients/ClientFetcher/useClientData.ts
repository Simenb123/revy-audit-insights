
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Client, ClientRole, AuditPhase } from '@/types/revio';

export function useClientData() {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      console.log('=== STARTING CLIENT DATA FETCH ===');
      
      // First get clients with explicit debugging - now with updated RLS
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        toast({
          title: "Feil ved lasting av klienter",
          description: clientsError.message,
          variant: "destructive"
        });
        return [];
      }

      console.log('Raw clients data from database (with new RLS policy):', clientsData);
      console.log('Total clients fetched:', clientsData?.length || 0);
      
      // Check for test data specifically
      const testClientsFromDB = clientsData?.filter(c => c.is_test_data === true) || [];
      console.log('Test clients found in raw DB data:', testClientsFromDB.length);
      console.log('Test clients details:', testClientsFromDB.map(c => ({
        name: c.name,
        orgNumber: c.org_number,
        isTestData: c.is_test_data
      })));

      // Then get risk areas for all clients
      const { data: riskAreasData, error: riskAreasError } = await supabase
        .from('risk_areas')
        .select('*');

      if (riskAreasError) {
        console.error("Error fetching risk areas:", riskAreasError);
      }

      // Then get documents for all clients
      const { data: documentsData, error: documentsError } = await supabase
        .from('client_documents')
        .select('*');

      if (documentsError) {
        console.error("Error fetching client documents:", documentsError);
      }

      // Then get roles for all clients
      const { data: rolesData, error: rolesError } = await supabase
        .from('client_roles')
        .select('*');

      if (rolesError) {
        console.error("Error fetching client roles:", rolesError);
      }

      // Transform data to match our Client type
      const transformedClients = clientsData.map(client => {
        console.log(`=== TRANSFORMING CLIENT: ${client.name} ===`);
        console.log(`Original is_test_data value:`, client.is_test_data, typeof client.is_test_data);
        
        // Find risk areas for this client
        const clientRiskAreas = (riskAreasData || [])
          .filter(area => area.client_id === client.id)
          .map(area => ({
            name: area.name,
            risk: area.risk
          }));

        // Find documents for this client
        const clientDocuments = (documentsData || [])
          .filter(doc => doc.client_id === client.id)
          .map(doc => ({
            type: doc.type,
            status: doc.status,
            dueDate: doc.due_date
          }));

        // Find roles for this client
        const clientRoles = (rolesData || [])
          .filter(role => role.client_id === client.id)
          .map(role => ({
            id: role.id,
            clientId: role.client_id,
            roleType: role.role_type as any,
            name: role.name,
            fromDate: role.from_date,
            toDate: role.to_date
          }));

        // If no risk areas or documents found, provide defaults
        if (clientRiskAreas.length === 0) {
          clientRiskAreas.push({ name: 'Generell', risk: 'low' });
        }
        
        if (clientDocuments.length === 0) {
          clientDocuments.push({
            type: 'annual_report',
            status: 'pending',
            dueDate: new Date().toISOString().split('T')[0]
          });
        }

        // Fix the isTestData transformation - ensure it's properly converted from database
        const isTestData = Boolean(client.is_test_data);
        
        console.log(`Client ${client.name}: is_test_data from DB = ${client.is_test_data}, converted to isTestData = ${isTestData}`);

        // Map database phase values to our AuditPhase type
        let mappedPhase: AuditPhase;
        switch (client.phase) {
          case 'conclusion':
            mappedPhase = 'completion';
            break;
          default:
            mappedPhase = client.phase as AuditPhase;
            break;
        }

        const transformedClient: Client = {
          id: client.id,
          name: client.name,
          company_name: client.company_name,
          org_number: client.org_number,
          phase: mappedPhase,
          progress: client.progress,
          department: client.department || '',
          contact_person: client.contact_person || '',
          chair: client.chair || '',
          ceo: client.ceo || '',
          industry: client.industry || '',
          registration_date: client.registration_date || '',
          address: client.address || '',
          postal_code: client.postal_code || '',
          city: client.city || '',
          email: client.email || '',
          phone: client.phone || '',
          bank_account: client.bank_account || '',
          notes: client.notes || '',
          org_form_code: client.org_form_code || '',
          org_form_description: client.org_form_description || '',
          homepage: client.homepage || '',
          status: client.status || '',
          nace_code: client.nace_code || '',
          nace_description: client.nace_description || '',
          municipality_code: client.municipality_code || '',
          municipality_name: client.municipality_name || '',
          equity_capital: client.equity_capital != null ? Number(client.equity_capital) : null,
          share_capital: client.share_capital != null ? Number(client.share_capital) : null,
          accounting_system: client.accounting_system || '',
          previous_auditor: client.previous_auditor || '',
          audit_fee: client.audit_fee != null ? Number(client.audit_fee) : null,
          year_end_date: client.year_end_date || '',
          board_meetings_per_year: client.board_meetings_per_year != null ? Number(client.board_meetings_per_year) : null,
          internal_controls: client.internal_controls || '',
          risk_assessment: client.risk_assessment || '',
          is_test_data: isTestData,
          created_at: client.created_at,
          updated_at: client.updated_at,
          riskAreas: clientRiskAreas,
          documents: clientDocuments,
          roles: clientRoles
        };

        if (transformedClient.is_test_data) {
          console.log('Successfully transformed test client:', {
            name: transformedClient.name,
            is_test_data: transformedClient.is_test_data,
            originalValue: client.is_test_data
          });
        }

        console.log(`=== FINISHED TRANSFORMING CLIENT: ${client.name} (is_test_data: ${transformedClient.is_test_data}) ===`);

        return transformedClient;
      });

      console.log('=== TRANSFORMATION COMPLETE ===');
      console.log('Final transformed clients:', transformedClients.length);
      const testClientsInResult = transformedClients.filter(c => c.is_test_data);
      console.log('Test clients in final result:', testClientsInResult.length);
      if (testClientsInResult.length > 0) {
        console.log('Test clients found with NEW RLS policy:', testClientsInResult.map(c => ({ name: c.name, is_test_data: c.is_test_data })));
      } else {
        console.log('NO TEST CLIENTS FOUND IN FINAL RESULT - Check if test data exists in database');
        console.log('All clients is_test_data values:', transformedClients.map(c => ({ name: c.name, is_test_data: c.is_test_data })));
      }

      return transformedClients;
    },
    // Cache data for 5 minutes to improve performance
    staleTime: 1000 * 60 * 5,
    // Refetch when window regains focus
    refetchOnWindowFocus: true
  });
}
