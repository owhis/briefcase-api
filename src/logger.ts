export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  handler?: (entry: LogEntry) => void;
}

function defaultHandler(entry: LogEntry): void {
  const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`];
  if (entry.context) {
    console[entry.level === 'debug' ? 'debug' : entry.level](
      parts.join(' '),
      entry.message,
      entry.context
    );
  } else {
    console[entry.level === 'debug' ? 'debug' : entry.level](
      parts.join(' '),
      entry.message
    );
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const { level = 'info', prefix = 'briefcase', handler = defaultHandler } = options;
  const minLevel = LOG_LEVELS[level];

  function log(entryLevel: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVELS[entryLevel] < minLevel) return;
    handler({
      level: entryLevel,
      message: prefix ? `[${prefix}] ${message}` : message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  return {
    debug: (msg, ctx) => log('debug', msg, ctx),
    info: (msg, ctx) => log('info', msg, ctx),
    warn: (msg, ctx) => log('warn', msg, ctx),
    error: (msg, ctx) => log('error', msg, ctx),
  };
}

export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};
