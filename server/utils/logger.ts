type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  userId?: number | string;
  requestId?: string;
  [key: string]: any;
}

export function log(
  level: LogLevel,
  message: string,
  context: LogContext = {}
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };

  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    const color = {
      DEBUG: '\x1b[36m',
      INFO: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m'
    }[level];

    console.log(`${color}[${level}]\x1b[0m ${message}`, context);
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log('DEBUG', msg, ctx),
  info: (msg: string, ctx?: LogContext) => log('INFO', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log('WARN', msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('ERROR', msg, ctx)
};
