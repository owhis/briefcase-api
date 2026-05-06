import { Middleware, MiddlewareContext } from './middleware';

export type MiddlewarePreset = 'default' | 'strict' | 'minimal';

export type MiddlewareOptions = {
  timeout?: number;
  onBefore?: (ctx: MiddlewareContext) => void;
  onAfter?: (ctx: MiddlewareContext, res: Response) => void;
  onError?: (ctx: MiddlewareContext, err: unknown) => void;
};

const PRESETS: Record<MiddlewarePreset, MiddlewareOptions> = {
  default: { timeout: 10000 },
  strict: { timeout: 5000 },
  minimal: {},
};

export function getMiddlewarePreset(preset: MiddlewarePreset): MiddlewareOptions {
  return { ...PRESETS[preset] };
}

export function buildMiddlewareOptions(
  input: Partial<MiddlewareOptions> = {},
  preset: MiddlewarePreset = 'default'
): MiddlewareOptions {
  return { ...getMiddlewarePreset(preset), ...input };
}

export function validateMiddlewareOptions(opts: MiddlewareOptions): void {
  if (opts.timeout !== undefined && opts.timeout <= 0) {
    throw new RangeError('middleware timeout must be a positive number');
  }
}

export function createTimeoutMiddleware(ms: number): Middleware {
  return async (ctx, next) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const merged = {
        ...ctx,
        options: { ...ctx.options, signal: controller.signal },
      };
      return await next(merged);
    } finally {
      clearTimeout(timer);
    }
  };
}

export function createLoggingMiddleware(
  onBefore?: (ctx: MiddlewareContext) => void,
  onAfter?: (ctx: MiddlewareContext, res: Response) => void
): Middleware {
  return async (ctx, next) => {
    onBefore?.(ctx);
    const res = await next(ctx);
    onAfter?.(ctx, res);
    return res;
  };
}
