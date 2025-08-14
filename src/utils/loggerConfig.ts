import { logger } from './logger';

/**
 * Logger configuration utilities for the application
 */
export class LoggerConfig {
  /**
   * Set global log level for the application
   */
  static setLevel(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') {
    logger.setLevel(level);
  }

  /**
   * Get current log level
   */
  static getLevel() {
    return logger.getLevel();
  }

  /**
   * Enable verbose logging (DEBUG level)
   */
  static enableVerbose() {
    logger.setLevel('DEBUG');
  }

  /**
   * Enable production logging (WARN level)
   */
  static enableProduction() {
    logger.setLevel('WARN');
  }

  /**
   * Check if we're in development mode
   */
  static isDevelopment() {
    return import.meta.env.DEV;
  }
}

// Auto-configure based on environment
if (import.meta.env.PROD) {
  LoggerConfig.enableProduction();
} else {
  LoggerConfig.enableVerbose();
}