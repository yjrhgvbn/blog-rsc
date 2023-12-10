type Response<T> = { data: T; sucess: true } | { error: any; sucess: false };
type WrapResponse<T extends (...args: any) => any> = (...args: Parameters<T>) => Promise<Response<Awaited<ReturnType<T>>>>;

export function wrapResponse<T extends (...args: any) => any>(fn: T): WrapResponse<T> {
  const wrapped = async (...args: Parameters<T>) => {
    try {
      const res = await fn(...args);
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
