import type { Ref } from "vue";
import type { LocationQuery } from "vue-router";

interface PaginationOptions {
  defaultLimit?: number;
  scrollToTop?: boolean;
  scrollOffset?: number;
}

interface PaginationState {
  currentPage: Ref<number>;
  limit: Ref<number>;
  totalPages: Ref<number>;
  totalItems: Ref<number>;
  hasNext: Ref<boolean>;
  hasPrevious: Ref<boolean>;
}

interface PaginationMethods {
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setTotalItems: (count: number) => void;
  reset: () => void;
}

export const usePagination = (
  options: PaginationOptions = {}
): PaginationState & PaginationMethods => {
  const route = useRoute();
  const router = useRouter();

  const { defaultLimit = 12, scrollToTop = true, scrollOffset = 0 } = options;

  // State
  const currentPage = ref(1);
  const limit = ref(defaultLimit);
  const totalItems = ref(0);

  // Computed
  const totalPages = computed(() => Math.ceil(totalItems.value / limit.value));

  const hasNext = computed(() => currentPage.value < totalPages.value);

  const hasPrevious = computed(() => currentPage.value > 1);

  // Initialize from URL query params
  const initializeFromQuery = () => {
    const pageParam = route.query.page;
    if (pageParam && typeof pageParam === "string") {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        currentPage.value = page;
      }
    }

    const limitParam = route.query.limit;
    if (limitParam && typeof limitParam === "string") {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit.value = parsedLimit;
      }
    }
  };

  // Update URL with current page
  const updateUrl = (page: number) => {
    const query: LocationQuery = { ...route.query };

    if (page === 1) {
      delete query.page;
    } else {
      query.page = page.toString();
    }

    router.push({ query });
  };

  // Scroll to top of page
  const scrollToTopOfPage = () => {
    if (scrollToTop && import.meta.client) {
      window.scrollTo({
        top: scrollOffset,
        behavior: "smooth",
      });
    }
  };

  // Methods
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) return;

    currentPage.value = page;
    updateUrl(page);
    scrollToTopOfPage();
  };

  const nextPage = () => {
    if (hasNext.value) {
      goToPage(currentPage.value + 1);
    }
  };

  const previousPage = () => {
    if (hasPrevious.value) {
      goToPage(currentPage.value - 1);
    }
  };

  const setTotalItems = (count: number) => {
    totalItems.value = count;
  };

  const reset = () => {
    currentPage.value = 1;
    totalItems.value = 0;
    updateUrl(1);
  };

  // Initialize on mount
  onMounted(() => {
    initializeFromQuery();
  });

  // Watch for external query changes
  watch(
    () => route.query.page,
    (newPage) => {
      if (newPage && typeof newPage === "string") {
        const page = parseInt(newPage, 10);
        if (!isNaN(page) && page > 0 && page !== currentPage.value) {
          currentPage.value = page;
        }
      } else if (!newPage && currentPage.value !== 1) {
        currentPage.value = 1;
      }
    }
  );

  return {
    // State
    currentPage: readonly(currentPage),
    limit: readonly(limit),
    totalPages,
    totalItems: readonly(totalItems),
    hasNext,
    hasPrevious,

    // Methods
    goToPage,
    nextPage,
    previousPage,
    setTotalItems,
    reset,
  };
};
