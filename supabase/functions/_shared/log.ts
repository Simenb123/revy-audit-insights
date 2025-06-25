const LOG_LEVEL = Deno.env.get('LOG_LEVEL') || 'info';

export function log(...args: unknown[]) {
  if (['debug', 'info'].includes(LOG_LEVEL)) {
    console.log(...args);
  }
}

export function debug(...args: unknown[]) {
  if (LOG_LEVEL === 'debug') {
    console.debug(...args);
  }
}

export function warn(...args: unknown[]) {
  if (['debug', 'info', 'warn'].includes(LOG_LEVEL)) {
    console.warn(...args);
  }
}

export function error(...args: unknown[]) {
  console.error(...args);
}
