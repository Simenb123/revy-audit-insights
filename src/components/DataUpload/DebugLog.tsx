
import React from 'react';

interface DebugLogProps {
  logs: string[];
  className?: string;
}

const DebugLog = ({ logs, className = '' }: DebugLogProps) => {
  return (
    <div className={`w-full bg-gray-50 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto text-xs font-mono ${className}`}>
      {logs.map((log, i) => (
        <div key={i} className="pb-1">{log}</div>
      ))}
    </div>
  );
};

export default DebugLog;
