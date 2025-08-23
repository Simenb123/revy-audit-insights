import React from 'react';
import { useClientAnnualData, useUpdateClientAnnualData } from '@/hooks/useClientAnnualData';
import EditableClientField from './EditableClientField';

interface EmployeeCountFieldProps {
  clientId: string;
  fiscalYear: number;
  className?: string;
}

const EmployeeCountField: React.FC<EmployeeCountFieldProps> = ({
  clientId,
  fiscalYear,
  className,
}) => {
  const { data: annualData, isLoading } = useClientAnnualData(clientId, fiscalYear);
  const updateAnnualData = useUpdateClientAnnualData();

      const handleEmployeeCountUpdate = (newCount: number | null) => {
        updateAnnualData.mutate({
          clientId,
          fiscalYear,
          employeeCount: newCount,
        });
      };

      // Create a custom mutation function for the EditableClientField
      const customUpdateField = {
        mutate: ({ value }: { clientId: string; field: string; value: any }) => {
          handleEmployeeCountUpdate(parseInt(value) || null);
        },
        isPending: updateAnnualData.isPending,
      };

  if (isLoading) {
    return <div className="animate-pulse bg-muted h-16 rounded-lg" />;
  }

  return (
    <div className={className}>
      <label className="text-sm font-medium text-muted-foreground mb-2 block">
        Antall ansatte ({fiscalYear})
      </label>
      <div className="space-y-2">
        <EditableClientField
          clientId={clientId}
          field="employee_count"
          value={annualData?.employee_count || null}
          type="number"
          placeholder="Angi antall ansatte"
          isEmpty={!annualData?.employee_count}
          className="w-full"
        />
        {!annualData?.employee_count && (
          <p className="text-xs text-muted-foreground">
            Antall ansatte påvirker valg av finansielt rammeverk
          </p>
        )}
      </div>
    </div>
  );
};

export default EmployeeCountField;