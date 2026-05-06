import { TransformOptions, TransformFn } from "./transform";

export type TransformPreset = "passthrough" | "json" | "camel";

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelizeKeys<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(camelizeKeys) as unknown as T;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamelCase(k), camelizeKeys(v)])
    ) as T;
  }
  return obj;
}

export function getTransformPreset<TIn, TOut>(
  preset: TransformPreset
): TransformFn<TIn, TOut> {
  switch (preset) {
    case "passthrough":
      return (data: TIn) => data as unknown as TOut;
    case "json":
      return (data: TIn) =>
        JSON.parse(JSON.stringify(data)) as unknown as TOut;
    case "camel":
      return (data: TIn) => camelizeKeys(data) as unknown as TOut;
    default:
      throw new Error(`Unknown transform preset: ${preset}`);
  }
}

export function buildTransformOptions<TIn, TOut>(
  input: Partial<TransformOptions<TIn, TOut>> & { preset?: TransformPreset }
): TransformOptions<TIn, TOut> {
  const fn: TransformFn<TIn, TOut> = input.fn ??
    (input.preset
      ? getTransformPreset<TIn, TOut>(input.preset)
      : (data: TIn) => data as unknown as TOut);

  return {
    fn,
    ...(input.onError ? { onError: input.onError } : {}),
  };
}

export function validateTransformOptions<TIn, TOut>(
  options: Partial<TransformOptions<TIn, TOut>>
): void {
  if (options.fn !== undefined && typeof options.fn !== "function") {
    throw new Error("TransformOptions.fn must be a function");
  }
  if (options.onError !== undefined && typeof options.onError !== "function") {
    throw new Error("TransformOptions.onError must be a function");
  }
}
