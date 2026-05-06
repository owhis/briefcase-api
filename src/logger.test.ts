import { createLogger, noopLogger, LogEntry } from './logger';
import { buildLoggerOptions, getLoggerPreset, validateLoggerOptions } from './logger.config';

describe('createLogger', () => {
  it('calls handler with correct entry shape', () => {
    const entries: LogEntry[] = [];
    const logger = createLogger({ level: 'debug', handler: (e) => entries.push(e) });
    logger.info('hello', { key: 'val' });
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe('info');
    expect(entries[0].message).toContain('hello');
    expect(entries[0].context).toEqual({ key: 'val' });
    expect(entries[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('suppresses messages below configured level', () => {
    const entries: LogEntry[] = [];
    const logger = createLogger({ level: 'warn', handler: (e) => entries.push(e) });
    logger.debug('ignored');
    logger.info('also ignored');
    logger.warn('captured');
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe('warn');
  });

  it('prepends prefix to message', () => {
    const entries: LogEntry[] = [];
    const logger = createLogger({ level: 'debug', prefix: 'myapp', handler: (e) => entries.push(e) });
    logger.error('boom');
    expect(entries[0].message).toBe('[myapp] boom');
  });

  it('silent level suppresses all messages', () => {
    const entries: LogEntry[] = [];
    const logger = createLogger({ level: 'silent', handler: (e) => entries.push(e) });
    logger.debug('a'); logger.info('b'); logger.warn('c'); logger.error('d');
    expect(entries).toHaveLength(0);
  });
});

describe('noopLogger', () => {
  it('does not throw on any method', () => {
    expect(() => noopLogger.debug('x')).not.toThrow();
    expect(() => noopLogger.info('x')).not.toThrow();
    expect(() => noopLogger.warn('x')).not.toThrow();
    expect(() => noopLogger.error('x')).not.toThrow();
  });
});

describe('getLoggerPreset', () => {
  it('returns known presets', () => {
    expect(getLoggerPreset('development').level).toBe('debug');
    expect(getLoggerPreset('production').level).toBe('warn');
    expect(getLoggerPreset('test').level).toBe('silent');
  });

  it('throws for unknown preset', () => {
    expect(() => getLoggerPreset('unknown')).toThrow('Unknown logger preset');
  });
});

describe('buildLoggerOptions', () => {
  it('merges preset with overrides', () => {
    const opts = buildLoggerOptions({ prefix: 'custom' }, 'production');
    expect(opts.level).toBe('warn');
    expect(opts.prefix).toBe('custom');
  });

  it('uses default when no preset given', () => {
    const opts = buildLoggerOptions();
    expect(opts.level).toBe('info');
  });
});

describe('validateLoggerOptions', () => {
  it('throws for invalid level', () => {
    expect(() => validateLoggerOptions({ level: 'verbose' as any })).toThrow('Invalid log level');
  });

  it('throws for non-function handler', () => {
    expect(() => validateLoggerOptions({ handler: 'bad' as any })).toThrow('handler must be a function');
  });

  it('passes for valid options', () => {
    expect(() => validateLoggerOptions({ level: 'debug', prefix: 'app' })).not.toThrow();
  });
});
