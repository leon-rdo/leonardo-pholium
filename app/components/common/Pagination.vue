<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import type { LocationQueryRaw } from 'vue-router';

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

const route = useRoute();

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

// Real hrefs (page 1 drops the param) so crawlers can follow pagination —
// buttons here would make every page past 1 undiscoverable outside the
// sitemap. Click still emits so parents keep their scroll behavior.
const linkFor = (page: number) => {
  const query: LocationQueryRaw = { ...route.query };
  if (page === 1) delete query.page;
  else query.page = String(page);
  return { query };
};

const onNavigate = (page: number) => {
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
    <NuxtLink
      v-if="hasPrevious"
      :to="linkFor(currentPage - 1)"
      class="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-input ring-hair bg-card text-ink-2 text-[14px] font-medium transition-colors hover:text-accent hover:ring-1 hover:ring-accent"
      :aria-label="$t('common.previousPage')"
      @click="onNavigate(currentPage - 1)"
    >
      <ChevronLeft :size="18" :stroke-width="2" />
    </NuxtLink>
    <span
      v-else
      class="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-input ring-hair bg-card text-ink-2 text-[14px] font-medium opacity-40 cursor-not-allowed"
      :aria-label="$t('common.previousPage')"
      aria-disabled="true"
    >
      <ChevronLeft :size="18" :stroke-width="2" />
    </span>

    <template v-for="(page, index) in visiblePages" :key="`page-${index}`">
      <NuxtLink
        v-if="typeof page === 'number' && page !== currentPage"
        :to="linkFor(page)"
        class="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-input text-[14px] font-medium transition-colors ring-hair bg-card text-ink-2 hover:text-accent hover:ring-1 hover:ring-accent"
        :aria-label="`${$t('common.page')} ${page}`"
        @click="onNavigate(page)"
      >
        {{ page }}
      </NuxtLink>
      <span
        v-else-if="typeof page === 'number'"
        class="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-input text-[14px] font-medium bg-accent text-night-text cursor-default"
        :aria-label="`${$t('common.page')} ${page}`"
        aria-current="page"
      >
        {{ page }}
      </span>
      <span
        v-else
        class="inline-flex items-center justify-center min-w-[40px] h-10 text-ink-3 select-none"
        aria-hidden="true"
      >
        {{ page }}
      </span>
    </template>

    <NuxtLink
      v-if="hasNext"
      :to="linkFor(currentPage + 1)"
      class="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-input ring-hair bg-card text-ink-2 text-[14px] font-medium transition-colors hover:text-accent hover:ring-1 hover:ring-accent"
      :aria-label="$t('common.nextPage')"
      @click="onNavigate(currentPage + 1)"
    >
      <ChevronRight :size="18" :stroke-width="2" />
    </NuxtLink>
    <span
      v-else
      class="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-input ring-hair bg-card text-ink-2 text-[14px] font-medium opacity-40 cursor-not-allowed"
      :aria-label="$t('common.nextPage')"
      aria-disabled="true"
    >
      <ChevronRight :size="18" :stroke-width="2" />
    </span>
  </nav>
</template>
