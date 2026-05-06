import { RequestOptions } from './request';
import { RetryOptions } from './retry.config';
import { ThrottleOptions } from './throttle.config';
import { DedupOptions } from './dedup.config';
import { LoggerOptions } from './logger.config';

export type MiddlewareContext = {
  url: string;
  options: RequestOptions;
  attempt: number;
  startedAt: number;
};

export type MiddlewareNext = (ctx: MiddlewareContext) => Promise<Response>;

export type Middleware = (
  ctx: MiddlewareContext,
  next: MiddlewareNext
) => Promise<Response>;

export type MiddlewarePipeline = {
  use: (middleware: Middleware) => MiddlewarePipeline;
  execute: (ctx: MiddlewareContext, handler: MiddlewareNext) => Promise<Response>;
};

export function createPipeline(initial: Middleware[] = []): MiddlewarePipeline {
  const stack: Middleware[] = [...initial];

  const pipeline: MiddlewarePipeline = {
    use(middleware: Middleware): MiddlewarePipeline {
      stack.push(middleware);
      return pipeline;
    },

    async execute(ctx: MiddlewareContext, handler: MiddlewareNext): Promise<Response> {
      let index = 0;

      const dispatch = (i: number): MiddlewareNext => {
        if (i >= stack.length) return handler;
        const fn = stack[i];
        return (c) => fn(c, dispatch(i + 1));
      };

      return dispatch(0)(ctx);
    },
  };

  return pipeline;
}

export function composeMiddleware(...fns: Middleware[]): Middleware {
  return (ctx, next) => {
    const combined = createPipeline(fns);
    return combined.execute(ctx, next);
  };
}
