import React from 'react';
import { GlobalReportBuilder } from '@/components/ReportBuilder/GlobalReportBuilder';

export default function AccountingAnalysis() {
  return (
    <main className="p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Regnskapsanalyse</h1>
        <p className="text-muted-foreground">
          Fleksibel regnskapsanalyse med hierarkisk drilldown fra kategorier til transaksjoner
        </p>
      </header>
      <section>
        <GlobalReportBuilder clientId="global" />
      </section>
    </main>
  );
}