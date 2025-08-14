import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  Shield, 
  UserX 
} from 'lucide-react';
import { useFirmEmployees } from '@/hooks/useFirmEmployees';
import { useUpdateFirmEmployee } from '@/hooks/useUpdateFirmEmployee';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, EmployeeStatus } from '@/types/organization';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const { data: employees = [], isLoading } = useFirmEmployees();
  const updateEmployee = useUpdateFirmEmployee();
  const { toast } = useToast();

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleRoleChange = async (employeeId: string, newRole: UserRole) => {
    try {
      await updateEmployee.mutateAsync({ id: employeeId, role: newRole });
      toast({
        title: 'Rolle oppdatert',
        description: 'Brukerens rolle er endret.',
      });
    } catch (error) {
      toast({
        title: 'Feil ved oppdatering',
        description: 'Kunne ikke endre brukerrolle.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (employeeId: string, newStatus: EmployeeStatus) => {
    try {
      await updateEmployee.mutateAsync({ id: employeeId, status: newStatus });
      toast({
        title: 'Status oppdatert',
        description: 'Brukerens status er endret.',
      });
    } catch (error) {
      toast({
        title: 'Feil ved oppdatering',
        description: 'Kunne ikke endre brukerstatus.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'pre_registered': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'student': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'test': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'partner': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brukeradministrasjon</h1>
          <p className="text-muted-foreground">
            Administrer brukere, roller og tilganger
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Legg til bruker
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtrering og søk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Søk etter navn eller e-post..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EmployeeStatus | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Velg status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="pre_registered">Forhåndsregistrert</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Velg rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle roller</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Ansatt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Brukere ({filteredEmployees.length})
          </CardTitle>
          <CardDescription>
            Oversikt over alle brukere i organisasjonen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opprettet</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {employee.email ? (
                        <>
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {employee.email}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Ingen e-post</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(employee.role)}>
                      {employee.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(employee.createdAt).toLocaleDateString('nb-NO')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleRoleChange(employee.id, 'admin')}
                          disabled={employee.role === 'admin'}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Gjør til admin
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRoleChange(employee.id, 'employee')}
                          disabled={employee.role === 'employee'}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Gjør til ansatt
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(employee.id, employee.status === 'active' ? 'inactive' : 'active')}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          {employee.status === 'active' ? 'Deaktiver' : 'Aktiver'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;