<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { DjangoListResponse } from '~/types/api';
import type { Post, Category } from '~/types/blog';

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger);
}

const route = useRoute();
const localePath = useLocalePath();
const slug = route.params.slug as string;

// Fetch category by slug
const { data: categories } = await useApi<DjangoListResponse<Category>>('/api/post-categories/', {
  params: { slug }
});

const category = computed(() => categories.value?.results?.[0]);

if (!category.value) {
  throw createError({ statusCode: 404, message: 'Categoria não encontrada' });
}

// Fetch posts in this category
const { data: posts } = await useApi<DjangoListResponse<Post>>('/api/posts/published/', {
  params: {
    category: category.value.id,
    expand: 'category,tags,images',
    ordering: '-is_pinned,-published_at'
  }
});

useSeoMeta({
  title: category.value.seo_title || `${category.value.name} | Blog`,
  description: category.value.meta_description || category.value.description,
});

const formatDate = (date: string | null) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

onMounted(() => {
  gsap.from('.page-title', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.from('.page-description', {
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
  <div v-if="category" class="category-page">
    <!-- Hero Section -->
    <v-container class="hero-section">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8" class="text-center">
          <div class="breadcrumbs mb-6">
            <NuxtLink :to="localePath('/blog')" class="breadcrumb-link">Blog</NuxtLink>
            <v-icon size="16" class="breadcrumb-separator">mdi-chevron-right</v-icon>
            <span class="breadcrumb-current">{{ category.name }}</span>
          </div>

          <h1 class="page-title mb-6">{{ category.name }}</h1>

          <p v-if="category.description" class="page-description">
            {{ category.description }}
          </p>

          <div class="category-stats">
            <span class="category-stat">
              <v-icon size="18">mdi-text-box-multiple</v-icon>
              {{ posts?.count || 0 }} {{ (posts?.count || 0) === 1 ? 'artigo' : 'artigos' }}
            </span>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Posts Grid -->
    <v-container class="posts-section">
      <v-row>
        <v-col v-for="post in posts?.results" :key="post.id" cols="12" md="6" lg="4" class="fade-up">
          <div class="post-card">
            <div class="post-image-wrapper">
              <NuxtLink :to="localePath(`/blog/${post.slug}`)">
                <v-img
                  :src="post.images?.find(image => image.image_type === 'cover')?.file || 'https://via.placeholder.com/600x400'"
                  :aspect-ratio="16 / 10" cover class="post-image" />
              </NuxtLink>
            </div>

            <div class="post-content">
              <div class="post-meta">
                <span class="post-date">{{ formatDate(post.published_at) }}</span>
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
                  Ler mais
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
            Nenhum artigo nesta categoria ainda
          </p>
        </v-col>
      </v-row>
    </v-container>

    <!-- Back to Blog -->
    <v-container class="back-section">
      <v-row justify="center">
        <v-col cols="12" class="text-center">
          <v-btn size="large" variant="outlined" color="grey-darken-2" class="text-none" :to="localePath('/blog')">
            <v-icon start>mdi-arrow-left</v-icon>
            Voltar para o Blog
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.category-page {
  background: #fafafa;
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  padding: 120px 24px 60px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.875rem;
}

.breadcrumb-link {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #2563eb;
}

.breadcrumb-separator {
  color: #d1d5db;
}

.breadcrumb-current {
  color: #1a1a1a;
  font-weight: 600;
}

.page-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.page-description {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: #6b7280;
  line-height: 1.6;
  max-width: 700px;
  margin: 0 auto 32px;
}

.category-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.category-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9375rem;
  color: #6b7280;
  font-weight: 500;
}

/* Posts Section */
.posts-section {
  padding: 60px 24px 120px;
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
}

.post-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
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
  margin-bottom: 12px;
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
  line-clamp: 3;
  -webkit-line-clamp: 3;
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

/* Back Section */
.back-section {
  padding: 0 24px 80px;
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

  .back-section {
    padding: 0 20px 60px;
  }
}
</style>