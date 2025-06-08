
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Client, ClientRole } from '@/types/revio';

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

        const transformedClient = {
          id: client.id,
          name: client.name,
          companyName: client.company_name,
          orgNumber: client.org_number,
          phase: client.phase,
          progress: client.progress,
          department: client.department || '',
          contactPerson: client.contact_person || '',
          chair: client.chair || '',
          ceo: client.ceo || '',
          industry: client.industry || '',
          registrationDate: client.registration_date || '',
          address: client.address || '',
          postalCode: client.postal_code || '',
          city: client.city || '',
          email: client.email || '',
          phone: client.phone || '',
          bankAccount: client.bank_account || '',
          notes: client.notes || '',
          // Enhanced Brønnøysund data
          orgFormCode: client.org_form_code || '',
          orgFormDescription: client.org_form_description || '',
          homepage: client.homepage || '',
          status: client.status || '',
          naceCode: client.nace_code || '',
          naceDescription: client.nace_description || '',
          municipalityCode: client.municipality_code || '',
          municipalityName: client.municipality_name || '',
          equityCapital: client.equity_capital != null ? Number(client.equity_capital) : undefined,
          shareCapital: client.share_capital != null ? Number(client.share_capital) : undefined,
          // New extended fields
          accountingSystem: client.accounting_system || '',
          previousAuditor: client.previous_auditor || '',
          auditFee: client.audit_fee != null ? Number(client.audit_fee) : undefined,
          yearEndDate: client.year_end_date || '',
          boardMeetingsPerYear: client.board_meetings_per_year != null ? Number(client.board_meetings_per_year) : undefined,
          internalControls: client.internal_controls || '',
          riskAssessment: client.risk_assessment || '',
          // Test data flag - properly convert from database
          isTestData: isTestData,
          riskAreas: clientRiskAreas,
          documents: clientDocuments,
          roles: clientRoles
        } as Client;

        if (transformedClient.isTestData) {
          console.log('Successfully transformed test client:', {
            name: transformedClient.name,
            isTestData: transformedClient.isTestData,
            originalValue: client.is_test_data
          });
        }

        console.log(`=== FINISHED TRANSFORMING CLIENT: ${client.name} (isTestData: ${transformedClient.isTestData}) ===`);

        return transformedClient;
      });

      console.log('=== TRANSFORMATION COMPLETE ===');
      console.log('Final transformed clients:', transformedClients.length);
      const testClientsInResult = transformedClients.filter(c => c.isTestData);
      console.log('Test clients in final result:', testClientsInResult.length);
      if (testClientsInResult.length > 0) {
        console.log('Test clients found with NEW RLS policy:', testClientsInResult.map(c => ({ name: c.name, isTestData: c.isTestData })));
      } else {
        console.log('NO TEST CLIENTS FOUND IN FINAL RESULT - Check if test data exists in database');
        console.log('All clients isTestData values:', transformedClients.map(c => ({ name: c.name, isTestData: c.isTestData })));
      }

      return transformedClients;
    },
    // Force fresh data by setting staleTime to 0
    staleTime: 0,
    // Refetch when window regains focus
    refetchOnWindowFocus: true
  });
}
