
import { useState } from 'react';
import { Client } from '@/types/revio';

export const useClientFilter = (clients: Client[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.orgNumber.includes(searchTerm);
    const matchesDepartment = departmentFilter === 'all' || client.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });
  
  const departments = Array.from(new Set(clients.map(client => client.department))).filter(Boolean) as string[];
  
  return {
    searchTerm,
    setSearchTerm,
    departmentFilter,
    setDepartmentFilter,
    filteredClients,
    departments
  };
};
