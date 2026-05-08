<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  maxVisiblePages?: number;
}>();

const emit = defineEmits<{
  'page-change': [page: number];
}>();

const maxVisible = computed(() => props.maxVisiblePages || 7);

// Build the visible window of page numbers, with ellipses where the
// page list would otherwise grow unbounded.
const visiblePages = computed<(number | '…')[]>(() => {
  const pages: (number | '…')[] = [];
  const total = props.totalPages;
  const current = props.currentPage;
  const max = maxVisible.value;

  if (total <= max) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  let start = Math.max(2, current - Math.floor(max / 2) + 1);
  let end = Math.min(total - 1, start + max - 3);
  if (end === total - 1) start = Math.max(2, end - max + 3);
  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page);
  }
};
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-center gap-1.5 py-10 flex-wrap"
    :aria-label="$t('common.page')"
  >
    <button
      type="button"
      class="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-input ring-hair bg-card text-ink-2 text-[14px] font-medium transition-colors hover:text-accent hover:ring-1 hover:ring-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-ink-2 disabled:hover:ring-0"
      :disabled="!hasPrevious"
      :aria-label="$t('common.previousPage')"
      @click="goToPage(currentPage - 1)"
    >
      <ChevronLeft :size="18" :stroke-width="2" />
    </button>

    <template v-for="(page, index) in visiblePages" :key="`page-${index}`">
      <button
        v-if="typeof page === 'number'"
        type="button"
        class="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-input text-[14px] font-medium transition-colors"
        :class="
          page === currentPage
            ? 'bg-accent text-paper cursor-default'
            : 'ring-hair bg-card text-ink-2 hover:text-accent hover:ring-1 hover:ring-accent'
        "
        :aria-label="`${$t('common.page')} ${page}`"
        :aria-current="page === currentPage ? 'page' : undefined"
        @click="goToPage(page as number)"
      >
        {{ page }}
      </button>
      <span
        v-else
        class="inline-flex items-center justify-center min-w-[40px] h-10 text-ink-3 select-none"
        aria-hidden="true"
      >
        {{ page }}
      </span>
    </template>

    <button
      type="button"
      class="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-input ring-hair bg-card text-ink-2 text-[14px] font-medium transition-colors hover:text-accent hover:ring-1 hover:ring-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-ink-2 disabled:hover:ring-0"
      :disabled="!hasNext"
      :aria-label="$t('common.nextPage')"
      @click="goToPage(currentPage + 1)"
    >
      <ChevronRight :size="18" :stroke-width="2" />
    </button>
  </nav>
</template>
