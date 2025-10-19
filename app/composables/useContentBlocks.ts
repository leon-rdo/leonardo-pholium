import type { DjangoListResponse } from "~/types/api";
import type { ContentBlock } from "~/types/content";

export const useContentBlocks = (page: string) => {
  return useApi<DjangoListResponse<ContentBlock>>("/api/content-blocks/", {
    key: `content-${page}`,
    params: { page_name__istartswith: page },
  });
};
