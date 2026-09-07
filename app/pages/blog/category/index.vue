<script setup lang="ts">
import { ArrowUpRight, FolderOpen } from 'lucide-vue-next';
import type { DjangoListResponse } from '~/types/api';
import type { Category } from '~/types/blog';
import Breadcrumbs from '~/components/common/Breadcrumbs.vue';
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs';


const localePath = useLocalePath();
const { t, locale } = useI18n();
const config = useRuntimeConfig();

const { data: categoriesData } = await useApi<DjangoListResponse<Category>>(
  '/api/post-categories/',
  {
    params: { is_active: true, ordering: 'order', expand: 'images' },
  },
);
const categories = computed(() => categoriesData.value?.results ?? []);

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { title: t('nav.home'), to: '/' },
  { title: t('nav.blog'), to: '/blog' },
  { title: t('common.categories'), disabled: true },
]);

// SEO
const { setSeoMeta, setStructuredData } = useSeo();
setSeoMeta({
  title: t('blog.categories'),
  description: t('blog.allCategories'),
  image: `${config.public.siteUrl}/og-default.jpg`,
  type: 'website',
});

const categoriesUrl = computed(
  () => `${config.public.siteUrl}/${locale.value}/blog/category`,
);

watchEffect(() => {
  const list = categories.value;
  setStructuredData([
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${categoriesUrl.value}#collection`,
      name: t('common.categories'),
      description: t('blog.allCategories'),
      url: categoriesUrl.value,
      inLanguage: locale.value === 'pt-br' ? 'pt-BR' : 'en-US',
      isPartOf: {
        '@type': 'Blog',
        '@id': `${config.public.siteUrl}/${locale.value}/blog#blog`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: list.length,
      itemListElement: list.map((cat, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${config.public.siteUrl}/${locale.value}/blog/category/${cat.slug}`,
        name: cat.name,
      })),
    },
  ]);
});

const getCategoryImage = (category: Category) => {
  const cover = category.images?.find((img) => img.image_type === 'cover');
  return cover?.thumbnail || cover?.file || null;
};

const gradients = [
  'from-emerald-600/40 via-emerald-700/30 to-emerald-900/40',
  'from-amber-500/40 via-orange-600/30 to-orange-700/40',
  'from-blue-600/40 via-indigo-700/30 to-indigo-900/40',
  'from-rose-500/40 via-rose-700/30 to-rose-900/40',
  'from-violet-500/40 via-purple-600/30 to-purple-800/40',
  'from-teal-500/40 via-cyan-600/30 to-cyan-800/40',
];

useFadeUp();
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative">
      <AuroraBg :intensity="0.4" />
      <div class="relative max-w-[1280px] mx-auto px-6 pt-12 pb-10">
        <Breadcrumbs :items="breadcrumbItems" class="mb-6" />
        <SectionLabel index="01" :name="$t('blog.categoriesLabel')" />
        <h1 class="h-display text-[40px] sm:text-[56px] lg:text-[64px] font-bold mt-3 leading-[1.04]">
          {{ $t('blog.categories') }}
        </h1>
        <p class="mt-5 text-[16px] text-ink-2 leading-[1.65] max-w-[640px]">
          {{ $t('blog.allCategoriesDescription', $t('blog.allCategories')) }}
        </p>
      </div>
    </section>

    <!-- Categories grid -->
    <section>
      <div class="max-w-[1280px] mx-auto px-6 pb-16">
        <div
          v-if="categories.length"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <NuxtLink
            v-for="(category, idx) in categories"
            :key="category.id"
            :to="localePath(`/blog/category/${category.slug}`)"
            class="group fade-up"
          >
            <Tile class="px-3 py-3 h-full flex flex-col">
              <div
                class="rounded-card overflow-hidden bg-gradient-to-br relative aspect-[16/10]"
                :class="gradients[idx % gradients.length]"
              >
                <NuxtImg
                  v-if="getCategoryImage(category)"
                  :src="getCategoryImage(category)!"
                  :alt="category.name"
                  :width="600"
                  :height="375"
                  format="webp"
                  class="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div class="px-3 sm:px-4 pt-5 pb-3 flex flex-col flex-1">
                <div class="font-mono-rail">
                  {{ $t('blog.category') }}
                </div>
                <h2
                  class="text-[20px] font-bold mt-1.5 group-hover:text-accent transition-colors flex items-start gap-2"
                >
                  {{ category.name }}
                  <ArrowUpRight
                    :size="15"
                    :stroke-width="2"
                    class="text-ink-3 group-hover:text-accent group-hover:translate-x-0.5 transition mt-1.5 shrink-0"
                  />
                </h2>
                <p
                  v-if="category.description"
                  class="mt-2 text-[14px] text-ink-2 leading-[1.65] flex-1 line-clamp-3"
                >
                  {{ category.description }}
                </p>
              </div>
            </Tile>
          </NuxtLink>
        </div>

        <div
          v-else
          class="flex flex-col items-center text-center py-20 text-ink-3 fade-up"
        >
          <FolderOpen :size="48" :stroke-width="1.4" class="text-ink-4" />
          <p class="text-[16px] mt-4">{{ $t('blog.noCategoriesAvailable') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
