import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import { useReportBuilderSettings } from '@/hooks/useReportBuilderSettings';

interface ViewModeToggleProps {
  fiscalYear: number;
  disabled?: boolean;
}

export function ViewModeToggle({ fiscalYear, disabled }: ViewModeToggleProps) {
  const [settings, saveSettings] = useReportBuilderSettings('global', fiscalYear);
  const isViewMode = settings.isViewMode ?? false;

  const toggleViewMode = () => {
    saveSettings({ ...settings, isViewMode: !isViewMode });
  };

  return (
    <Button
      variant={isViewMode ? "default" : "outline"}
      size="sm"
      onClick={toggleViewMode}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      {isViewMode ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
      {isViewMode ? 'Visningsmodus' : 'Redigeringsmodus'}
    </Button>
  );
}