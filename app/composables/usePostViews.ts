import { ref, onMounted, onUnmounted } from "vue";

interface ViewTrackingOptions {
  postId: number;
  minReadTime?: number;
  sessionKey?: string;
}

export const usePostViews = () => {
  const config = useRuntimeConfig();
  const isTracking = ref(false);
  const viewCounted = ref(false);
  const timeSpent = ref(0);

  let trackingInterval: NodeJS.Timeout | null = null;
  let visibilityTimeout: NodeJS.Timeout | null = null;

  const hasViewedInSession = (postId: number): boolean => {
    if (import.meta.client) {
      try {
        const viewedPosts = sessionStorage.getItem("viewed_posts");
        if (viewedPosts) {
          const posts = JSON.parse(viewedPosts) as number[];
          return posts.includes(postId);
        }
      } catch (error) {
        console.error("Error checking session views:", error);
      }
    }
    return false;
  };

  const markAsViewed = (postId: number): void => {
    if (import.meta.client) {
      try {
        const viewedPosts = sessionStorage.getItem("viewed_posts");
        const posts = viewedPosts ? JSON.parse(viewedPosts) : [];

        if (!posts.includes(postId)) {
          posts.push(postId);
          sessionStorage.setItem("viewed_posts", JSON.stringify(posts));
        }
      } catch (error) {
        console.error("Error marking post as viewed:", error);
      }
    }
  };

  const incrementView = async (postId: number): Promise<boolean> => {
    try {
      await $fetch(`/api/posts/${postId}/`, {
        baseURL: config.public.apiBase,
        method: "GET",
      });

      return true;
    } catch (error) {
      console.error("Error incrementing view:", error);
      return false;
    }
  };

  const startTracking = async (options: ViewTrackingOptions): Promise<void> => {
    const { postId, minReadTime = 3000 } = options;

    if (import.meta.client && !isTracking.value) {
      if (hasViewedInSession(postId)) {
        viewCounted.value = true;
        return;
      }

      isTracking.value = true;

      visibilityTimeout = setTimeout(async () => {
        if (!viewCounted.value) {
          const success = await incrementView(postId);

          if (success) {
            markAsViewed(postId);
            viewCounted.value = true;
            console.log(`View counted for post ${postId}`);
          }
        }
      }, minReadTime);

      trackingInterval = setInterval(() => {
        if (document.visibilityState === "visible") {
          timeSpent.value += 1000;
        }
      }, 1000);
    }
  };

  const stopTracking = (): void => {
    if (visibilityTimeout) {
      clearTimeout(visibilityTimeout);
      visibilityTimeout = null;
    }

    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }

    isTracking.value = false;
  };

  const resetTracking = (): void => {
    stopTracking();
    viewCounted.value = false;
    timeSpent.value = 0;
  };

  const clearSessionViews = (): void => {
    if (import.meta.client) {
      try {
        sessionStorage.removeItem("viewed_posts");
      } catch (error) {
        console.error("Error clearing session views:", error);
      }
    }
  };

  onUnmounted(() => {
    stopTracking();
  });

  return {
    isTracking,
    viewCounted,
    timeSpent,
    startTracking,
    stopTracking,
    resetTracking,
    hasViewedInSession,
    clearSessionViews,
  };
};

export const usePostViewTracking = (
  postId: Ref<number> | number,
  options?: Partial<ViewTrackingOptions>
) => {
  const { startTracking, viewCounted, timeSpent } = usePostViews();

  onMounted(() => {
    const id = typeof postId === "number" ? postId : postId.value;

    if (id) {
      startTracking({
        postId: id,
        minReadTime: options?.minReadTime || 3000,
        ...options,
      });
    }
  });

  return {
    viewCounted,
    timeSpent,
  };
};
