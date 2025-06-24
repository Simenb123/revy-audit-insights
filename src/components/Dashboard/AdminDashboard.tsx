import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Settings, Users, BarChart3, Shield, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardGrid from './DashboardGrid';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administrator Dashboard</h1>
        <p className="text-muted-foreground">
          Administrer systemet og overvåk brukeraktivitet
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link to="/ai-revy-admin">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                AI Revi Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Administrer prompts og overvåk AI-bruk
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/user-admin">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Brukeradministrasjon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Administrer brukere og tilganger
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/ai-usage">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                AI-analyser
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Se AI-bruk og kostnader
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/fag">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                Kunnskapsbase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Administrer fagartikler og innhold
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/organization/settings">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4 text-orange-500" />
                Systeminnstillinger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Konfigurer systemet
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/audit-logs">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-500" />
                Revisjonslogger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Overvåk systemaktivitet
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Standard Dashboard Grid */}
      <DashboardGrid />
    </div>
  );
};

export default AdminDashboard;
