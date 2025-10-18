// app/composables/useApiPaginated.ts
import type { DjangoListResponse } from "~/types/api";

/**
 * Helper para buscar todos os resultados paginados de uma API Django
 * @param key - Chave única para cache do useAsyncData
 * @param initialUrl - URL inicial da API (sem baseURL)
 * @param params - Parâmetros da query string
 * @returns AsyncData com todos os resultados consolidados
 */
export const useApiPaginated = async <T>(
  key: string,
  initialUrl: string,
  params?: Record<string, any>
) => {
  const config = useRuntimeConfig();
  const { locale } = useI18n();

  const localeMap: Record<string, string> = {
    "pt-br": "pt-br",
    "en-us": "en-us",
  };

  const apiLocale = localeMap[unref(locale)] || "en-us";

  return useAsyncData(
    key,
    async () => {
      let url: string | null = initialUrl;
      const allResults: T[] = [];

      while (url) {
        const response: DjangoListResponse<T> = await $fetch(url, {
          baseURL: url.startsWith("http") ? undefined : config.public.apiBase,
          params: url.startsWith("http") ? undefined : params,
          headers: { "Accept-Language": apiLocale },
        });

        if (response && response.results) {
          allResults.push(...response.results);
          url = response.next;
        } else {
          url = null;
        }
      }

      return {
        count: allResults.length,
        results: allResults,
        next: null,
        previous: null,
      } as DjangoListResponse<T>;
    },
    {
      default: () =>
        ({
          count: 0,
          results: [] as T[],
          next: null,
          previous: null,
        } as DjangoListResponse<T>),
    }
  );
};

// Exemplo de uso:
// const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
//   'home-content-blocks',
//   '/api/content-blocks/',
//   { page_name: 'home' }
// );
