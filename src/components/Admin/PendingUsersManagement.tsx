import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserCheck, UserX, Clock, Mail, Building } from 'lucide-react';
import { usePendingUsers, useApproveUser, useRejectUser, type PendingUser } from '@/hooks/usePendingUsers';
import type { UserRole } from '@/types/organization';

const PendingUsersManagement = () => {
  const { data: pendingUsers, isLoading } = usePendingUsers();
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const handleApprove = (userId: string) => {
    approveUser.mutate({ userId, role: selectedRole });
  };

  const handleReject = (userId: string) => {
    rejectUser.mutate({ userId, reason: rejectionReason });
    setRejectionReason('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nb-NO');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ventende brukere
          </CardTitle>
          <CardDescription>Laster ventende brukerregistreringer...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pendingUsers || pendingUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ventende brukere
          </CardTitle>
          <CardDescription>Ingen brukere venter på godkjenning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Alle registreringer er behandlet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Ventende brukere
          <Badge variant="secondary">{pendingUsers.length}</Badge>
        </CardTitle>
        <CardDescription>
          Godkjenn eller avvis nye brukerregistreringer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingUsers.map((user: PendingUser) => (
            <div key={user.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      {user.first_name} {user.last_name}
                    </h4>
                    <Badge variant="outline">Venter</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  
                  {user.workplace_company_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="h-4 w-4" />
                      {user.workplace_company_name}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Registrert: {formatDate(user.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Godkjenn
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Godkjenn bruker</AlertDialogTitle>
                        <AlertDialogDescription>
                          Du er i ferd med å godkjenne {user.first_name} {user.last_name} ({user.email}).
                          Brukeren vil få tilgang til systemet.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="role">Tildel rolle</Label>
                          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Ansatt</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="partner">Partner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleApprove(user.id)}
                          disabled={approveUser.isPending}
                        >
                          {approveUser.isPending ? 'Godkjenner...' : 'Godkjenn'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        <UserX className="h-4 w-4 mr-1" />
                        Avvis
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Avvis bruker</AlertDialogTitle>
                        <AlertDialogDescription>
                          Du er i ferd med å avvise {user.first_name} {user.last_name} ({user.email}).
                          Brukeren vil bli slettet fra systemet permanent.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reason">Årsak (valgfritt)</Label>
                          <Textarea
                            id="reason"
                            placeholder="Begrunn hvorfor brukeren avvises..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                        </div>
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleReject(user.id)}
                          disabled={rejectUser.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {rejectUser.isPending ? 'Avviser...' : 'Avvis'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingUsersManagement;