
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientTeam, Department } from '@/types/organization';

interface TeamOverviewProps {
  teams: ClientTeam[];
  departments: Department[];
}

const TeamOverview = ({ teams, departments }: TeamOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team oversikt</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <h3 className="text-2xl font-bold">{teams.length}</h3>
            <p className="text-sm text-muted-foreground">Totalt antall team</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <h3 className="text-2xl font-bold">{teams.filter(t => t.isActive).length}</h3>
            <p className="text-sm text-muted-foreground">Aktive team</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <h3 className="text-2xl font-bold">{departments.length}</h3>
            <p className="text-sm text-muted-foreground">Avdelinger</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamOverview;
