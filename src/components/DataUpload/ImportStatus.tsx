
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Check, AlertCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import DebugLog from './DebugLog';

interface LogEntry {
  message: string;
  timestamp: string;
}

interface ImportStatusProps {
  isImporting: boolean;
  hasError: boolean;
  errorDetails: string;
  progress: number;
  processedRows: number;
  totalRows: number;
  successCount: number;
  fileName: string;
  debug: string[] | LogEntry[];
}

const ImportStatus = ({
  isImporting,
  hasError,
  errorDetails,
  progress,
  processedRows,
  totalRows,
  successCount,
  fileName,
  debug
}: ImportStatusProps) => {
  if (isImporting) {
    return (
      <div className="space-y-4">
        <Progress value={progress} />
        <p className="text-sm text-center">
          Behandler {processedRows} av {totalRows} klienter...
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border-2 border-red-100 bg-red-50 rounded-lg">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-red-800">Import feilet</h3>
        <p className="text-center text-red-700 mt-2 mb-4">
          {errorDetails || 'Det oppstod en feil under importen.'}
        </p>
        <DebugLog logs={debug} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-green-100 bg-green-50 rounded-lg">
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Check className="w-6 h-6 text-green-600" />
      </div>
      <h3 className="text-lg font-medium text-green-800">Import fullført</h3>
      <p className="text-center text-green-700 mt-2">
        {successCount} av {totalRows} klienter ble importert til databasen fra filen {fileName}
      </p>
      {successCount > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded flex items-start gap-2 text-sm">
          <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-700">Du kan nå se dine importerte klienter i klientoversikten.</p>
          </div>
        </div>
      )}
      <DebugLog logs={debug} className="mt-4" />
    </div>
  );
};

export default ImportStatus;
