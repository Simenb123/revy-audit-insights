
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface LogEntry {
  message: string;
  timestamp: string;
  type?: 'error' | 'success' | 'warning' | 'info';
}

interface DebugLogProps {
  logs: string[] | LogEntry[];
  className?: string;
  title?: string;
}

const DebugLog = ({ logs, className = '', title = 'Debug Log' }: DebugLogProps) => {
  const [filter, setFilter] = useState('');

  // Convert string logs to LogEntry objects with timestamps if needed
  const logsWithTimestamps: LogEntry[] = logs.map(log => {
    if (typeof log === 'string') {
      // Try to detect log type from message content
      let type: LogEntry['type'] = 'info';
      if (log.toLowerCase().includes('error') || log.includes('❌')) type = 'error';
      else if (log.toLowerCase().includes('success') || log.includes('✅')) type = 'success';
      else if (log.toLowerCase().includes('warn') || log.includes('⚠️')) type = 'warning';
      
      return {
        message: log,
        timestamp: new Date().toLocaleTimeString(),
        type
      };
    }
    return log;
  });

  const filteredLogs = logsWithTimestamps.filter(log =>
    log.message.toLowerCase().includes(filter.toLowerCase())
  );

  const getLogIcon = (type?: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      default:
        return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  const getLogTextColor = (type?: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-700';
      case 'success':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <span className="text-xs text-gray-500">{filteredLogs.length} entries</span>
      </div>
      
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
          <div key={i} className="pb-1 flex items-start gap-2 hover:bg-gray-100 px-1 py-0.5 rounded">
            <span className="text-gray-400 flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3" />
              {log.timestamp}
            </span>
            <span className="flex items-center gap-1">
              {getLogIcon(log.type)}
            </span>
            <span className={`flex-1 break-words ${getLogTextColor(log.type)}`}>
              {log.message}
            </span>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-gray-400 text-center py-4">
            {logs.length === 0 ? 'No logs available' : 'No matching logs found'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugLog;
