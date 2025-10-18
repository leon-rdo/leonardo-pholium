import type { ContentBlock, DjangoListResponse } from "~/types/api";

export const useContentBlocks = (page: string) => {
  return useApi<DjangoListResponse<ContentBlock>>("/api/content-blocks/", {
    key: `content-${page}`,
    params: { page_name__istartswith: page },
  });
};
