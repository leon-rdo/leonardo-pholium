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
    return await $fetch<DjangoListResponse<Post>>("/api/blog/posts/", {
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
    const response = await $fetch<DjangoListResponse<Post>>(
      "/api/blog/posts/",
      {
        baseURL: config.public.apiBase,
        params: {
          slug,
          expand: "category,series,tags",
        },
        headers: {
          "Accept-Language": apiLocale.value,
        },
      }
    );

    return response.results?.[0] || null;
  };

  /**
   * Fetch published posts
   */
  const fetchPublishedPosts = async (params?: Record<string, any>) => {
    return await $fetch<DjangoListResponse<Post>>(
      "/api/blog/posts/published/",
      {
        baseURL: config.public.apiBase,
        params: {
          expand: "category,tags",
          ordering: "-is_pinned,-published_at",
          ...params,
        },
        headers: {
          "Accept-Language": apiLocale.value,
        },
      }
    );
  };

  /**
   * Fetch categories
   */
  const fetchCategories = async (params?: Record<string, any>) => {
    return await $fetch<DjangoListResponse<Category>>(
      "/api/blog/post-categories/",
      {
        baseURL: config.public.apiBase,
        params: {
          is_active: true,
          ordering: "order",
          ...params,
        },
        headers: {
          "Accept-Language": apiLocale.value,
        },
      }
    );
  };

  /**
   * Fetch comments for a post
   */
  const fetchComments = async (postId: number) => {
    return await $fetch<DjangoListResponse<Comment>>("/api/blog/comments/", {
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
    return await $fetch("/api/blog/comments/", {
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
    return await $fetch("/api/blog/post-reactions/toggle/", {
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
    return await $fetch(`/api/blog/post-reactions/summary/${postId}/`, {
      baseURL: config.public.apiBase,
      headers: {
        "Accept-Language": apiLocale.value,
      },
    });
  };

  /**
   * Format date helper
   */
  const formatDate = (
    date: string | null,
    options?: Intl.DateTimeFormatOptions
  ) => {
    if (!date) return "";

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return new Date(date).toLocaleDateString(
      locale.value === "pt-br" ? "pt-BR" : "en-US",
      options || defaultOptions
    );
  };

  /**
   * Format relative time (e.g., "2 days ago")
   */
  const formatRelativeTime = (date: string) => {
    const commentDate = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - commentDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) return "agora mesmo";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} h atrás`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} dias atrás`;

    return formatDate(date, { month: "short", day: "numeric" });
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
    formatDate,
    formatRelativeTime,
    getCategoryName,
    calculateReadingTime,
  };
};
