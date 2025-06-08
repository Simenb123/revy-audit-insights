
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
    console.log('Filtering clients:', { 
      totalClients: clients.length, 
      showTestData, 
      searchTerm, 
      departmentFilter 
    });
    
    return clients.filter(client => {
      // Search filter
      const matchesSearch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.orgNumber.includes(searchTerm);

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || 
        client.department === departmentFilter;

      // Test data filter - if showTestData is true, show all clients
      // if showTestData is false, only show non-test clients
      const matchesTestDataPreference = showTestData || !client.isTestData;

      const shouldShow = matchesSearch && matchesDepartment && matchesTestDataPreference;
      
      if (client.isTestData) {
        console.log(`Test client ${client.name}:`, {
          matchesSearch,
          matchesDepartment,
          matchesTestDataPreference,
          shouldShow,
          isTestData: client.isTestData
        });
      }

      return shouldShow;
    });
  }, [clients, searchTerm, departmentFilter, showTestData]);

  console.log('Filtered clients result:', {
    total: clients.length,
    filtered: filteredClients.length,
    testClients: clients.filter(c => c.isTestData).length
  });

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
