import { describe, it, expect, vi } from 'vitest';
import {
  createPipeline,
  composeMiddleware,
  Middleware,
  MiddlewareContext,
} from './middleware';
import {
  buildMiddlewareOptions,
  createTimeoutMiddleware,
  createLoggingMiddleware,
  validateMiddlewareOptions,
  getMiddlewarePreset,
} from './middleware.config';

const makeCtx = (url = 'https://api.example.com/items'): MiddlewareContext => ({
  url,
  options: {},
  attempt: 1,
  startedAt: Date.now(),
});

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

describe('createPipeline', () => {
  it('executes handler when stack is empty', async () => {
    const pipeline = createPipeline();
    const handler = vi.fn().mockResolvedValue(okResponse());
    await pipeline.execute(makeCtx(), handler);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('runs middleware in order', async () => {
    const order: number[] = [];
    const m1: Middleware = (ctx, next) => { order.push(1); return next(ctx); };
    const m2: Middleware = (ctx, next) => { order.push(2); return next(ctx); };
    const pipeline = createPipeline([m1, m2]);
    await pipeline.execute(makeCtx(), () => Promise.resolve(okResponse()));
    expect(order).toEqual([1, 2]);
  });

  it('allows middleware to short-circuit', async () => {
    const handler = vi.fn();
    const blocker: Middleware = () => Promise.resolve(new Response(null, { status: 403 }));
    const pipeline = createPipeline([blocker]);
    await pipeline.execute(makeCtx(), handler);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('composeMiddleware', () => {
  it('composes multiple middleware into one', async () => {
    const calls: string[] = [];
    const a: Middleware = (ctx, next) => { calls.push('a'); return next(ctx); };
    const b: Middleware = (ctx, next) => { calls.push('b'); return next(ctx); };
    const composed = composeMiddleware(a, b);
    await composed(makeCtx(), () => Promise.resolve(okResponse()));
    expect(calls).toEqual(['a', 'b']);
  });
});

describe('buildMiddlewareOptions', () => {
  it('applies preset defaults', () => {
    const opts = buildMiddlewareOptions({}, 'strict');
    expect(opts.timeout).toBe(5000);
  });

  it('overrides preset with provided values', () => {
    const opts = buildMiddlewareOptions({ timeout: 3000 }, 'default');
    expect(opts.timeout).toBe(3000);
  });
});

describe('validateMiddlewareOptions', () => {
  it('throws for non-positive timeout', () => {
    expect(() => validateMiddlewareOptions({ timeout: 0 })).toThrow(RangeError);
  });

  it('passes for valid options', () => {
    expect(() => validateMiddlewareOptions({ timeout: 5000 })).not.toThrow();
  });
});

describe('createLoggingMiddleware', () => {
  it('calls onBefore and onAfter hooks', async () => {
    const onBefore = vi.fn();
    const onAfter = vi.fn();
    const mw = createLoggingMiddleware(onBefore, onAfter);
    const ctx = makeCtx();
    await mw(ctx, () => Promise.resolve(okResponse()));
    expect(onBefore).toHaveBeenCalledWith(ctx);
    expect(onAfter).toHaveBeenCalledWith(ctx, expect.any(Response));
  });
});
