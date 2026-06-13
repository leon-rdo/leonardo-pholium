import type { UseFetchOptions } from "nuxt/app";

/**
 * Django REST list responses carry `next`/`previous` as ABSOLUTE backend
 * URLs (e.g. https://api.leonardocosta.dev/api/testimonials/?page=2). When a
 * response is stored in the Nuxt payload these URLs end up inside the inlined
 * `__NUXT_DATA__` script, where Googlebot discovers and crawls them — hitting
 * API endpoints that 403/404 and polluting Search Console coverage. The UI
 * never uses these fields (pagination derives from `count`), so we strip them
 * from every response before it reaches the payload. Nested objects (e.g. an
 * expanded relation that is itself a paginated list) are sanitized too.
 */
const stripPaginationUrls = <T>(data: T): T => {
  if (Array.isArray(data)) {
    data.forEach((item) => stripPaginationUrls(item));
    return data;
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.next === "string") obj.next = null;
    if (typeof obj.previous === "string") obj.previous = null;
    for (const value of Object.values(obj)) {
      if (value && typeof value === "object") stripPaginationUrls(value);
    }
  }
  return data;
};

export const useApi = <T>(url: string, options?: UseFetchOptions<T>) => {
  const config = useRuntimeConfig();
  const { locale } = useI18n();

  const localeMap: Record<string, string> = {
    "pt-br": "pt-br",
    "en-us": "en-us",
  };

  const apiLocale = localeMap[unref(locale)] || "en-us";

  const defaultHeaders: Record<string, string> = {
    "Accept-Language": apiLocale,
  };

  const customHeaders = options?.headers as Record<string, string> | undefined;
  const mergedHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...(customHeaders || {}),
  };

  const callerTransform = options?.transform as
    | ((input: T) => T | Promise<T>)
    | undefined;

  const mergedOptions: any = {
    ...options,
    baseURL: config.public.apiBase,
    headers: mergedHeaders,
    transform: async (input: T) => {
      const sanitized = stripPaginationUrls(input);
      return callerTransform ? await callerTransform(sanitized) : sanitized;
    },
  };

  return useFetch<T>(url, mergedOptions);
};

export const useApiData = async <T>(
  key: string,
  url: string,
  options?: any
) => {
  const config = useRuntimeConfig();
  const { locale } = useI18n();

  const localeMap: Record<string, string> = {
    "pt-br": "pt-br",
    "en-us": "en-us",
  };

  const apiLocale = localeMap[unref(locale)] || "en-us";

  return useAsyncData(key, async () => {
    const customHeaders = options?.headers as
      | Record<string, string>
      | undefined;
    const headers: Record<string, string> = {
      "Accept-Language": apiLocale,
      ...(customHeaders || {}),
    };

    const { headers: _headers, ...restOptions } = options || {};

    const response = await $fetch<T>(url, {
      baseURL: config.public.apiBase,
      headers,
      ...restOptions,
    });
    return stripPaginationUrls(response);
  });
};
