
import { useState, useMemo } from 'react';
import { Client } from '@/types/revio';

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
    console.log('=== FILTERING CLIENTS ===');
    console.log('Filter parameters:', { 
      totalClients: clients.length, 
      showTestData, 
      searchTerm, 
      departmentFilter 
    });
    
    // Count test clients in input
    const testClientsInput = clients.filter(c => c.isTestData);
    console.log('Test clients in input to filter:', testClientsInput.length);
    if (testClientsInput.length > 0) {
      console.log('Test clients details:', testClientsInput.map(c => ({ name: c.name, isTestData: c.isTestData })));
    }
    
    const result = clients.filter(client => {
      // Search filter
      const matchesSearch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.orgNumber.includes(searchTerm);

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || 
        client.department === departmentFilter;

      // Test data filter - FIXED: Now correctly shows/hides test data based on toggle
      const matchesTestDataPreference = showTestData ? true : !client.isTestData;

      const shouldShow = matchesSearch && matchesDepartment && matchesTestDataPreference;
      
      if (client.isTestData) {
        console.log(`Test client ${client.name}:`, {
          matchesSearch,
          matchesDepartment,
          matchesTestDataPreference,
          shouldShow,
          isTestData: client.isTestData,
          showTestData
        });
      }

      return shouldShow;
    });

    const testClientsInResult = result.filter(c => c.isTestData);
    console.log('=== FILTER RESULT ===');
    console.log('Filtered clients result:', {
      total: clients.length,
      filtered: result.length,
      testClientsInInput: testClientsInput.length,
      testClientsInResult: testClientsInResult.length
    });

    if (testClientsInResult.length > 0) {
      console.log('Test clients that passed filter:', testClientsInResult.map(c => c.name));
    } else if (testClientsInput.length > 0 && showTestData) {
      console.log('TEST CLIENTS WERE FILTERED OUT despite showTestData being true - Check filter logic');
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
