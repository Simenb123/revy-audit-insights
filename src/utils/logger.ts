const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'info';

function sanitizeArg(arg: unknown): unknown {
  if (Array.isArray(arg)) {
    return arg.map((a) => sanitizeArg(a));
  }
  if (arg && typeof arg === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(arg as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (lower.includes('password') || lower.includes('token')) {
        result[key] = '[REDACTED]';
      } else if (lower === 'userid' || lower === 'id') {
        if (typeof value === 'string') {
          result[key] = value.slice(0, 6) + '...';
        } else {
          result[key] = '[REDACTED]';
        }
      } else {
        result[key] = sanitizeArg(value);
      }
    }
    return result;
  }
  if (typeof arg === 'string') {
    return arg.replace(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi, (m) => m.slice(0,6) + '...');
  }
  return arg;
}

function output(method: 'log' | 'warn' | 'error', args: unknown[]) {
  const sanitized = args.map(sanitizeArg);
  if (method === 'log') {
    if (['debug', 'info'].includes(LOG_LEVEL)) {
      console.log(...sanitized);
    }
  } else if (method === 'warn') {
    if (['debug', 'info', 'warn'].includes(LOG_LEVEL)) {
      console.warn(...sanitized);
    }
  } else if (method === 'error') {
    console.error(...sanitized);
  }
}

export const log = (...args: unknown[]) => output('log', args);
export const warn = (...args: unknown[]) => output('warn', args);
export const error = (...args: unknown[]) => output('error', args);
