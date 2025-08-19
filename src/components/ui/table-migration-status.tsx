import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Wrench } from 'lucide-react';

interface TableMigrationStatusProps {
  className?: string;
}

const TableMigrationStatus: React.FC<TableMigrationStatusProps> = ({ className }) => {
const tables = [
    {
      name: 'KnowledgeMonitor',
      path: 'src/components/AIRevyAdmin/KnowledgeMonitor.tsx',
      status: 'completed',
      features: ['Søk', 'Sortering', 'Export', 'Kolonnevalg', 'Norske tegn'],
      description: 'Overvåking av kunnskapsbase artikler'
    },
    {
      name: 'BillingRatesManager',
      path: 'src/components/Billing/BillingRatesManager.tsx', 
      status: 'completed',
      features: ['Custom inputs', 'Actions', 'Export', 'Formatering'],
      description: 'Administrasjon av timesatser'
    },
    {
      name: 'PayrollEmployeesTab',
      path: 'src/components/AccountingData/PayrollEmployeesTab.tsx',
      status: 'completed',
      features: ['Søk', 'Sortering', 'Export', 'Formatering'],
      description: 'Visning av ansattdata fra A07'
    },
    {
      name: 'PayrollMonthlySubmissionsTab',
      path: 'src/components/AccountingData/PayrollMonthlySubmissionsTab.tsx',
      status: 'completed',
      features: ['Søk', 'Sortering', 'Export', 'Beløpsformatering'],
      description: 'Månedlige lønnsrapporter'
    },
    {
      name: 'AssetsList',
      path: 'src/components/assets/AssetsList.tsx',
      status: 'completed',
      features: ['Actions', 'Status badges', 'Export', 'Loading states'],
      description: 'Anleggsmidler oversikt'
    },
    {
      name: 'TransactionSampling',
      path: 'src/components/DataAnalysis/TransactionSampling.tsx',
      status: 'completed',
      features: ['Interactive switches', 'Custom formatting', 'Export'],
      description: 'Transaksjonsutvalg tabell'
    },
    {
      name: 'AccountMappingTable',
      path: 'src/components/Accounting/AccountMappingTable.tsx',
      status: 'complex',
      features: ['Custom dropdowns', 'Tabs', 'Interactive mapping'],
      description: 'Kontomapping - trenger custom tilnærming'
    },
    {
      name: 'DrillDownTable',
      path: 'src/components/DataAnalysis/DrillDownTable.tsx',
      status: 'complex', 
      features: ['Multi-level navigation', 'Custom rendering'],
      description: 'Drill-down analyse - kompleks navigasjon'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'complex':
        return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Ferdig</Badge>;
      case 'complex':
        return <Badge variant="secondary">Kompleks</Badge>;
      case 'pending':
        return <Badge variant="outline">Venter</Badge>;
      default:
        return <Badge variant="outline">Ukjent</Badge>;
    }
  };

  const completedCount = tables.filter(t => t.status === 'completed').length;
  const totalCount = tables.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Standardisering av Tabeller
        </CardTitle>
        <CardDescription>
          Status for migrering til StandardDataTable komponent
        </CardDescription>
        <div className="flex items-center gap-4 pt-2">
          <Badge variant="default" className="px-3 py-1">
            {completedCount} av {totalCount} ferdig
          </Badge>
          <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="px-3 py-1">
            {completionPercentage}% komplett
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {tables.map((table) => (
            <div 
              key={table.name}
              className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(table.status)}
                  <span className="font-medium">{table.name}</span>
                  {getStatusBadge(table.status)}
                </div>
                <p className="text-sm text-muted-foreground">{table.description}</p>
                <div className="flex flex-wrap gap-1">
                  {table.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{table.path}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Globale Forbedringer Implementert:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Velg kolonner på alle StandardDataTable
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Export til Excel
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Søk og filtrering
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Konsistent sortering
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Sticky headers fikset
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Norske tegn støtte
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Automatisk kolonjustering
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Unified loading states
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Siste Migrering:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✅ PayrollMonthlySubmissionsTab - Komplett med beløpsformatering</li>
            <li>✅ AssetsList - Med action buttons og status badges</li>
            <li>✅ TransactionSampling - Interactive switches og custom formatting</li>
            <li>🔧 DrillDownTable - Markert som kompleks (multi-level navigasjon)</li>
          </ul>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Neste Steg:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Alle enkle tabeller nå migrert til StandardDataTable</li>
            <li>• AccountMappingTable og DrillDownTable krever custom løsninger</li>
            <li>• Test alle migrerte tabeller grundig</li>
            <li>• Implementer row expansion for komplekse tabeller</li>
            <li>• Legg til bulk actions støtte</li>
            <li>• Optimaliser performance for store datasett</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TableMigrationStatus;