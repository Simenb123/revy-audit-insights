
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { 
  Brain, 
  Users, 
  Database, 
  Activity, 
  Settings, 
  BarChart3,
  Shield,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminSidebarContent = () => {
  return (
    <Accordion type="multiple" className="space-y-4">
      <AccordionItem value="status" className="border-none">
        <Card>
          <CardHeader>
            <AccordionTrigger className="flex items-center gap-2 p-0">
              <Brain className="w-4 h-4" />
              AI Revi Status
            </AccordionTrigger>
            <CardDescription>Systemstatus og oversikt</CardDescription>
          </CardHeader>
          <AccordionContent>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">System</span>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Tjenester</span>
                <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge className="bg-green-100 text-green-800">Tilkoblet</Badge>
              </div>
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>

      <AccordionItem value="stats" className="border-none">
        <Card>
          <CardHeader>
            <AccordionTrigger className="flex items-center gap-2 p-0">
              <BarChart3 className="w-4 h-4" />
              Systemstatistikk
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Aktive organisasjoner</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Totalt brukere</span>
                <Badge variant="secondary">45</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dokumenter</span>
                <Badge variant="secondary">1,234</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Forespørsler (i dag)</span>
                <Badge variant="secondary">89</Badge>
              </div>
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>

      <AccordionItem value="activity" className="border-none">
        <Card>
          <CardHeader>
            <AccordionTrigger className="flex items-center gap-2 p-0">
              <Activity className="w-4 h-4" />
              Siste aktivitet
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>For 5 min siden</span>
                </div>
                <p>Ny organisasjon registrert</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>For 12 min siden</span>
                </div>
                <p>Embeddings regenerert</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>For 1 time siden</span>
                </div>
                <p>Database backup fullført</p>
              </div>
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>

      <AccordionItem value="actions" className="border-none">
        <Card>
          <CardHeader>
            <AccordionTrigger className="flex items-center gap-2 p-0">
              <Shield className="w-4 h-4" />
              Hurtighandlinger
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/user-admin">
                  <Users className="w-3 h-3 mr-2" />
                  Brukeradministrasjon
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/ai-usage">
                  <BarChart3 className="w-3 h-3 mr-2" />
                  AI-analyser
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/organization/settings">
                  <Settings className="w-3 h-3 mr-2" />
                  Systeminnstillinger
                </Link>
              </Button>
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
};

export default AdminSidebarContent;
