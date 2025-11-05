import React from 'react';
import { GlobalReportBuilder } from '@/components/ReportBuilder/GlobalReportBuilder';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';

export default function AccountingAnalysis() {
  return (
    <ResponsiveLayout maxWidth="full">
      <div className="space-y-[var(--content-gap)]">
        <header>
          <h1 className="text-2xl font-bold">Regnskapsanalyse</h1>
          <p className="text-muted-foreground">
            Fleksibel regnskapsanalyse med hierarkisk drilldown fra kategorier til transaksjoner
          </p>
        </header>
        <section>
          <GlobalReportBuilder clientId="global" />
        </section>
      </div>
    </ResponsiveLayout>
  );
}