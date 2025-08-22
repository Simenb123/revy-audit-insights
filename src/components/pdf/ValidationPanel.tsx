import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BilagType } from '@/types/bilag';

interface ValidationPanelProps {
  rows: any[];
  bilagGroups: Record<string, any[]>;
  detectedColumns: string[];
  mvaSatser: number[];
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  rows,
  bilagGroups,
  detectedColumns,
  mvaSatser
}) => {
  const typeDistribution = Object.values(bilagGroups).reduce((acc, group) => {
    // Simplified type detection for display
    const accounts = group.map(r => r.konto).filter(Boolean);
    let type: BilagType = 'diversebilag';
    
    if (accounts.some(a => a >= 3000 && a < 4000)) type = 'salgsfaktura';
    else if (accounts.some(a => a >= 4000 && a < 8000)) type = 'leverandorfaktura';
    else if (accounts.includes(1920) && accounts.includes(1500)) type = 'kundebetaling';
    else if (accounts.includes(1920) && accounts.includes(2400)) type = 'leverandorbetaling';
    else if (accounts.includes(8160)) type = 'bankbilag';
    
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<BilagType, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Rader</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rows.length}</div>
          <p className="text-xs text-muted-foreground">Totalt antall rader</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bilag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Object.keys(bilagGroups).length}</div>
          <p className="text-xs text-muted-foreground">Unike bilag funnet</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Kolonner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {detectedColumns.slice(0, 5).map(col => (
              <Badge key={col} variant="secondary" className="text-xs">
                {col}
              </Badge>
            ))}
            {detectedColumns.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{detectedColumns.length - 5}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Typer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(typeDistribution).map(([type, count]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="capitalize">
                  {type === 'salgsfaktura' ? 'Salgsfaktura' :
                   type === 'leverandorfaktura' ? 'Innkjøpsfaktura' :
                   type === 'kundebetaling' ? 'Kundebetaling' :
                   type === 'leverandorbetaling' ? 'Leverandørbetaling' :
                   type === 'bankbilag' ? 'Bankbilag' :
                   'Diversebilag'}
                </span>
                <Badge variant="outline" className="text-xs">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};