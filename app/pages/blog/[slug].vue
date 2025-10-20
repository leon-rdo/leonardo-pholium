<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { DjangoListResponse } from '~/types/api';
import type { Post, Category } from '~/types/blog';
import BlogComments from '~/components/blog/BlogComments.vue';
import BlogReactions from '~/components/blog/BlogReactions.vue';

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger);
}

const { t } = useI18n();
const route = useRoute();
const slug = route.params.slug as string;

// Fetch post by slug
const { data: posts } = await useApi<DjangoListResponse<Post>>('/api/posts/', {
  params: {
    slug,
    expand: 'category,series,tags'
  }
});

const post = computed(() => posts.value?.results?.[0]);

if (!post.value) {
  throw createError({ statusCode: 404, message: t('errors.post_not_found') });
}

// Fetch related posts
const { data: relatedPosts } = await useApi<DjangoListResponse<Post<{ category: true }>>>('/api/blog/posts/published/', {
  params: {
    category: typeof post.value.category === 'object' ? post.value.category?.id : post.value.category,
    limit: 3,
    expand: 'category'
  }
});

const filteredRelatedPosts = computed(() =>
  relatedPosts.value?.results?.filter(p => p.id !== post.value?.id).slice(0, 3) || []
);

useSeoMeta({
  title: post.value.seo_title || post.value.title,
  description: post.value.meta_description || post.value.excerpt,
  ogTitle: post.value.title,
  ogDescription: post.value.excerpt,
  ogType: 'article',
  articlePublishedTime: post.value.published_at || undefined,
  articleModifiedTime: post.value.updated_at,
});

const formatDate = (date: string | null) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getCategoryName = (category: number | Category | null) => {
  if (!category) return '';
  return typeof category === 'object' ? category.name : '';
};

const sharePost = (platform: string) => {
  const url = window.location.href;
  const title = post.value?.title || '';

  const urls: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
  };

  if (urls[platform]) {
    window.open(urls[platform], '_blank', 'width=600,height=400');
  }
};

const copyLink = () => {
  navigator.clipboard.writeText(window.location.href);
  // You could add a toast notification here
};

onMounted(() => {
  gsap.from('.post-header', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.from('.post-body', {
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
  <div v-if="post" class="blog-post-page">
    <!-- Post Header -->
    <v-container class="post-header-section">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <div class="post-header">
            <!-- Category Badge -->
            <div class="post-meta-top">
              <span v-if="getCategoryName(post.category)" class="post-category-badge">
                {{ getCategoryName(post.category) }}
              </span>
              <span class="post-date">{{ formatDate(post.published_at) }}</span>
            </div>

            <!-- Title -->
            <h1 class="post-title">{{ post.title }}</h1>

            <!-- Excerpt -->
            <p v-if="post.excerpt" class="post-excerpt">{{ post.excerpt }}</p>

            <!-- Meta Info -->
            <div class="post-meta-bottom">
              <div class="post-stats">
                <span class="post-stat">
                  <v-icon size="18">mdi-clock-outline</v-icon>
                  {{ post.reading_time }} {{ t('blog.readingTime') }}
                </span>
                <span class="post-stat">
                  <v-icon size="18">mdi-eye-outline</v-icon>
                  {{ post.view_count }} {{ t('blog.views') }}
                </span>
              </div>

              <!-- Share Buttons -->
              <div class="share-buttons">
                <v-btn size="small" variant="text" icon @click="sharePost('twitter')" title="Compartilhar no Twitter">
                  <v-icon>mdi-twitter</v-icon>
                </v-btn>
                <v-btn size="small" variant="text" icon @click="sharePost('facebook')" title="Compartilhar no Facebook">
                  <v-icon>mdi-facebook</v-icon>
                </v-btn>
                <v-btn size="small" variant="text" icon @click="sharePost('linkedin')" title="Compartilhar no LinkedIn">
                  <v-icon>mdi-linkedin</v-icon>
                </v-btn>
                <v-btn size="small" variant="text" icon @click="sharePost('whatsapp')" title="Compartilhar no WhatsApp">
                  <v-icon>mdi-whatsapp</v-icon>
                </v-btn>
                <v-btn size="small" variant="text" icon @click="copyLink" title="Copiar link">
                  <v-icon>mdi-link-variant</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Featured Image -->
    <v-container v-if="post.images?.find(image => image.image_type === 'cover')" class="post-featured-image">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <v-img
            :src="post.images?.find(image => image.image_type === 'cover')?.file || 'https://via.placeholder.com/600x400'"
            :aspect-ratio="16 / 9" cover class="featured-image" />
        </v-col>
      </v-row>
    </v-container>

    <!-- Post Body -->
    <v-container class="post-body-section">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <article class="post-body" v-html="post.body"></article>
        </v-col>
      </v-row>
    </v-container>

    <!-- Reactions -->
    <v-container class="reactions-section">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <BlogReactions :post-id="post.id" />
        </v-col>
      </v-row>
    </v-container>

    <!-- Comments -->
    <v-container v-if="post.allow_comments" class="comments-section">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <BlogComments :post-id="post.id" />
        </v-col>
      </v-row>
    </v-container>

    <!-- Related Posts -->
    <v-container v-if="filteredRelatedPosts.length" class="related-posts-section">
      <v-row justify="center">
        <v-col cols="12">
          <h2 class="section-title text-center mb-12 fade-up">
            {{ t('blog.relatedPosts') }}
          </h2>
        </v-col>
      </v-row>

      <v-row>
        <v-col v-for="relatedPost in filteredRelatedPosts" :key="relatedPost.id" cols="12" md="4" class="fade-up">
          <div class="related-post-card">
            <NuxtLink :to="`/blog/${relatedPost.slug}`">
              <v-img
                :src="relatedPost.images?.find(image => image.image_type === 'cover')?.file || 'https://via.placeholder.com/600x400'"
                :aspect-ratio="16 / 10" cover class="related-post-image" />
            </NuxtLink>

            <div class="related-post-content">
              <span v-if="getCategoryName(relatedPost.category)" class="related-post-category">
                {{ getCategoryName(relatedPost.category) }}
              </span>

              <NuxtLink :to="`/blog/${relatedPost.slug}`" class="related-post-title-link">
                <h3 class="related-post-title">{{ relatedPost.title }}</h3>
              </NuxtLink>

              <p class="related-post-excerpt">{{ relatedPost.excerpt }}</p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Back to Blog -->
    <v-container class="back-section">
      <v-row justify="center">
        <v-col cols="12" class="text-center">
          <v-btn size="large" variant="outlined" color="grey-darken-2" class="text-none" to="/blog">
            <v-icon start>mdi-arrow-left</v-icon>
            {{ t('common.backToBlog') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.blog-post-page {
  background: #fafafa;
  min-height: 100vh;
}

/* Post Header */
.post-header-section {
  padding: 120px 24px 60px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
}

.post-header {
  max-width: 800px;
  margin: 0 auto;
}

.post-meta-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.post-category-badge {
  font-size: 0.875rem;
  padding: 8px 16px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.post-date {
  font-size: 0.9375rem;
  color: #9ca3af;
  font-weight: 500;
}

.post-title {
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 24px;
}

.post-excerpt {
  font-size: 1.25rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 32px;
}

.post-meta-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  gap: 16px;
  flex-wrap: wrap;
}

.post-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.post-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9375rem;
  color: #6b7280;
  font-weight: 500;
}

.share-buttons {
  display: flex;
  gap: 4px;
}

/* Featured Image */
.post-featured-image {
  padding: 0 24px 60px;
  max-width: 1200px;
}

.featured-image {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Post Body */
.post-body-section {
  padding: 60px 24px;
  background: white;
  max-width: 900px;
}

.post-body {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #1a1a1a;
}

.post-body :deep(h2) {
  font-size: 2rem;
  font-weight: 700;
  margin: 48px 0 24px;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.post-body :deep(h3) {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 36px 0 20px;
  color: #1a1a1a;
}

.post-body :deep(p) {
  margin-bottom: 24px;
}

.post-body :deep(a) {
  color: #2563eb;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.post-body :deep(a:hover) {
  color: #1d4ed8;
}

.post-body :deep(ul),
.post-body :deep(ol) {
  margin: 24px 0;
  padding-left: 24px;
}

.post-body :deep(li) {
  margin-bottom: 12px;
}

.post-body :deep(blockquote) {
  margin: 32px 0;
  padding: 20px 24px;
  border-left: 4px solid #2563eb;
  background: #f9fafb;
  font-style: italic;
  color: #4b5563;
}

.post-body :deep(code) {
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Courier New', monospace;
}

.post-body :deep(pre) {
  background: #1a1a1a;
  color: #f3f4f6;
  padding: 24px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 32px 0;
}

.post-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.post-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 32px 0;
}

/* Reactions and Comments */
.reactions-section,
.comments-section {
  padding: 60px 24px;
  background: white;
  max-width: 900px;
}

/* Related Posts */
.related-posts-section {
  padding: 80px 24px 120px;
  max-width: 1200px;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.related-post-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #f3f4f6;
  transition: all 0.3s ease;
  height: 100%;
}

.related-post-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
}

.related-post-image {
  transition: transform 0.6s ease;
}

.related-post-card:hover .related-post-image {
  transform: scale(1.05);
}

.related-post-content {
  padding: 24px;
}

.related-post-category {
  font-size: 0.75rem;
  padding: 6px 12px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-block;
  margin-bottom: 12px;
}

.related-post-title-link {
  text-decoration: none;
  color: inherit;
}

.related-post-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
  line-height: 1.3;
  transition: color 0.2s ease;
}

.related-post-title-link:hover .related-post-title {
  color: #2563eb;
}

.related-post-excerpt {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Back Section */
.back-section {
  padding: 0 24px 80px;
}

/* Responsive */
@media (max-width: 960px) {
  .post-header-section {
    padding: 80px 24px 40px;
  }

  .post-featured-image {
    padding: 0 24px 40px;
  }

  .post-body-section,
  .reactions-section,
  .comments-section {
    padding: 40px 24px;
  }

  .related-posts-section {
    padding: 60px 24px 80px;
  }
}

@media (max-width: 600px) {
  .post-header-section {
    padding: 60px 20px 30px;
  }

  .post-featured-image {
    padding: 0 20px 30px;
  }

  .post-body-section,
  .reactions-section,
  .comments-section {
    padding: 30px 20px;
  }

  .related-posts-section {
    padding: 40px 20px 60px;
  }

  .post-meta-bottom {
    flex-direction: column;
    align-items: flex-start;
  }

  .back-section {
    padding: 0 20px 60px;
  }
}
</style>