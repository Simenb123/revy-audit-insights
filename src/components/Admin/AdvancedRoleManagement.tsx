import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Shield, 
  Plus,
  Edit,
  Users,
  Building,
  Key,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCustomPermissions, useCustomRoles, useCreateCustomRole, useUpdateRolePermissions } from '@/hooks/useCustomRolesPermissions';
import { useDepartmentAccess, useGrantDepartmentAccess, useRevokeDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { useAllUserProfiles } from '@/hooks/useAllUserProfiles';

const AdvancedRoleManagement = () => {
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showDeptAccess, setShowDeptAccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  
  // Real data fetching
  const { data: permissions = [], isLoading: loadingPermissions } = useCustomPermissions();
  const { data: roles = [], isLoading: loadingRoles } = useCustomRoles();
  const { data: departmentAccess = [], isLoading: loadingDeptAccess } = useDepartmentAccess();
  const { data: users = [] } = useAllUserProfiles();
  
  const createRole = useCreateCustomRole();
  const updateRolePermissions = useUpdateRolePermissions();
  const grantDeptAccess = useGrantDepartmentAccess();
  const revokeDeptAccess = useRevokeDepartmentAccess();

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'client_access': return 'Klienttilgang';
      case 'system_admin': return 'Systemadministrasjon';
      case 'reporting': return 'Rapportering';
      case 'data_management': return 'Databehandling';
      case 'custom': return 'Tilpasset';
      default: return category;
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast({
        title: 'Feil',
        description: 'Rollenavn er påkrevd.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRole.mutateAsync({
        name: newRoleName,
        description: newRoleDescription,
        permissionIds: Array.from(selectedPermissions),
      });
      
      setShowCreateRole(false);
      setNewRoleName('');
      setNewRoleDescription('');
      setSelectedPermissions(new Set());
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleUpdateRolePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      await updateRolePermissions.mutateAsync({ roleId, permissionIds });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const categories = ['client_access', 'system_admin', 'reporting', 'data_management', 'custom'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Avansert rollebehandling</h2>
          <p className="text-muted-foreground">
            Opprett tilpassede roller og administrer granulære tillatelser
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showDeptAccess} onOpenChange={setShowDeptAccess}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Building className="h-4 w-4 mr-2" />
                Avdelingstilgang
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gi avdelingstilgang</DialogTitle>
                <DialogDescription>
                  Gi en bruker tilgang til en spesifikk avdeling
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Bruker</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg bruker" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.email || 'Ukjent bruker'
                            }
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tilgangstype</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg tilgang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full tilgang</SelectItem>
                        <SelectItem value="read">Kun lesing</SelectItem>
                        <SelectItem value="limited">Begrenset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDeptAccess(false)}>
                    Avbryt
                  </Button>
                  <Button>Gi tilgang</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ny rolle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Opprett ny rolle</DialogTitle>
                <DialogDescription>
                  Definer en ny rolle med spesifikke tillatelser
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rollenavn</label>
                    <Input 
                      placeholder="F.eks. Senior revisor" 
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beskrivelse</label>
                    <Input 
                      placeholder="Beskrivelse av rollen" 
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-4">Tillatelser</h4>
                  <Tabs defaultValue="client_access" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      {categories.map(category => (
                        <TabsTrigger key={category} value={category}>
                          {getCategoryName(category)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {categories.map(category => (
                      <TabsContent key={category} value={category}>
                        <div className="space-y-3">
                          {getPermissionsByCategory(category).map(permission => (
                            <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-sm text-muted-foreground">{permission.description}</div>
                              </div>
                              <Switch 
                                checked={selectedPermissions.has(permission.id)}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(selectedPermissions);
                                  if (checked) {
                                    newSelected.add(permission.id);
                                  } else {
                                    newSelected.delete(permission.id);
                                  }
                                  setSelectedPermissions(newSelected);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateRole(false)}>
                    Avbryt
                  </Button>
                  <Button 
                    onClick={handleCreateRole}
                    disabled={createRole.isPending}
                  >
                    {createRole.isPending ? 'Oppretter...' : 'Opprett rolle'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Tilpassede roller</TabsTrigger>
          <TabsTrigger value="permissions">Tillatelser</TabsTrigger>
          <TabsTrigger value="department">Avdelingstilgang</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Tilpassede roller
              </CardTitle>
              <CardDescription>
                Administrer roller opprettet for din organisasjon
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRoles ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Laster roller...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {roles.filter(role => !role.is_system_role).map(role => (
                    <div key={role.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{role.name}</h3>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.permissions?.map(permission => (
                              <Badge key={permission.id} variant="secondary" className="text-xs">
                                {permission.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Rediger
                        </Button>
                      </div>
                    </div>
                  ))}
                  {roles.filter(role => !role.is_system_role).length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Ingen tilpassede roller opprettet ennå
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Tilgjengelige tillatelser
              </CardTitle>
              <CardDescription>
                Oversikt over alle tilgjengelige tillatelser i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Laster tillatelser...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {categories.map(category => {
                    const categoryPermissions = getPermissionsByCategory(category);
                    if (categoryPermissions.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h3 className="font-medium mb-3">{getCategoryName(category)}</h3>
                        <div className="grid gap-2">
                          {categoryPermissions.map(permission => (
                            <div key={permission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-sm text-muted-foreground">{permission.description}</div>
                              </div>
                              <Badge variant="outline">{permission.category}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Avdelingstilganger
              </CardTitle>
              <CardDescription>
                Administrer avdelingsspesifikke tilganger for brukere
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDeptAccess ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Laster avdelingstilganger...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bruker</TableHead>
                      <TableHead>Avdeling</TableHead>
                      <TableHead>Tilgangstype</TableHead>
                      <TableHead>Gitt av</TableHead>
                      <TableHead>Gitt dato</TableHead>
                      <TableHead>Utløper</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentAccess.map(access => (
                      <TableRow key={access.id}>
                        <TableCell>
                          {access.user?.first_name && access.user?.last_name
                            ? `${access.user.first_name} ${access.user.last_name}`
                            : access.user?.email || 'Ukjent bruker'
                          }
                        </TableCell>
                        <TableCell>{access.department?.name || 'Ukjent avdeling'}</TableCell>
                        <TableCell>
                          <Badge variant={access.access_type === 'full' ? 'default' : 'secondary'}>
                            {access.access_type === 'full' ? 'Full' : 
                             access.access_type === 'read' ? 'Lesing' : 'Begrenset'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {access.granted_by_user?.first_name && access.granted_by_user?.last_name
                            ? `${access.granted_by_user.first_name} ${access.granted_by_user.last_name}`
                            : access.granted_by_user?.email || 'Ukjent'
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(access.granted_at).toLocaleDateString('nb-NO')}
                        </TableCell>
                        <TableCell>
                          {access.expires_at 
                            ? new Date(access.expires_at).toLocaleDateString('nb-NO')
                            : 'Aldri'
                          }
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => revokeDeptAccess.mutate(access.id)}
                            disabled={revokeDeptAccess.isPending}
                          >
                            Tilbakekall
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedRoleManagement;