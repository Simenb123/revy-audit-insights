const LOG_LEVEL = Deno.env.get('LOG_LEVEL') || 'info';

interface LogObject {
  message: string;
  sessionId?: string;
  [key: string]: unknown;
}

function output(level: 'debug' | 'info' | 'warn' | 'error', arg: unknown) {
  if (
    (level === 'debug' && LOG_LEVEL !== 'debug') ||
    (level === 'info' && !['debug', 'info'].includes(LOG_LEVEL)) ||
    (level === 'warn' && !['debug', 'info', 'warn'].includes(LOG_LEVEL))
  ) {
    return;
  }

  const entry: LogObject =
    typeof arg === 'object' && arg && 'message' in arg
      ? { level, ...(arg as LogObject) }
      : { level, message: String(arg) };

  const json = JSON.stringify(entry);

  switch (level) {
    case 'debug':
      console.debug(json);
      break;
    case 'warn':
      console.warn(json);
      break;
    case 'error':
      console.error(json);
      break;
    default:
      console.log(json);
  }
}

export function log(arg: string | LogObject) {
  output('info', arg);
}

export function debug(arg: string | LogObject) {
  output('debug', arg);
}

export function warn(arg: string | LogObject) {
  output('warn', arg);
}

export function error(arg: string | LogObject) {
  output('error', arg);
}
