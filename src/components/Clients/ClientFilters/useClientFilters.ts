
import { useState } from 'react';
import { Client } from '@/types/revio';

export function useClientFilters(clients: Client[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  // Get unique departments for filter dropdown
  const departments = Array.from(
    new Set(clients.map(client => client.department || ''))
  ).filter(Boolean) as string[];
  
  // Filter clients based on search term and department
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.orgNumber.includes(searchTerm);
    
    const matchesDepartment = 
      departmentFilter === 'all' || 
      client.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });
  
  return {
    searchTerm,
    setSearchTerm,
    departmentFilter,
    setDepartmentFilter,
    departments,
    filteredClients
  };
}
