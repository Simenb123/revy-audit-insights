
import React, { useMemo, useState } from 'react';
import { useFirmAccessRequests } from '@/hooks/useFirmAccessRequests';
import { useApproveFirmAccess } from '@/hooks/useApproveFirmAccess';
import { useRejectFirmAccess } from '@/hooks/useRejectFirmAccess';
import type { UserRole } from '@/types/organization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, UserX } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const roleOptions: UserRole[] = ['employee', 'manager', 'partner', 'admin'];

const StatusBadge = ({ status }: { status: 'pending' | 'approved' | 'rejected' | 'cancelled' }) => {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'destructive',
    cancelled: 'secondary',
  };
  return <Badge variant={map[status] as any}>{status}</Badge>;
};

const FirmAccessRequests = () => {
  const { data: requests = [], isLoading } = useFirmAccessRequests();
  const approve = useApproveFirmAccess();
  const reject = useRejectFirmAccess();

  const [roleByRequest, setRoleByRequest] = useState<Record<string, UserRole>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'cancelled'>('pending');

  const pending = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);
  const approved = useMemo(() => requests.filter((r) => r.status === 'approved'), [requests]);
  const rejected = useMemo(() => requests.filter((r) => r.status === 'rejected'), [requests]);
  const cancelled = useMemo(() => requests.filter((r) => r.status === 'cancelled'), [requests]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tilgangsforespørsler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Laster forespørsler...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tilgangsforespørsler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="pending">Åpne ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Godkjent ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Avslått ({rejected.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Kansellert ({cancelled.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <div className="text-sm text-muted-foreground">Ingen åpne forespørsler.</div>
            ) : (
              <div className="space-y-3">
                {pending.map((req) => {
                  const selectedRole = roleByRequest[req.id] ?? (req.role_requested as UserRole);
                  return (
                    <div key={req.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 border rounded-md">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={req.status} />
                          <div className="font-medium">{req.email ?? 'Ukjent e-post'}</div>
                        </div>
                        {req.message && (
                          <div className="text-sm text-muted-foreground">{req.message}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Sendt: {new Date(req.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedRole}
                          onValueChange={(v: UserRole) => setRoleByRequest((s) => ({ ...s, [req.id]: v }))}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Velg rolle" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              disabled={approve.isPending}
                              className="gap-1"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Godkjenn
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Godkjenn tilgang?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Brukeren vil legges til i firmaet med rollen "{selectedRole}". Du kan endre rollen senere.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction onClick={() => approve.mutate({ requestId: req.id, assignRole: selectedRole })}>
                                Bekreft
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={reject.isPending}
                              className="gap-1"
                            >
                              <UserX className="h-4 w-4" />
                              Avslå
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Avslå forespørsel?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Dette vil markere forespørselen som avslått. Brukeren kan sende ny forespørsel senere.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction onClick={() => reject.mutate({ requestId: req.id })}>
                                Bekreft
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approved.length === 0 ? (
              <div className="text-sm text-muted-foreground">Ingen godkjente forespørsler.</div>
            ) : (
              <div className="space-y-2">
                {approved.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.status} />
                      <div>{req.email ?? req.requester_profile_id}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {req.decided_at ? `Besluttet: ${new Date(req.decided_at).toLocaleString()}` : `Opprettet: ${new Date(req.created_at).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejected.length === 0 ? (
              <div className="text-sm text-muted-foreground">Ingen avslåtte forespørsler.</div>
            ) : (
              <div className="space-y-2">
                {rejected.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.status} />
                      <div>{req.email ?? req.requester_profile_id}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {req.decided_at ? `Besluttet: ${new Date(req.decided_at).toLocaleString()}` : `Opprettet: ${new Date(req.created_at).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {cancelled.length === 0 ? (
              <div className="text-sm text-muted-foreground">Ingen kansellerte forespørsler.</div>
            ) : (
              <div className="space-y-2">
                {cancelled.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.status} />
                      <div>{req.email ?? req.requester_profile_id}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {req.decided_at ? `Besluttet: ${new Date(req.decided_at).toLocaleString()}` : `Opprettet: ${new Date(req.created_at).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FirmAccessRequests;
