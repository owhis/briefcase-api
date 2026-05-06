import { describe, it, expect, vi } from 'vitest';
import { createPipeline, MiddlewareContext } from './middleware';
import { createTimeoutMiddleware, createLoggingMiddleware } from './middleware.config';

const makeCtx = (url = 'https://api.example.com/data'): MiddlewareContext => ({
  url,
  options: {},
  attempt: 1,
  startedAt: Date.now(),
});

describe('middleware integration', () => {
  it('logging + timeout middleware execute in order', async () => {
    const log: string[] = [];
    const onBefore = () => log.push('before');
    const onAfter = () => log.push('after');

    const pipeline = createPipeline([
      createLoggingMiddleware(onBefore, onAfter),
      createTimeoutMiddleware(5000),
    ]);

    const handler = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const res = await pipeline.execute(makeCtx(), handler);

    expect(res.status).toBe(200);
    expect(log).toEqual(['before', 'after']);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('timeout middleware aborts slow requests', async () => {
    const pipeline = createPipeline([createTimeoutMiddleware(50)]);

    const slowHandler = (_ctx: MiddlewareContext) =>
      new Promise<Response>((resolve) => setTimeout(() => resolve(new Response()), 500));

    await expect(pipeline.execute(makeCtx(), slowHandler)).rejects.toThrow();
  });

  it('pipeline.use returns the pipeline for chaining', () => {
    const pipeline = createPipeline();
    const result = pipeline.use(createLoggingMiddleware());
    expect(result).toBe(pipeline);
  });

  it('context is passed through unmodified by default', async () => {
    const received: MiddlewareContext[] = [];
    const pipeline = createPipeline([
      (ctx, next) => { received.push(ctx); return next(ctx); },
    ]);
    const ctx = makeCtx();
    await pipeline.execute(ctx, () => Promise.resolve(new Response()));
    expect(received[0]).toBe(ctx);
  });
});
