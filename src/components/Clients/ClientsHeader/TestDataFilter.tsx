
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TestDataFilterProps {
  showTestData: boolean;
  onToggle: (show: boolean) => void;
}

const TestDataFilter: React.FC<TestDataFilterProps> = ({ showTestData, onToggle }) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="show-test-data"
        checked={showTestData}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="show-test-data" className="text-sm">
        Vis testdata
      </Label>
    </div>
  );
};

export default TestDataFilter;
