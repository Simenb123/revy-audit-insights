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
  Clock, 
  Users, 
  Building, 
  Key, 
  Plus,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTemporaryAccess, useGrantTemporaryAccess, useRevokeTemporaryAccess } from '@/hooks/useTemporaryAccess';
import { useAdminAuditLogs } from '@/hooks/useAdminAuditLogs';
import { useAllUserProfiles } from '@/hooks/useAllUserProfiles';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'client_access' | 'system_admin' | 'reporting' | 'data_management';
  isDefault: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
}

interface TemporaryAccess {
  id: string;
  userId: string;
  userName: string;
  resource: string;
  resourceType: 'client' | 'department' | 'system';
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'revoked';
  grantedBy: string;
}

const GranularAccessControl = () => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showTempAccess, setShowTempAccess] = useState(false);
  const { toast } = useToast();

  // Real data fetching
  const { data: temporaryAccesses = [], isLoading: loadingTempAccess } = useTemporaryAccess();
  const { data: auditLogs = [], isLoading: loadingAuditLogs } = useAdminAuditLogs();
  const { data: users = [] } = useAllUserProfiles();
  const grantTempAccess = useGrantTemporaryAccess();
  const revokeTempAccess = useRevokeTemporaryAccess();

  // Mock data
  const permissions: Permission[] = [
    {
      id: 'client_view',
      name: 'Vis klienter',
      description: 'Kan se klientinformasjon',
      category: 'client_access',
      isDefault: true
    },
    {
      id: 'client_edit',
      name: 'Rediger klienter',
      description: 'Kan redigere klientinformasjon',
      category: 'client_access',
      isDefault: false
    },
    {
      id: 'user_admin',
      name: 'Brukeradministrasjon',
      description: 'Kan administrere brukere',
      category: 'system_admin',
      isDefault: false
    },
    {
      id: 'report_generate',
      name: 'Generer rapporter',
      description: 'Kan generere og eksportere rapporter',
      category: 'reporting',
      isDefault: true
    },
    {
      id: 'data_upload',
      name: 'Last opp data',
      description: 'Kan laste opp regnskapsdata',
      category: 'data_management',
      isDefault: true
    }
  ];

  const roles: Role[] = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full tilgang til alle funksjoner',
      permissions: permissions.map(p => p.id),
      isSystemRole: true
    },
    {
      id: 'partner',
      name: 'Partner',
      description: 'Tilgang til klienter og rapporter',
      permissions: ['client_view', 'client_edit', 'report_generate', 'data_upload'],
      isSystemRole: true
    },
    {
      id: 'employee',
      name: 'Ansatt',
      description: 'Begrenset tilgang til klienter',
      permissions: ['client_view', 'report_generate'],
      isSystemRole: true
    }
  ];

  // Transform temporary access data for UI
  const transformedTempAccesses = temporaryAccesses.map(access => ({
    id: access.id,
    userId: access.user_id,
    userName: access.user?.first_name && access.user?.last_name 
      ? `${access.user.first_name} ${access.user.last_name}`
      : access.user?.email || 'Ukjent bruker',
    resource: access.resource_id || access.resource_type,
    resourceType: access.resource_type,
    startDate: access.start_date,
    endDate: access.end_date,
    status: access.status,
    grantedBy: access.granted_by_user?.first_name && access.granted_by_user?.last_name
      ? `${access.granted_by_user.first_name} ${access.granted_by_user.last_name}`
      : access.granted_by_user?.email || 'Ukjent'
  }));

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'client_access': return 'Klienttilgang';
      case 'system_admin': return 'Systemadministrasjon';
      case 'reporting': return 'Rapportering';
      case 'data_management': return 'Databehandling';
      default: return category;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'revoked': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreateCustomRole = () => {
    toast({
      title: 'Rolle opprettet',
      description: 'Ny tilpasset rolle er opprettet.',
    });
    setShowCreateRole(false);
  };

  const handleGrantTemporaryAccess = async (formData: any) => {
    try {
      await grantTempAccess.mutateAsync({
        userId: formData.userId,
        resourceType: formData.resourceType,
        resourceId: formData.resourceId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      });
      setShowTempAccess(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    try {
      await revokeTempAccess.mutateAsync(accessId);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tilgangskontroll og rettigheter</h2>
          <p className="text-muted-foreground">
            Administrer roller, tillatelser og midlertidige tilganger
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showTempAccess} onOpenChange={setShowTempAccess}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Gi midlertidig tilgang
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gi midlertidig tilgang</DialogTitle>
                <DialogDescription>
                  Gi en bruker midlertidig tilgang til spesifikke ressurser
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
                    <label className="text-sm font-medium">Ressurs</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg ressurs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client1">Bedrift AS</SelectItem>
                        <SelectItem value="dept1">Revisjonsavdeling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fra dato</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Til dato</label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowTempAccess(false)}>
                    Avbryt
                  </Button>
                  <Button onClick={handleGrantTemporaryAccess}>
                    Gi tilgang
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Opprett rolle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Opprett tilpasset rolle</DialogTitle>
                <DialogDescription>
                  Definer en ny rolle med spesifikke tillatelser
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rollenavn</label>
                    <Input placeholder="F.eks. Senior revisor" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beskrivelse</label>
                    <Input placeholder="Beskrivelse av rollen" />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-4">Tillatelser</h4>
                  <Tabs defaultValue="client_access" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="client_access">Klienttilgang</TabsTrigger>
                      <TabsTrigger value="system_admin">Systemadmin</TabsTrigger>
                      <TabsTrigger value="reporting">Rapportering</TabsTrigger>
                      <TabsTrigger value="data_management">Databehandling</TabsTrigger>
                    </TabsList>
                    
                    {['client_access', 'system_admin', 'reporting', 'data_management'].map(category => (
                      <TabsContent key={category} value={category}>
                        <div className="space-y-3">
                          {getPermissionsByCategory(category).map(permission => (
                            <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-sm text-muted-foreground">{permission.description}</div>
                              </div>
                              <Switch />
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
                  <Button onClick={handleCreateCustomRole}>
                    Opprett rolle
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Roller og tillatelser</TabsTrigger>
          <TabsTrigger value="temporary">Midlertidige tilganger</TabsTrigger>
          <TabsTrigger value="audit">Tilgangslogg</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Roller
                </CardTitle>
                <CardDescription>
                  Administrer tilgjengelige roller
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roles.map(role => (
                    <div 
                      key={role.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRole === role.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                        {role.isSystemRole && (
                          <Badge variant="secondary">System</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permissions for selected role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Tillatelser for valgt rolle
                </CardTitle>
                <CardDescription>
                  {selectedRole ? 
                    `Tillatelser for ${roles.find(r => r.id === selectedRole)?.name}` :
                    'Velg en rolle for å se tillatelser'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRole ? (
                  <div className="space-y-4">
                    {['client_access', 'system_admin', 'reporting', 'data_management'].map(category => {
                      const categoryPermissions = getPermissionsByCategory(category);
                      const selectedRoleObj = roles.find(r => r.id === selectedRole);
                      const hasPermissions = categoryPermissions.some(p => 
                        selectedRoleObj?.permissions.includes(p.id)
                      );
                      
                      if (!hasPermissions) return null;
                      
                      return (
                        <div key={category}>
                          <h4 className="font-medium mb-2">{getCategoryName(category)}</h4>
                          <div className="space-y-2">
                            {categoryPermissions
                              .filter(p => selectedRoleObj?.permissions.includes(p.id))
                              .map(permission => (
                                <div key={permission.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <div>
                                    <div className="text-sm font-medium">{permission.name}</div>
                                    <div className="text-xs text-muted-foreground">{permission.description}</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Velg en rolle fra listen til venstre
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="temporary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Midlertidige tilganger
              </CardTitle>
              <CardDescription>
                Oversikt over alle midlertidige tilganger som er gitt
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTempAccess ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Laster midlertidige tilganger...</div>
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bruker</TableHead>
                    <TableHead>Ressurs</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Fra dato</TableHead>
                    <TableHead>Til dato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gitt av</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transformedTempAccesses.map(access => (
                    <TableRow key={access.id}>
                      <TableCell>{access.userName}</TableCell>
                      <TableCell>{access.resource}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {access.resourceType === 'client' && <Users className="h-3 w-3" />}
                          {access.resourceType === 'department' && <Building className="h-3 w-3" />}
                          {access.resourceType === 'system' && <Shield className="h-3 w-3" />}
                          {access.resourceType}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(access.startDate).toLocaleDateString('nb-NO')}</TableCell>
                      <TableCell>{new Date(access.endDate).toLocaleDateString('nb-NO')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(access.status)}>
                          {access.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{access.grantedBy}</TableCell>
                      <TableCell>
                         {access.status === 'active' && (
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => handleRevokeAccess(access.id)}
                             disabled={revokeTempAccess.isPending}
                           >
                             Tilbakekall
                           </Button>
                         )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Tilgangslogg
              </CardTitle>
              <CardDescription>
                Logg over alle tilgangsendringer og admin-handlinger
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAuditLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Laster audit logs...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tidspunkt</TableHead>
                      <TableHead>Bruker</TableHead>
                      <TableHead>Handling</TableHead>
                      <TableHead>Mål</TableHead>
                      <TableHead>Beskrivelse</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.created_at).toLocaleDateString('nb-NO', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          {log.user?.first_name && log.user?.last_name
                            ? `${log.user.first_name} ${log.user.last_name}`
                            : log.user?.email || 'Ukjent bruker'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.target_user?.first_name && log.target_user?.last_name
                            ? `${log.target_user.first_name} ${log.target_user.last_name}`
                            : log.target_user?.email || '-'
                          }
                        </TableCell>
                        <TableCell>{log.description}</TableCell>
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

export default GranularAccessControl;