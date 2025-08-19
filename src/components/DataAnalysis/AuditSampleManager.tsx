import React, { useState } from 'react';
import SavedSamplesManager from './SavedSamplesManager';
import SampleReviewTable from './SampleReviewTable';

interface SavedSample {
  id: string;
  client_id: string;
  fiscal_year: number;
  test_type: string;
  method: string;
  population_size: number;
  population_sum: number;
  materiality?: number;
  expected_misstatement?: number;
  confidence_level: number;
  risk_level: string;
  tolerable_deviation_rate?: number;
  expected_deviation_rate?: number;
  strata_bounds?: number[];
  threshold_amount?: number;
  recommended_sample_size: number;
  actual_sample_size: number;
  coverage_percentage: number;
  plan_name?: string;
  notes?: string;
  metadata: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface AuditSampleManagerProps {
  clientId: string;
}

const AuditSampleManager: React.FC<AuditSampleManagerProps> = ({ clientId }) => {
  const [currentView, setCurrentView] = useState<'list' | 'review'>('list');
  const [selectedSample, setSelectedSample] = useState<SavedSample | null>(null);

  const handleViewSample = (sample: SavedSample) => {
    setSelectedSample(sample);
    setCurrentView('review');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedSample(null);
  };

  if (currentView === 'review' && selectedSample) {
    return (
      <SampleReviewTable
        planId={selectedSample.id}
        planName={selectedSample.plan_name || 'Uten navn'}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <SavedSamplesManager
      clientId={clientId}
      onViewSample={handleViewSample}
    />
  );
};

export default AuditSampleManager;