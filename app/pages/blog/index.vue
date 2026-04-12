<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { DjangoListResponse } from '~/types/api';
import type { ContentBlock } from '~/types/content';
import type { Post, Category } from '~/types/blog';
import Breadcrumbs from '~/components/common/Breadcrumbs.vue';
import BlogCategoriesDrawer from '~/components/blog/BlogCategoriesDrawer.vue';
import Pagination from '~/components/common/Pagination.vue';
import { formatYearMonthDay } from '~/utils/date';

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger);
}

const route = useRoute();
const localePath = useLocalePath();
const { locale, t } = useI18n();
const selectedCategory = ref<string>('all');
const searchQuery = ref('');
const showCategoriesDrawer = ref(false);

// Pagination
const pagination = usePagination({
  defaultLimit: 12,
  scrollToTop: true,
  scrollOffset: 100
});

// Fetch content blocks for blog page
const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
  'blog-content-blocks',
  '/api/content-blocks/',
  { page_name: 'blog' }
);

const getContentBlock = (key: string) => {
  return contentBlocks.value?.results?.find(block => block.key === key);
};

// Fetch categories
const { data: categories } = await useApi<DjangoListResponse<Category>>('/api/post-categories/', {
  params: { is_active: true, ordering: 'order' }
});

// Fetch posts with reactive params
const postsParams = computed(() => ({
  expand: 'category,tags,images',
  ordering: '-is_pinned,-published_at',
  page: pagination.currentPage.value,
  limit: pagination.limit.value,
  ...(selectedCategory.value !== 'all' && { category: selectedCategory.value }),
  ...(searchQuery.value && { search: searchQuery.value })
}));

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { title: t('nav.home'), to: '/' },
  { title: t('nav.blog'), to: '/blog', disabled: true },
]);

const { data: posts, refresh: refreshPosts, pending: isLoading } = await useApi<DjangoListResponse<Post>>('/api/posts/published/', {
  params: postsParams,
  watch: [postsParams]
});

// Update pagination total when posts data changes
watch(() => posts.value?.count, (count) => {
  if (count !== undefined) {
    pagination.setTotalItems(count);
  }
}, { immediate: true });

const config = useRuntimeConfig();
const { setSeoMeta, setStructuredData } = useSeo();

setSeoMeta({
  title: getContentBlock('page_title')?.text || t('blog.title'),
  description: getContentBlock('page_description')?.text || t('blog.subtitle'),
  type: 'website',
});

// Blog + ItemList schema — helps search engines surface the blog as a content hub
const blogUrl = computed(() => `${config.public.siteUrl}/${locale.value}/blog`);

watchEffect(() => {
  const postResults = posts.value?.results || [];
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
      blogPost: postResults.slice(0, 10).map((post) => ({
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
      numberOfItems: postResults.length,
      itemListElement: postResults.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${config.public.siteUrl}/${locale.value}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  ]);
});

// Watch for category changes - reset to page 1
watch(selectedCategory, () => {
  pagination.reset();
  refreshPosts();
});

// Watch for search query with debounce - reset to page 1
let searchTimeout: NodeJS.Timeout;
watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.reset();
    refreshPosts();
  }, 500);
});



const getCategoryName = (categoryId: number | Category | null) => {
  if (!categoryId) return '';
  if (typeof categoryId === 'object') return categoryId.name;
  const cat = categories.value?.results?.find(c => c.id === categoryId);
  return cat?.name || '';
};

const getCoverImage = (post: Post) => {
  const coverImage = post.images?.find(img => img.image_type === 'cover');
  return coverImage?.thumbnail || coverImage?.file || `https://placehold.co/800x500?text=${post.title}`;
};

onMounted(() => {
  gsap.from('.page-title', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.from('.page-subtitle', {
    y: 20,
    opacity: 0,
    duration: 0.8,
    delay: 0.2,
    ease: 'power2.out'
  });

  gsap.utils.toArray('.fade-up').forEach((element: any) => {
    gsap.from(element, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: element,
        start: 'top 90%',
        once: true
      }
    });
  });
});
</script>

<template>
  <div class="blog-page">
    <!-- Hero Section -->
    <v-container class="hero-section">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8" class="text-center">
          <Breadcrumbs :items="breadcrumbItems" />
          <h1 class="page-title mb-6">
            {{ getContentBlock('hero_title')?.text || t('blog.title') }}
          </h1>
          <p class="page-subtitle">
            {{ getContentBlock('hero_subtitle')?.text || t('blog.subtitle') }}
          </p>
        </v-col>
      </v-row>
    </v-container>

    <!-- Filters and Search -->
    <v-container class="filters-section">
      <v-row justify="center">
        <v-col cols="12" md="10">
          <div class="filters-wrapper fade-up">
            <!-- Search -->
            <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" :placeholder="t('blog.search')"
              variant="outlined" density="comfortable" hide-details class="search-field mb-6" />

            <!-- Category Filters -->
            <div class="d-flex justify-center align-center gap-4">
              <v-chip-group v-model="selectedCategory" mandatory color="primary" class="filters-chips">
                <v-chip value="all" class="filter-chip">
                  {{ t('common.all') }}
                </v-chip>
                <v-chip v-for="category in categories?.results" :key="category.id" :value="category.id.toString()"
                  class="filter-chip">
                  {{ category.name }}
                </v-chip>
              </v-chip-group>
              <v-btn variant="tonal" @click="showCategoriesDrawer = true" rounded color="secondary">
                <span style="font-style: italic;">
                  {{ t('common.allCategories') }}
                </span>
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Categories Drawer -->
    <BlogCategoriesDrawer v-model="showCategoriesDrawer" />

    <!-- Loading State -->
    <v-container v-if="isLoading" class="posts-section">
      <v-row justify="center">
        <v-col cols="12" class="text-center py-16">
          <v-progress-circular indeterminate size="64" color="primary" />
          <p class="text-h6 text-grey-darken-1 mt-4">{{ t('common.loading') }}</p>
        </v-col>
      </v-row>
    </v-container>

    <!-- Posts Grid -->
    <v-container v-else class="posts-section">
      <v-row justify="center">
        <!-- Results Count -->
        <div v-if="posts?.count !== undefined" class="results-count text-center mt-3">
          <p class="text-body-2 text-grey-darken-1">
            {{ t('blog.showingResults', {
              from: Math.min((pagination.currentPage.value - 1) * pagination.limit.value + 1, posts.count),
              to: Math.min(pagination.currentPage.value * pagination.limit.value, posts.count),
              total: posts.count
            }) }}
          </p>
        </div>
      </v-row>
      <v-row>
        <!-- Pinned Posts (only on first page) -->
        <v-col v-for="post in pagination.currentPage.value === 1 ? posts?.results?.filter(p => p.is_pinned) : []"
          :key="`pinned-${post.id}`" cols="12" class="fade-up">
          <div class="post-card featured">
            <div class="featured-badge">
              <v-icon size="16">mdi-pin</v-icon>
              {{ t('projects.featured') }}
            </div>

            <v-row>
              <v-col cols="12" md="5">
                <div class="post-image-wrapper">
                  <NuxtLink :to="localePath(`/blog/${post.slug}`)">
                    <NuxtImg :src="getCoverImage(post)" :aspect-ratio="16 / 10" class="post-image" />
                  </NuxtLink>
                </div>
              </v-col>

              <v-col cols="12" md="7">
                <div class="post-content">
                  <div class="post-meta">
                    <span v-if="getCategoryName(post.category)" class="post-category">
                      {{ getCategoryName(post.category) }}
                    </span>
                    <span class="post-date">{{ formatYearMonthDay(post.published_at, locale) }}</span>
                  </div>

                  <NuxtLink :to="localePath(`/blog/${post.slug}`)" class="post-title-link">
                    <h2 class="post-title">{{ post.title }}</h2>
                  </NuxtLink>

                  <p class="post-excerpt">{{ post.excerpt }}</p>

                  <div class="post-footer">
                    <div class="post-stats">
                      <span class="post-stat">
                        <v-icon size="16">mdi-clock-outline</v-icon>
                        {{ post.reading_time }} min
                      </span>
                      <span class="post-stat">
                        <v-icon size="16">mdi-eye-outline</v-icon>
                        {{ post.view_count }}
                      </span>
                    </div>

                    <NuxtLink :to="localePath(`/blog/${post.slug}`)" class="read-more">
                      {{ t('common.readMore') }}
                      <v-icon size="16" end>mdi-arrow-right</v-icon>
                    </NuxtLink>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-col>

        <!-- Regular Posts -->
        <v-col v-for="post in posts?.results?.filter(p => !p.is_pinned)" :key="post.id" cols="12" md="6" lg="4"
          class="fade-up">
          <div class="post-card">
            <div class="post-image-wrapper">
              <NuxtLink :to="localePath(`/blog/${post.slug}`)">
                <NuxtImg :src="getCoverImage(post)" class="post-image" :width="800" :height="500"
                  style="aspect-ratio: 16 / 10; width: 100%; height: auto; object-fit: cover;" />
              </NuxtLink>
            </div>

            <div class="post-content">
              <div class="post-meta">
                <span v-if="getCategoryName(post.category)" class="post-category">
                  {{ getCategoryName(post.category) }}
                </span>
                <span class="post-date">{{ formatYearMonthDay(post.published_at, locale) }}</span>
              </div>

              <NuxtLink :to="localePath(`/blog/${post.slug}`)" class="post-title-link">
                <h3 class="post-title">{{ post.title }}</h3>
              </NuxtLink>

              <p class="post-excerpt">{{ post.excerpt }}</p>

              <div class="post-footer">
                <div class="post-stats">
                  <span class="post-stat">
                    <v-icon size="14">mdi-clock-outline</v-icon>
                    {{ post.reading_time }} min
                  </span>
                  <span class="post-stat">
                    <v-icon size="14">mdi-eye-outline</v-icon>
                    {{ post.view_count }}
                  </span>
                </div>

                <NuxtLink :to="localePath(`/blog/${post.slug}`)" class="read-more">
                  {{ t('common.readMore') }}
                  <v-icon size="14" end>mdi-arrow-right</v-icon>
                </NuxtLink>
              </div>
            </div>
          </div>
        </v-col>

        <!-- Empty State -->
        <v-col v-if="!posts?.results?.length" cols="12" class="text-center py-16">
          <v-icon size="80" color="grey-lighten-1">mdi-text-box-search-outline</v-icon>
          <p class="text-h6 text-grey-darken-1 mt-4">
            {{ t('blog.noPostsFound') }}
          </p>
        </v-col>
      </v-row>

      <!-- Pagination -->
      <Pagination :current-page="pagination.currentPage.value" :total-pages="pagination.totalPages.value"
        :has-next="pagination.hasNext.value" :has-previous="pagination.hasPrevious.value"
        @page-change="pagination.goToPage" />
    </v-container>
  </div>
</template>

<style scoped>
.blog-page {
  background: #fafafa;
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  padding: 120px 24px 60px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
}

.page-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.page-subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #6b7280;
  line-height: 1.6;
  max-width: 700px;
  margin: 0 auto;
}

/* Filters Section */
.filters-section {
  padding: 40px 24px;
}

.filters-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.search-field {
  max-width: 100%;
}

.filters-chips {
  justify-content: center;
}

.filter-chip {
  text-transform: capitalize;
  font-weight: 600;
}

/* Posts Section */
.posts-section {
  padding: 30px 24px 120px;
  max-width: 1400px;
}

/* Post Card */
.post-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f3f4f6;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.post-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
}

.post-card.featured {
  border: 2px solid #2563eb;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.featured-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(37, 99, 235, 0.95);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(8px);
  z-index: 1;
}

.post-image-wrapper {
  position: relative;
  overflow: hidden;
  background: #f9fafb;
}

.post-image {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.post-card:hover .post-image {
  transform: scale(1.05);
}

.post-content {
  padding: 32px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.post-category {
  font-size: 0.75rem;
  padding: 6px 12px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.post-date {
  font-size: 0.875rem;
  color: #9ca3af;
}

.post-title-link {
  text-decoration: none;
  color: inherit;
}

.post-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
  line-height: 1.3;
  transition: color 0.2s ease;
}

.post-card.featured .post-title {
  font-size: 1.75rem;
}

.post-title-link:hover .post-title {
  color: #2563eb;
}

.post-excerpt {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.post-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #9ca3af;
}

.read-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
  transition: gap 0.2s ease;
}

.read-more:hover {
  gap: 8px;
}

/* Responsive */
@media (max-width: 960px) {
  .hero-section {
    padding: 80px 24px 40px;
  }

  .posts-section {
    padding: 40px 24px 80px;
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 60px 20px 30px;
  }

  .posts-section {
    padding: 30px 20px 60px;
  }

  .post-content {
    padding: 24px;
  }

  .post-card.featured .post-title {
    font-size: 1.5rem;
  }
}

.results-count {
  margin-top: 16px;
}
</style>