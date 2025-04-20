
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search, Clock } from 'lucide-react';

interface LogEntry {
  message: string;
  timestamp: string;
}

interface DebugLogProps {
  logs: string[];
  className?: string;
}

const DebugLog = ({ logs, className = '' }: DebugLogProps) => {
  const [filter, setFilter] = useState('');

  // Convert string logs to LogEntry objects with timestamps
  const logsWithTimestamps: LogEntry[] = logs.map(log => ({
    message: log,
    timestamp: new Date().toLocaleTimeString()
  }));

  const filteredLogs = logsWithTimestamps.filter(log =>
    log.message.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto text-xs font-mono">
        {filteredLogs.map((log, i) => (
          <div key={i} className="pb-1 flex items-start gap-2">
            <span className="text-gray-400 flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3" />
              {log.timestamp}
            </span>
            <span className="flex-1">{log.message}</span>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-gray-400 text-center py-2">
            {logs.length === 0 ? 'No logs available' : 'No matching logs found'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugLog;
