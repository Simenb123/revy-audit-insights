
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LoggerConfig {
  level: LogLevel;
  isDevelopment: boolean;
}

class Logger {
  private config: LoggerConfig;
  private levels: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };

  constructor() {
    this.config = {
      level: import.meta.env.DEV ? 'DEBUG' : 'WARN',
      isDevelopment: import.meta.env.DEV
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.config.level];
  }

  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    if (!this.config.isDevelopment) {
      // In production, simplify messages and remove emoji/decorative elements
      return args.map(arg => 
        typeof arg === 'string' ? arg.replace(/[🔍✅❌🔄⚠️]/g, '').trim() : arg
      );
    }
    return args;
  }

  debug(...args: any[]) {
    if (this.shouldLog('DEBUG')) {
      console.log(...this.formatMessage('DEBUG', ...args));
    }
  }

  log(...args: any[]) {
    if (this.shouldLog('INFO')) {
      console.log(...this.formatMessage('INFO', ...args));
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('INFO')) {
      console.info(...this.formatMessage('INFO', ...args));
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('WARN')) {
      console.warn(...this.formatMessage('WARN', ...args));
    }
  }

  error(...args: any[]) {
    if (this.shouldLog('ERROR')) {
      console.error(...this.formatMessage('ERROR', ...args));
    }
  }

  // Method to change log level dynamically
  setLevel(level: LogLevel) {
    this.config.level = level;
  }

  // Method to check current level
  getLevel(): LogLevel {
    return this.config.level;
  }
}

export const logger = new Logger();
