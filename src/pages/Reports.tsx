import React from 'react';
import { GlobalReportBuilder } from '@/components/ReportBuilder/GlobalReportBuilder';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';

export default function Reports() {
  return (
    <ResponsiveLayout maxWidth="full">
      <GlobalReportBuilder clientId="global" />
    </ResponsiveLayout>
  );
}
