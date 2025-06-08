
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
    return clients.filter(client => {
      // Search filter
      const matchesSearch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.orgNumber.includes(searchTerm);

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || 
        client.department === departmentFilter;

      // Test data filter
      const matchesTestDataPreference = showTestData || !client.isTestData;

      return matchesSearch && matchesDepartment && matchesTestDataPreference;
    });
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
