import type { LogLevel, LoggerOptions } from './logger';

export interface LoggerPreset {
  level: LogLevel;
  prefix: string;
}

const PRESETS: Record<string, LoggerPreset> = {
  development: { level: 'debug', prefix: 'briefcase' },
  production: { level: 'warn', prefix: 'briefcase' },
  test: { level: 'silent', prefix: 'briefcase' },
  verbose: { level: 'debug', prefix: 'briefcase:verbose' },
};

export function getLoggerPreset(name: string): LoggerPreset {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown logger preset: "${name}". Available: ${Object.keys(PRESETS).join(', ')}`);
  }
  return preset;
}

export function buildLoggerOptions(
  overrides: Partial<LoggerOptions> = {},
  presetName?: string
): LoggerOptions {
  const base: LoggerOptions = presetName ? getLoggerPreset(presetName) : { level: 'info', prefix: 'briefcase' };
  return { ...base, ...overrides };
}

export function validateLoggerOptions(options: Partial<LoggerOptions>): void {
  const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'silent'];
  if (options.level !== undefined && !validLevels.includes(options.level)) {
    throw new Error(
      `Invalid log level: "${options.level}". Must be one of: ${validLevels.join(', ')}`
    );
  }
  if (options.prefix !== undefined && typeof options.prefix !== 'string') {
    throw new Error('Logger prefix must be a string');
  }
  if (options.handler !== undefined && typeof options.handler !== 'function') {
    throw new Error('Logger handler must be a function');
  }
}
