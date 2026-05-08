<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileSearch } from 'lucide-vue-next';
import type { DjangoListResponse } from '~/types/api';
import type { Post, Category } from '~/types/blog';
import Pagination from '~/components/common/Pagination.vue';
import Breadcrumbs from '~/components/common/Breadcrumbs.vue';
import PostCard from '~/components/blog/PostCard.vue';
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs';

if (import.meta.client) gsap.registerPlugin(ScrollTrigger);

const route = useRoute();
const slug = route.params.slug as string;
const localePath = useLocalePath();
const { locale, t } = useI18n();
const config = useRuntimeConfig();

const { data: categoriesData } = await useApi<
  DjangoListResponse<Category<{ parent: true }>>
>('/api/post-categories/', {
  params: { translations__slug: slug, expand: 'parent,children,images' },
});

const category = computed(() => categoriesData.value?.results?.[0]);

if (!category.value) {
  throw createError({ statusCode: 404, message: t('errors.categoryNotFound') });
}

const pagination = usePagination({
  defaultLimit: 12,
  scrollToTop: true,
  scrollOffset: 100,
});

const postsParams = computed(() => ({
  category: category.value?.id,
  expand: 'category,tags,images',
  ordering: '-is_pinned,-published_at',
  page: pagination.currentPage.value,
  limit: pagination.limit.value,
}));

const { data: posts, pending: isLoading } = await useApi<
  DjangoListResponse<Post>
>('/api/posts/published/', {
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

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { title: t('nav.home'), to: '/' },
  { title: t('nav.blog'), to: '/blog' },
  { title: t('common.categories'), to: '/blog/category' },
  { title: category.value?.name || slug, disabled: true },
]);

// SEO
const { setSeoMeta, setStructuredData } = useSeo();

const categoryImage = computed(() => {
  const cover = category.value?.images?.find((img) => img.image_type === 'cover');
  return (
    cover?.file ||
    cover?.thumbnail ||
    `${config.public.siteUrl}/og-default.jpg`
  );
});

setSeoMeta({
  title:
    category.value?.seo_title ||
    `${category.value?.name} | ${t('blog.title')}`,
  description:
    category.value?.meta_description ||
    category.value?.description ||
    t('blog.subtitle'),
  image: categoryImage.value,
  type: 'website',
});

const categoryUrl = computed(
  () =>
    `${config.public.siteUrl}/${locale.value}/blog/category/${category.value?.slug}`,
);

watchEffect(() => {
  const list = posts.value?.results ?? [];
  setStructuredData([
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${categoryUrl.value}#collection`,
      name: category.value?.name,
      description: category.value?.description,
      url: categoryUrl.value,
      inLanguage: locale.value === 'pt-br' ? 'pt-BR' : 'en-US',
      isPartOf: {
        '@type': 'Blog',
        '@id': `${config.public.siteUrl}/${locale.value}/blog#blog`,
      },
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

const hasResults = computed(() => (posts.value?.results?.length ?? 0) > 0);

onMounted(() => {
  gsap.utils.toArray<HTMLElement>('.fade-up').forEach((element) => {
    gsap.from(element, {
      y: 32,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 92%', once: true },
    });
  });
});
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative">
      <AuroraBg :intensity="0.4" />
      <div class="relative max-w-[1280px] mx-auto px-6 pt-12 pb-10">
        <Breadcrumbs :items="breadcrumbItems" class="mb-6" />
        <SectionLabel index="" :name="$t('blog.category')" tone="accent" />
        <h1
          class="h-display text-[44px] sm:text-[60px] lg:text-[72px] font-bold mt-3 leading-[1.04]"
        >
          {{ category?.name }}
        </h1>
        <p
          v-if="category?.description"
          class="mt-5 text-[16px] text-ink-2 leading-[1.65] max-w-[640px]"
        >
          {{ category.description }}
        </p>
        <div
          v-if="posts?.count !== undefined"
          class="mt-6 font-mono-rail"
        >
          {{ posts.count }} {{ $t('blog.articles') }}
        </div>
      </div>
    </section>

    <!-- Posts -->
    <section>
      <div class="max-w-[1280px] mx-auto px-6 pb-16">
        <div v-if="isLoading" class="py-16 text-center text-ink-3 text-sm font-mono">
          <span class="animate-pulse">{{ $t('common.loading') }}</span>
        </div>

        <div
          v-else-if="!hasResults"
          class="flex flex-col items-center text-center py-20 text-ink-3 fade-up"
        >
          <FileSearch :size="48" :stroke-width="1.4" class="text-ink-4" />
          <p class="text-[16px] mt-4">{{ $t('blog.noPostsFound') }}</p>
          <NuxtLink
            :to="localePath('/blog')"
            class="mt-4 font-mono-rail underline-offset-4 hover:text-accent transition-colors"
          >
            {{ $t('common.backToBlog') }} ↗
          </NuxtLink>
        </div>

        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <PostCard
            v-for="post in posts?.results"
            :key="post.id"
            :post="post"
          />
        </div>

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
