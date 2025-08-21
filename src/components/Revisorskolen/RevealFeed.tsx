import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface RevealItem {
  id: string;
  title: string;
  text: string;
  reveal_key?: string | null;
  action_type: string;
  cost: number;
  timestamp: Date;
}

interface RevealFeedProps {
  items: RevealItem[];
}

export const RevealFeed = ({ items }: RevealFeedProps) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Eye className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground mb-2">
          Ingen informasjon avdekket enda
        </p>
        <p className="text-sm text-muted-foreground">
          Utfør handlinger for å avdekke viktig informasjon om revisjonen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Avdekket informasjon</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <Card key={item.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{item.title}</span>
                  {item.reveal_key && (
                    <Badge variant="outline" className="text-xs">
                      {getRiskKeyLabel(item.reveal_key)}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{item.cost} kr</span>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit">
                {getActionTypeLabel(item.action_type)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground">
                <ReactMarkdown>{item.text}</ReactMarkdown>
              </div>
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                {item.timestamp.toLocaleTimeString('nb-NO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

function getRiskKeyLabel(key: string): string {
  const labels: Record<string, string> = {
    'periodisering': 'Periodisering',
    'ulovlig_laan': 'Ulovlig lån',
    'varelager_nedskrivning': 'Varelager',
    'tapsrisiko_fordringer': 'Kundefordringer'
  };
  return labels[key] || key;
}

function getActionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'forespørsel': 'Forespørsel',
    'inspeksjon': 'Inspeksjon',
    'observasjon': 'Observasjon',
    'analytisk': 'Analytisk',
    'gjentakelse': 'Gjentakelse'
  };
  return labels[type] || type;
}