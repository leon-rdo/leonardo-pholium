import type { ContentBlock, DjangoListResponse } from "~/types/api";

export const useContentBlocks = (page: string) => {
  const config = useRuntimeConfig();

  return useFetch<DjangoListResponse<ContentBlock>>(
    `${config.public.apiBase}/api/content-blocks/`,
    {
      key: `content-${page}`,
      params: { page_name__istartswith: page },
      headers: {
        "Accept-Language": "en-US",
      },
    }
  );
};
