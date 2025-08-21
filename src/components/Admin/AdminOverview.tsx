import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  Shield,
  UserX,
  Database,
  Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAllUserProfiles } from '@/hooks/useAllUserProfiles';
import { useFirmAccessRequests } from '@/hooks/useFirmAccessRequests';
import { useFirmEmployees } from '@/hooks/useFirmEmployees';

const AdminOverview = () => {
  const { data: allUsers = [] } = useAllUserProfiles();
  const { data: accessRequests = [] } = useFirmAccessRequests();
  const { data: firmEmployees = [] } = useFirmEmployees();

  const pendingRequests = accessRequests.filter(req => req.status === 'pending');
  const activeEmployees = firmEmployees.filter(emp => emp.status === 'active');
  const inactiveEmployees = firmEmployees.filter(emp => emp.status === 'inactive');

  const usersByRole = allUsers.reduce((acc, user) => {
    acc[user.user_role] = (acc[user.user_role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentActivity = [
    { type: 'user_added', message: 'Ny bruker registrert', time: '2 timer siden', icon: Users },
    { type: 'role_changed', message: 'Brukerrolle endret', time: '4 timer siden', icon: Shield },
    { type: 'access_request', message: 'Ny tilgangsforespørsel', time: '6 timer siden', icon: UserCheck },
  ];

  const quickActions = [
    { title: 'Legg til bruker', description: 'Registrer ny ansatt', href: '/admin/users', icon: Users, color: 'bg-blue-500' },
    { title: 'Behandle forespørsler', description: `${pendingRequests.length} ventende`, href: '/admin/access-requests', icon: UserCheck, color: 'bg-green-500' },
    { title: 'Roller & tilgang', description: 'Administrer rettigheter', href: '/admin/roles', icon: Shield, color: 'bg-purple-500' },
    { title: 'Aktivitetslogg', description: 'Se systemaktivitet', href: '/admin/audit', icon: Clock, color: 'bg-orange-500' },
    { title: 'RAG Admin', description: 'Juridisk relasjonskart', href: '/admin/rag/juridisk', icon: Database, color: 'bg-indigo-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administrasjonsoversikt</h1>
        <p className="text-muted-foreground">
          Oversikt over brukere, tilganger og systemaktivitet
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt brukere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 fra forrige måned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventende forespørsler</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              Krever behandling
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive ansatte</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
            <p className="text-xs text-muted-foreground">
              {inactiveEmployees.length} inaktive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Systemstatus</CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">OK</div>
            <p className="text-xs text-muted-foreground">
              Alle systemer operative
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hurtighandlinger</CardTitle>
            <CardDescription>
              Vanlige administrative oppgaver
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.href}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className={`p-1 rounded ${action.color} text-white`}>
                          <action.icon className="h-3 w-3" />
                        </div>
                        {action.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Nylig aktivitet</CardTitle>
            <CardDescription>
              Siste systemhendelser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <activity.icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link to="/admin/audit">Se alle aktiviteter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rollefordeling</CardTitle>
            <CardDescription>
              Fordeling av brukerroller i systemet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {role}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Systemmetrikker</CardTitle>
            <CardDescription>
              Viktige systemtall
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Totalt brukere</span>
                <span className="font-medium">{allUsers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ventende forespørsler</span>
                <span className="font-medium">{pendingRequests.length}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-muted-foreground">Aktive ansatte</span>
                 <span className="font-medium">{activeEmployees.length}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Inaktive ansatte</span>
                 <span className="font-medium">{inactiveEmployees.length}</span>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>

       {/* RAG & Knowledge Management */}
       <div className="grid grid-cols-1 gap-6">
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Brain className="h-5 w-5 text-indigo-500" />
               RAG & Kunnskapsstyring
             </CardTitle>
             <CardDescription>
               Administrer AI-drevne kunnskapssystemer
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               <div className="flex items-center gap-3 p-3 border rounded-lg">
                 <div className="p-2 rounded-full bg-indigo-50">
                   <Database className="h-4 w-4 text-indigo-600" />
                 </div>
                 <div className="flex-1">
                   <h4 className="font-medium">Juridisk Relasjonskart</h4>
                   <p className="text-sm text-muted-foreground">
                     Administrer relasjoner mellom juridiske kilder og bestemmelser
                   </p>
                 </div>
                 <Button variant="outline" size="sm" asChild>
                   <Link to="/admin/rag/juridisk">Åpne</Link>
                 </Button>
               </div>
               
               <div className="bg-muted/50 p-3 rounded-lg">
                 <h5 className="text-sm font-medium mb-2">Funksjoner:</h5>
                 <ul className="text-xs text-muted-foreground space-y-1">
                   <li>• Dokumentvalg og type-kategorisering</li>
                   <li>• Bestemmelsessøk og relasjonsadministrasjon</li>
                   <li>• Grafisk visualisering med React Flow</li>
                   <li>• Demo-modus for testing</li>
                 </ul>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
  );
};

export default AdminOverview;