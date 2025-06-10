
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Plus } from 'lucide-react';
import HelpText from '@/components/HelpText/HelpText';

const EmptyState = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Velkommen til kommunikasjonshubben
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Her kan du kommunisere med kollegaer, dele informasjon om klienter, 
            og samarbeide på revisjonsoppgaver.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-medium">Team-chat</h3>
                <p className="text-sm text-muted-foreground">
                  Kommuniser med ditt team
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-medium">Avdelingssamtaler</h3>
                <p className="text-sm text-muted-foreground">
                  Delta i avdelingsdiskusjoner
                </p>
              </div>
            </div>
          </div>

          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Opprett ny samtale
          </Button>
        </CardContent>
      </Card>

      <HelpText variant="tip" title="Tips for god kommunikasjon">
        <ul className="list-disc list-inside space-y-1">
          <li>Bruk beskrivende emner for samtaler</li>
          <li>Tag relevante kollegaer i diskusjoner</li>
          <li>Hold faglige diskusjoner organisert etter tema</li>
          <li>Dokumenter viktige beslutninger i chat-historikken</li>
        </ul>
      </HelpText>
    </div>
  );
};

export default EmptyState;
