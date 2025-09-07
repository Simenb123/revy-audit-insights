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
  const [groupFilter, setGroupFilter] = useState('all');

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

  // Get unique groups from clients
  const groups = useMemo(() => {
    const uniqueGroups = Array.from(
      new Set(
        clients
          .filter(client => client.client_group && client.client_group.trim() !== '')
          .map(client => client.client_group)
      )
    );
    return uniqueGroups.sort();
  }, [clients]);

  // Filter clients based on search term, department, and group
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Search filter
      const matchesSearch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.org_number.includes(searchTerm) ||
        (client.client_group && client.client_group.toLowerCase().includes(searchTerm.toLowerCase()));

      // Department filter
      const matchesDepartment = departmentFilter === 'all' || 
        client.department === departmentFilter;

      // Group filter
      const matchesGroup = groupFilter === 'all' || 
        client.client_group === groupFilter;

      return matchesSearch && matchesDepartment && matchesGroup;
    });
  }, [clients, searchTerm, departmentFilter, groupFilter]);

  return {
    searchTerm,
    setSearchTerm,
    departmentFilter,
    setDepartmentFilter,
    departments,
    groupFilter,
    setGroupFilter,
    groups,
    filteredClients
  };
}
