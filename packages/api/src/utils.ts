type Response<T> = { data: T; sucess: true } | { error: any; sucess: false };
type WrapResponse<T extends (...args: any) => any> = (...args: Parameters<T>) => Promise<Response<Awaited<ReturnType<T>>>>;

export function wrapResponse<T extends (...args: any) => any>(fn: T): WrapResponse<T> {
  const wrappedCacheFn = withCache(fn);
  const wrapped = async (...args: Parameters<T>) => {
    try {
      const res = await wrappedCacheFn(...(args as any));
      return {
        data: res,
        sucess: true as const,
      };
    } catch (e) {
      return {
        error: (e as any)?.message ?? "Unknown error",
        sucess: false as const,
      };
    }
  };
  return wrapped;
}

function withCache<T extends (...args: any) => any>(fn: T) {
  const cache = new Map<string, any>();
  const wrapped = async (...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const cached = await cache.get(key);
    if (cached) {
      return cached;
    }
    const res = await fn(...(args as any));
    cache.set(key, res);
    return res;
  };
  return wrapped;
}
