export type TransformFn<TIn, TOut> = (data: TIn) => TOut | Promise<TOut>;

export interface TransformOptions<TIn, TOut> {
  fn: TransformFn<TIn, TOut>;
  onError?: (err: unknown, data: TIn) => TOut | never;
}

export function createTransform<TIn, TOut>(
  options: TransformOptions<TIn, TOut>
): (data: TIn) => Promise<TOut> {
  return async (data: TIn): Promise<TOut> => {
    try {
      return await options.fn(data);
    } catch (err) {
      if (options.onError) {
        return options.onError(err, data);
      }
      throw err;
    }
  };
}

export function composeTransforms<T>(
  ...fns: Array<TransformFn<T, T>>
): TransformFn<T, T> {
  return async (data: T): Promise<T> => {
    let result = data;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };
}

export function mapItems<TIn, TOut>(
  fn: TransformFn<TIn, TOut>
): TransformFn<TIn[], TOut[]> {
  return async (items: TIn[]): Promise<TOut[]> => {
    return Promise.all(items.map(fn));
  };
}

export function filterItems<T>(
  predicate: (item: T) => boolean | Promise<boolean>
): TransformFn<T[], T[]> {
  return async (items: T[]): Promise<T[]> => {
    const results = await Promise.all(items.map(predicate));
    return items.filter((_, i) => results[i]);
  };
}
