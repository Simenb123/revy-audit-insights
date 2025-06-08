
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TestTube } from 'lucide-react';

interface TestDataBadgeProps {
  isTestData?: boolean;
}

const TestDataBadge: React.FC<TestDataBadgeProps> = ({ isTestData }) => {
  if (!isTestData) return null;

  return (
    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
      <TestTube size={12} />
      Testdata
    </Badge>
  );
};

export default TestDataBadge;
