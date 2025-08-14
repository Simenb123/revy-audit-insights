import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  Shield, 
  UserX,
  Download,
  Upload,
  CheckSquare,
  RefreshCw,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAllUserProfiles, type UserSummary } from '@/hooks/useAllUserProfiles';
import { useEmployees, type EmployeeProfile } from '@/hooks/useEmployees';
import { useBulkUserActions, useUpdateUser, useSyncUsers } from '@/hooks/useUserManagement';
import type { UserRole } from '@/types/organization';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: UserRole;
  status: 'active' | 'inactive' | 'pre_registered' | 'student' | 'test';
  department?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

const EnhancedUserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showUserDetails, setShowUserDetails] = useState<User | null>(null);
  const [sortField, setSortField] = useState<keyof User>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { toast } = useToast();

  // Real data fetching
  const { data: userProfiles = [], isLoading: loadingProfiles } = useAllUserProfiles();
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const bulkActions = useBulkUserActions();
  const updateUser = useUpdateUser();
  const syncUsers = useSyncUsers();

  // Combine and transform data
  const users: User[] = userProfiles.map(profile => ({
    id: profile.id,
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    email: profile.email,
    role: profile.user_role,
    status: employees.find(emp => emp.id === profile.id)?.is_active ? 'active' : 'inactive',
    department: undefined as string | undefined, // TODO: Add department mapping
    lastLogin: undefined as string | undefined, // TODO: Add last login tracking
    createdAt: new Date().toISOString(), // TODO: Get from database
    updatedAt: new Date().toISOString(), // TODO: Get from database
  }));

  const departments = ['Ledelse', 'Revisjon', 'Regnskap', 'HR'];

  // Filtering and sorting logic
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
      
      return matchesSearch && matchesStatus && matchesRole && matchesDepartment;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, statusFilter, roleFilter, departmentFilter, sortField, sortDirection]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;

    if (bulkAction === 'export') {
      handleExportUsers();
      return;
    }

    const userIds = Array.from(selectedUsers);
    
    try {
      await bulkActions.mutateAsync({
        userIds,
        action: bulkAction as 'activate' | 'deactivate' | 'delete',
      });
      setSelectedUsers(new Set());
      setBulkAction('');
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  // Export functionality
  const handleExportUsers = () => {
    const selectedUserData = users.filter(u => selectedUsers.has(u.id));
    const csvData = [
      ['Fornavn', 'Etternavn', 'E-post', 'Rolle', 'Status', 'Avdeling', 'Opprettet'],
      ...selectedUserData.map(u => [
        u.firstName,
        u.lastName,
        u.email || '',
        u.role,
        u.status,
        u.department || '',
        new Date(u.createdAt).toLocaleDateString('nb-NO')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brukere_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Eksport fullført',
      description: `${selectedUserData.length} brukere eksportert til CSV.`,
    });
  };

  // Sync function
  const handleSyncUsers = async () => {
    toast({
      title: 'Synkronisering startet',
      description: 'Synkroniserer brukere mellom auth.users og profiles...',
    });
    
    try {
      await syncUsers.mutateAsync();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'pre_registered': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'student': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'test': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'partner': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Utvidet brukeradministrasjon</h2>
          <p className="text-muted-foreground">
            Administrer brukere med avanserte verktøy og bulk-operasjoner
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncUsers}
            disabled={syncUsers.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncUsers.isPending ? 'animate-spin' : ''}`} />
            Synkroniser brukere
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Legg til bruker
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Avansert filtrering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Søk etter navn eller e-post..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
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
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Velg avdeling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle avdelinger</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedUsers.size > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedUsers.size} brukere valgt
                </span>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Velg handling" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">Aktiver alle</SelectItem>
                    <SelectItem value="deactivate">Deaktiver alle</SelectItem>
                    <SelectItem value="export">Eksporter valgte</SelectItem>
                    <SelectItem value="delete">Slett alle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Avbryt
                </Button>
                <Button 
                  onClick={handleBulkAction} 
                  disabled={!bulkAction || bulkActions.isPending}
                >
                  {bulkActions.isPending ? 'Utfører...' : 'Utfør handling'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Brukere ({filteredAndSortedUsers.length})
          </CardTitle>
          <CardDescription>
            Detaljert oversikt over alle brukere med bulk-operasjoner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProfiles || loadingEmployees ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Laster brukere...</div>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Navn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avdeling</TableHead>
                <TableHead>Sist pålogget</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.email ? (
                        <>
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {user.email}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Ingen e-post</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.department || '-'}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? 
                      new Date(user.lastLogin).toLocaleDateString('nb-NO', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : 
                      'Aldri'
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowUserDetails(user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Vis detaljer
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Rediger bruker
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Endre rolle
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserX className="h-4 w-4 mr-2" />
                          {user.status === 'active' ? 'Deaktiver' : 'Aktiver'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Slett bruker
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* User details dialog */}
      <Dialog open={!!showUserDetails} onOpenChange={() => setShowUserDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Brukerdetaljer</DialogTitle>
            <DialogDescription>
              Detaljert informasjon om {showUserDetails?.firstName} {showUserDetails?.lastName}
            </DialogDescription>
          </DialogHeader>
          {showUserDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Fornavn</label>
                  <p className="text-sm text-muted-foreground">{showUserDetails.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Etternavn</label>
                  <p className="text-sm text-muted-foreground">{showUserDetails.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">E-post</label>
                  <p className="text-sm text-muted-foreground">{showUserDetails.email || 'Ikke angitt'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Avdeling</label>
                  <p className="text-sm text-muted-foreground">{showUserDetails.department || 'Ikke angitt'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Rolle</label>
                  <Badge className={getRoleColor(showUserDetails.role)}>
                    {showUserDetails.role}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(showUserDetails.status)}>
                    {showUserDetails.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Opprettet</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(showUserDetails.createdAt).toLocaleDateString('nb-NO')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Sist pålogget</label>
                  <p className="text-sm text-muted-foreground">
                    {showUserDetails.lastLogin ? 
                      new Date(showUserDetails.lastLogin).toLocaleDateString('nb-NO') : 
                      'Aldri'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedUserManagement;