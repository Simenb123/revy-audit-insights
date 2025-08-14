import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter, Download, Users, Settings, Database, Shield } from 'lucide-react';
import { useAdminAuditLogs } from '@/hooks/useAdminAuditLogs';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

const AuditActivity = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const { data: auditLogs, isLoading } = useAdminAuditLogs();

  const filteredLogs = auditLogs?.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || log.action_type === filterType;
    
    return matchesSearch && matchesType;
  }) || [];

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'user_management':
        return <Users className="h-4 w-4" />;
      case 'permission_change':
        return <Shield className="h-4 w-4" />;
      case 'system_config':
        return <Settings className="h-4 w-4" />;
      case 'data_access':
        return <Database className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (actionType: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (actionType) {
      case 'user_management':
        return 'default';
      case 'permission_change':
        return 'secondary';
      case 'system_config':
        return 'outline';
      case 'data_access':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const actionTypes = [...new Set(auditLogs?.map(log => log.action_type) || [])];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aktivitetslogg</h1>
        <p className="text-muted-foreground">
          Overvåk systemaktivitet og brukerhandlinger
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="detailed">Detaljert logg</TabsTrigger>
          <TabsTrigger value="analytics">Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total aktivitet</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditLogs?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Brukeradministrasjon</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditLogs?.filter(log => log.action_type === 'user_management').length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tilgangsendringer</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditLogs?.filter(log => log.action_type === 'permission_change').length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Systemkonfig</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {auditLogs?.filter(log => log.action_type === 'system_config').length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Siste aktivitet</CardTitle>
              <CardDescription>De nyeste handlingene i systemet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-3">
                      {getActionIcon(log.action_type)}
                      <div>
                        <p className="font-medium">{log.description}</p>
                        <p className="text-sm text-muted-foreground">
                          av {log.user?.email || 'Ukjent'}
                          {log.target_user && ` → ${log.target_user.email}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getActionBadgeVariant(log.action_type)}>
                        {log.action_type}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: nb })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtrer og søk</CardTitle>
              <CardDescription>Finn spesifikke handlinger og aktiviteter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk i aktivitetslogg..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle typer</SelectItem>
                    {actionTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Eksporter
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detaljert aktivitetslogg</CardTitle>
              <CardDescription>
                Viser {filteredLogs.length} av {auditLogs?.length || 0} oppføringer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getActionIcon(log.action_type)}
                          <div className="flex-1">
                            <p className="font-medium">{log.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Utført av: {log.user?.email || 'Ukjent'}
                              {log.target_user && (
                                <span> • Påvirket bruker: {log.target_user.email}</span>
                              )}
                            </p>
                            {(log.old_values || log.new_values) && (
                              <div className="mt-2 text-xs">
                                {log.old_values && Object.keys(log.old_values).length > 0 && (
                                  <div>
                                    <span className="font-medium">Gamle verdier:</span>
                                    <code className="ml-2 bg-muted px-1 rounded">
                                      {JSON.stringify(log.old_values)}
                                    </code>
                                  </div>
                                )}
                                {log.new_values && Object.keys(log.new_values).length > 0 && (
                                  <div>
                                    <span className="font-medium">Nye verdier:</span>
                                    <code className="ml-2 bg-muted px-1 rounded">
                                      {JSON.stringify(log.new_values)}
                                    </code>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getActionBadgeVariant(log.action_type)}>
                            {log.action_type}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: nb })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Ingen aktivitet funnet</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitetsanalyse</CardTitle>
              <CardDescription>Oversikt over systembruk og mønstre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Aktivitet etter type</h4>
                  <div className="space-y-2">
                    {actionTypes.map(type => {
                      const count = auditLogs?.filter(log => log.action_type === type).length || 0;
                      const percentage = auditLogs?.length ? (count / auditLogs.length) * 100 : 0;
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm">{type}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Mest aktive brukere</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      auditLogs?.reduce((acc, log) => {
                        const userEmail = log.user?.email || 'Ukjent';
                        acc[userEmail] = (acc[userEmail] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>) || {}
                    )
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([email, count]) => (
                        <div key={email} className="flex items-center justify-between">
                          <span className="text-sm">{email}</span>
                          <Badge variant="outline">{count} handlinger</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditActivity;