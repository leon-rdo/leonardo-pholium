import type { DjangoListResponse } from "~/types/api";
import type { Post, Category, Comment } from "~/types/blog";

export const useBlog = () => {
  const config = useRuntimeConfig();
  const { locale } = useI18n();

  const apiLocale = computed(() =>
    locale.value === "pt-br" ? "pt-br" : "en-us"
  );

  /**
   * Fetch posts with optional filters
   */
  const fetchPosts = async (params?: Record<string, any>) => {
    return await $fetch<DjangoListResponse<Post>>("/api/posts/", {
      baseURL: config.public.apiBase,
      params: {
        expand: "category,tags",
        ...params,
      },
      headers: {
        "Accept-Language": apiLocale.value,
      },
    });
  };

  /**
   * Fetch a single post by slug
   */
  const fetchPostBySlug = async (slug: string) => {
    const response = await $fetch<DjangoListResponse<Post>>("/api/posts/", {
      baseURL: config.public.apiBase,
      params: {
        slug,
        expand: "category,series,tags",
      },
      headers: {
        "Accept-Language": apiLocale.value,
      },
    });

    return response.results?.[0] || null;
  };

  /**
   * Fetch published posts
   */
  const fetchPublishedPosts = async (params?: Record<string, any>) => {
    return await $fetch<DjangoListResponse<Post>>("/api/posts/published/", {
      baseURL: config.public.apiBase,
      params: {
        expand: "category,tags",
        ordering: "-is_pinned,-published_at",
        ...params,
      },
      headers: {
        "Accept-Language": apiLocale.value,
      },
    });
  };

  /**
   * Fetch categories
   */
  const fetchCategories = async (params?: Record<string, any>) => {
    return await $fetch<DjangoListResponse<Category>>("/api/post-categories/", {
      baseURL: config.public.apiBase,
      params: {
        is_active: true,
        ordering: "order",
        ...params,
      },
      headers: {
        "Accept-Language": apiLocale.value,
      },
    });
  };

  /**
   * Fetch comments for a post
   */
  const fetchComments = async (postId: number) => {
    return await $fetch<DjangoListResponse<Comment>>("/api/comments/", {
      baseURL: config.public.apiBase,
      params: {
        post: postId,
        ordering: "created_at",
      },
      headers: {
        "Accept-Language": apiLocale.value,
      },
    });
  };

  /**
   * Submit a comment
   */
  const submitComment = async (data: {
    post: number;
    parent?: number | null;
    content: string;
    guest_name?: string;
    guest_email?: string;
    guest_website?: string;
  }) => {
    return await $fetch("/api/comments/", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: data,
      headers: {
        "Accept-Language": apiLocale.value,
        // Add authorization header if needed
      },
    });
  };

  /**
   * Toggle reaction
   */
  const toggleReaction = async (postId: number, reactionType: string) => {
    return await $fetch("/api/post-reactions/toggle/", {
      baseURL: config.public.apiBase,
      method: "POST",
      body: {
        post: postId,
        reaction: reactionType,
      },
      headers: {
        "Accept-Language": apiLocale.value,
        // Add authorization header if needed
      },
    });
  };

  /**
   * Get reaction summary
   */
  const fetchReactionSummary = async (postId: number) => {
    return await $fetch(`/api/post-reactions/summary/${postId}/`, {
      baseURL: config.public.apiBase,
      headers: {
        "Accept-Language": apiLocale.value,
      },
    });
  };

  /**
   * Get category name from category object or ID
   */
  const getCategoryName = (
    category: number | Category | null,
    categories?: Category[]
  ) => {
    if (!category) return "";
    if (typeof category === "object") return category.name;
    if (categories) {
      const cat = categories.find((c) => c.id === category);
      return cat?.name || "";
    }
    return "";
  };

  /**
   * Calculate reading time from content
   */
  const calculateReadingTime = (content: string, wordsPerMinute = 200) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.round(words / wordsPerMinute));
  };

  return {
    fetchPosts,
    fetchPostBySlug,
    fetchPublishedPosts,
    fetchCategories,
    fetchComments,
    submitComment,
    toggleReaction,
    fetchReactionSummary,
    getCategoryName,
    calculateReadingTime,
  };
};
