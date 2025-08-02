import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings2 } from 'lucide-react';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnChange: (key: string, visible: boolean) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, onColumnChange }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Velg kolonner
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Velg hvilke kolonner som skal vises</h4>
          <div className="space-y-3">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center space-x-2">
                <Checkbox
                  id={column.key}
                  checked={column.visible}
                  onCheckedChange={(checked) => onColumnChange(column.key, !!checked)}
                  disabled={column.required}
                />
                <label
                  htmlFor={column.key}
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    column.required ? 'text-muted-foreground' : ''
                  }`}
                >
                  {column.label}
                  {column.required && ' (påkrevd)'}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnSelector;