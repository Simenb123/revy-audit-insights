import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

interface MappingSummaryProps {
  totalRows: number;
  sampleRowsCount: number;
  skippedRowsCount: number;
}

const MappingSummary: React.FC<MappingSummaryProps> = ({
  totalRows,
  sampleRowsCount,
  skippedRowsCount
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">
              {totalRows} rader vil bli prosessert ved opplasting
            </span>
          </div>
          {totalRows > sampleRowsCount && (
            <p className="text-sm text-green-600 mt-1">
              Viser kun {sampleRowsCount} datarader i forhåndsvisning av totalt {totalRows} rader
            </p>
          )}
          {skippedRowsCount > 0 && (
            <p className="text-sm text-amber-600 mt-1">
              {skippedRowsCount} rad(er) før header vil bli hoppet over ved opplasting
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MappingSummary;