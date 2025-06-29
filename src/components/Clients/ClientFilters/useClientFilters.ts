import { logger } from '@/utils/logger';
import { useState, useMemo } from 'react';
import { Client } from '@/types/revio';

/**
 * Client list filtering hook used in the clients module.
 *
 * @param {Client[]} clients - Array of clients to filter.
 * @returns {object} Filter state values and helper functions.
 */
export function useClientFilters(clients: Client[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showTestData, setShowTestData] = useState(true);

  // Get unique departments from clients
  const departments = useMemo(() => {
    const uniqueDepartments = Array.from(
      new Set(
        clients
          .filter(client => client.department && client.department.trim() !== '')
          .map(client => client.department)
      )
    );
    return uniqueDepartments.sort();
  }, [clients]);

  // Filter clients based on search term, department, and test data preference
  const filteredClients = useMemo(() => {
    logger.log('=== FILTERING CLIENTS ===');
    logger.log('Filter parameters:', { 
      totalClients: clients.length, 
      showTestData, 
      searchTerm, 
      departmentFilter 
    });
    
    // Count test clients in input
    const testClientsInput = clients.filter(c => c.is_test_data);
    logger.log('Test clients in input to filter:', testClientsInput.length);
    if (testClientsInput.length > 0) {
      logger.log('Test clients details:', testClientsInput.map(c => ({ name: c.name, isTestData: c.is_test_data })));
    }
    
    const result = clients.filter(client => {
      // Search filter
      const matchesSearch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.org_number.includes(searchTerm);

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || 
        client.department === departmentFilter;

      // Test data filter - FIXED: Now correctly shows/hides test data based on toggle
      const matchesTestDataPreference = showTestData ? true : !client.is_test_data;

      const shouldShow = matchesSearch && matchesDepartment && matchesTestDataPreference;
      
      if (client.is_test_data) {
        logger.log(`Test client ${client.name}:`, {
          matchesSearch,
          matchesDepartment,
          matchesTestDataPreference,
          shouldShow,
          isTestData: client.is_test_data,
          showTestData
        });
      }

      return shouldShow;
    });

    const testClientsInResult = result.filter(c => c.is_test_data);
    logger.log('=== FILTER RESULT ===');
    logger.log('Filtered clients result:', {
      total: clients.length,
      filtered: result.length,
      testClientsInInput: testClientsInput.length,
      testClientsInResult: testClientsInResult.length
    });

    if (testClientsInResult.length > 0) {
      logger.log('Test clients that passed filter:', testClientsInResult.map(c => c.name));
    } else if (testClientsInput.length > 0 && showTestData) {
      logger.log('TEST CLIENTS WERE FILTERED OUT despite showTestData being true - Check filter logic');
    }

    return result;
  }, [clients, searchTerm, departmentFilter, showTestData]);

  return {
    searchTerm,
    setSearchTerm,
    departmentFilter,
    setDepartmentFilter,
    departments,
    filteredClients,
    showTestData,
    setShowTestData
  };
}
