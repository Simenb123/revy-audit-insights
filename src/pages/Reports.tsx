import React from 'react';
import { GlobalReportBuilder } from '@/components/ReportBuilder/GlobalReportBuilder';

export default function Reports() {
  return (
    <main className="p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Rapporter</h1>
        <p className="text-muted-foreground">Bygg rapporter på tvers av klienter</p>
      </header>
      <section>
        <GlobalReportBuilder clientId="global" />
      </section>
    </main>
  );
}
