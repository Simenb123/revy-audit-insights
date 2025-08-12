import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Calendar, Hash } from 'lucide-react';
import { useClientDetails } from '@/hooks/useClientDetails';
import { formatDate } from '@/lib/formatters';
import { useThemeConfig } from '@/contexts/ThemeContext';
import { logos } from '@/styles/theme';

interface ClientReportHeaderProps {
  clientId: string;
  selectedFiscalYear: number;
}

export function ClientReportHeader({ clientId, selectedFiscalYear }: ClientReportHeaderProps) {
  const { data: client, isLoading } = useClientDetails(clientId);
  const { theme } = useThemeConfig();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!client) {
    return null;
  }

  const periodStart = new Date(selectedFiscalYear, 0, 1);
  const periodEnd = new Date(selectedFiscalYear, 11, 31);

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {theme.logo && (
                <img src={logos[theme.logo]} alt="Logo" className="h-8" />
              )}
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {client.name}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                <span>Org.nr: {client.org_number}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Periode: {formatDate(periodStart.toISOString())} - {formatDate(periodEnd.toISOString())}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}