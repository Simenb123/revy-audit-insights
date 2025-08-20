import React from 'react';
import { GlobalReportBuilder } from '@/components/ReportBuilder/GlobalReportBuilder';

export default function Reports() {
  return (
    <main className="p-4 md:p-6">
      <header className="mb-4">
      </header>
      <section>
        <GlobalReportBuilder clientId="global" />
      </section>
    </main>
  );
}
