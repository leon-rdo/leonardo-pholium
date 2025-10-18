import type { UseFetchOptions } from "nuxt/app";

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

  const mergedOptions: any = {
    ...options,
    baseURL: config.public.apiBase,
    headers: mergedHeaders,
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
    return response;
  });
};
