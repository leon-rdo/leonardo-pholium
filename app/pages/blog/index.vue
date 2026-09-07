<script setup lang="ts">
import { Search, FileSearch } from 'lucide-vue-next';
import type { DjangoListResponse } from '~/types/api';
import type { ContentBlock } from '~/types/content';
import type { Post, Category } from '~/types/blog';
import Breadcrumbs from '~/components/common/Breadcrumbs.vue';
import Pagination from '~/components/common/Pagination.vue';
import PostCard from '~/components/blog/PostCard.vue';
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs';


const localePath = useLocalePath();
const { locale, t } = useI18n();
const config = useRuntimeConfig();

const selectedCategory = ref<string>('all');
const searchQuery = ref('');

// Pagination
const pagination = usePagination({
  defaultLimit: 12,
  scrollToTop: true,
  scrollOffset: 100,
});

// Page-level ContentBlocks
const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
  'blog-content-blocks',
  '/api/content-blocks/',
  { page_name: 'blog' },
);
const getContentBlock = (key: string) =>
  contentBlocks.value?.results?.find((b) => b.key === key);

// Categories (used for filter chips + label resolution in cards)
const { data: categoriesData } = await useApi<DjangoListResponse<Category>>(
  '/api/post-categories/',
  { params: { is_active: true, ordering: 'order' } },
);
const categories = computed(() => categoriesData.value?.results ?? []);

// Posts list, reactive to filter/search/page
const postsParams = computed(() => ({
  expand: 'category,tags,images',
  ordering: '-is_pinned,-published_at',
  page: pagination.currentPage.value,
  limit: pagination.limit.value,
  ...(selectedCategory.value !== 'all' && { category: selectedCategory.value }),
  ...(searchQuery.value && { search: searchQuery.value }),
}));

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { title: t('nav.home'), to: '/' },
  { title: t('nav.blog'), disabled: true },
]);

const {
  data: posts,
  refresh: refreshPosts,
  pending: isLoading,
} = await useApi<DjangoListResponse<Post>>('/api/posts/published/', {
  params: postsParams,
  watch: [postsParams],
});

watch(
  () => posts.value?.count,
  (count) => {
    if (count !== undefined) pagination.setTotalItems(count);
  },
  { immediate: true },
);

// Reset to page 1 on category/search change; debounce search input.
watch(selectedCategory, () => {
  pagination.reset();
  refreshPosts();
});

let searchTimeout: ReturnType<typeof setTimeout> | undefined;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.reset();
    refreshPosts();
  }, 400);
});

// SEO
const { setSeoMeta, setStructuredData } = useSeo();
setSeoMeta({
  title: getContentBlock('page_title')?.text || t('blog.title'),
  description: getContentBlock('page_description')?.text || t('blog.subtitle'),
  type: 'website',
});

const blogUrl = computed(
  () => `${config.public.siteUrl}/${locale.value}/blog`,
);

watchEffect(() => {
  const list = posts.value?.results ?? [];
  setStructuredData([
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      '@id': `${blogUrl.value}#blog`,
      name: getContentBlock('hero_title')?.text || t('blog.title'),
      description: getContentBlock('hero_subtitle')?.text || t('blog.subtitle'),
      url: blogUrl.value,
      inLanguage: locale.value === 'pt-br' ? 'pt-BR' : 'en-US',
      publisher: {
        '@type': 'Person',
        name: 'Leonardo Costa',
        url: config.public.siteUrl,
      },
      blogPost: list.slice(0, 10).map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        url: `${config.public.siteUrl}/${locale.value}/blog/${post.slug}`,
        datePublished: post.published_at,
        dateModified: post.updated_at || post.published_at,
        author: { '@type': 'Person', name: 'Leonardo Costa' },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: list.length,
      itemListElement: list.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${config.public.siteUrl}/${locale.value}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  ]);
});

// Pinned posts (first page only) get the wide featured card; the rest go
// in the regular grid below.
const pinnedPosts = computed(() =>
  pagination.currentPage.value === 1
    ? posts.value?.results?.filter((p) => p.is_pinned) ?? []
    : [],
);
const regularPosts = computed(
  () => posts.value?.results?.filter((p) => !p.is_pinned) ?? [],
);

const hasResults = computed(() => (posts.value?.results?.length ?? 0) > 0);

const showingFrom = computed(() =>
  Math.min(
    (pagination.currentPage.value - 1) * pagination.limit.value + 1,
    posts.value?.count ?? 0,
  ),
);
const showingTo = computed(() =>
  Math.min(
    pagination.currentPage.value * pagination.limit.value,
    posts.value?.count ?? 0,
  ),
);

useFadeUp();
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative">
      <AuroraBg :intensity="0.4" />
      <div class="relative max-w-[1280px] mx-auto px-6 pt-12 pb-10">
        <Breadcrumbs :items="breadcrumbItems" class="mb-6" />
        <SectionLabel index="01" :name="$t('blog.label')" />
        <h1 class="h-display text-[48px] sm:text-[64px] lg:text-[80px] font-bold mt-3 leading-[1.02]">
          {{ getContentBlock('hero_title')?.text || $t('blog.title') }}
        </h1>
        <p class="mt-6 text-[16px] sm:text-[17px] text-ink-2 leading-[1.65] max-w-[640px]">
          {{ getContentBlock('hero_subtitle')?.text || $t('blog.subtitle') }}
        </p>
      </div>
    </section>

    <!-- Filters & search -->
    <section>
      <div
        class="max-w-[1280px] mx-auto px-6 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <!-- Search -->
        <div class="relative w-full md:max-w-[420px]">
          <Search
            :size="16"
            :stroke-width="1.8"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
          />
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="$t('blog.search')"
            class="w-full pl-10 pr-3.5 py-2.5 bg-card text-ink placeholder:text-ink-4 ring-hair rounded-input text-[14.5px] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper transition-shadow color-mode-fade"
          />
        </div>

        <!-- Filter chips -->
        <div
          class="flex items-center gap-2 overflow-x-auto md:justify-end md:flex-wrap"
        >
          <span class="font-mono-rail shrink-0">{{ $t('projects.filterLabel') }}</span>
          <button
            type="button"
            :class="[
              'shrink-0 inline-flex items-center font-mono text-[11.5px] tracking-[0.04em] px-2.5 py-[5px]',
              'rounded-chip border transition-colors capitalize',
              selectedCategory === 'all'
                ? 'bg-accent-soft text-accent-2 dark:text-accent border-accent/20'
                : 'bg-card text-ink-2 hover:text-ink hover:bg-card-soft border-line',
            ]"
            @click="selectedCategory = 'all'"
          >
            {{ $t('common.all') }}
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            :class="[
              'shrink-0 inline-flex items-center font-mono text-[11.5px] tracking-[0.04em] px-2.5 py-[5px]',
              'rounded-chip border transition-colors',
              selectedCategory === category.id.toString()
                ? 'bg-accent-soft text-accent-2 dark:text-accent border-accent/20'
                : 'bg-card text-ink-2 hover:text-ink hover:bg-card-soft border-line',
            ]"
            @click="selectedCategory = category.id.toString()"
          >
            {{ category.name }}
          </button>
          <NuxtLink
            :to="localePath('/blog/category')"
            class="shrink-0 font-mono-rail underline-offset-4 hover:text-accent transition-colors"
          >
            {{ $t('common.allCategories') }} ↗
          </NuxtLink>
        </div>
      </div>

      <!-- Result count -->
      <div
        v-if="posts?.count !== undefined && posts.count > 0"
        class="max-w-[1280px] mx-auto px-6 pb-4 text-[13px] text-ink-3"
      >
        {{ $t('blog.showingResults', { from: showingFrom, to: showingTo, total: posts.count }) }}
      </div>
    </section>

    <!-- Posts -->
    <section>
      <div class="max-w-[1280px] mx-auto px-6 pb-10">
        <!-- Loading skeleton (kept simple — full skeleton lib in a later PR) -->
        <div v-if="isLoading" class="py-16 flex items-center justify-center text-ink-3 text-sm font-mono">
          <span class="animate-pulse">{{ $t('common.loading') }}</span>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!hasResults"
          class="flex flex-col items-center text-center py-20 text-ink-3 fade-up"
        >
          <FileSearch :size="48" :stroke-width="1.4" class="text-ink-4" />
          <p class="text-[16px] mt-4">{{ $t('blog.noPostsFound') }}</p>
        </div>

        <template v-else>
          <!-- Pinned (featured) -->
          <div v-if="pinnedPosts.length" class="space-y-3 mb-3">
            <PostCard
              v-for="post in pinnedPosts"
              :key="`pin-${post.id}`"
              :post="post"
              :categories="categories"
              featured
            />
          </div>

          <!-- Regular grid -->
          <div
            v-if="regularPosts.length"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <PostCard
              v-for="post in regularPosts"
              :key="post.id"
              :post="post"
              :categories="categories"
            />
          </div>
        </template>

        <!-- Pagination -->
        <Pagination
          :current-page="pagination.currentPage.value"
          :total-pages="pagination.totalPages.value"
          :has-next="pagination.hasNext.value"
          :has-previous="pagination.hasPrevious.value"
          @page-change="pagination.goToPage"
        />
      </div>
    </section>
  </div>
</template>
