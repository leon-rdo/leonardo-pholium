<script setup lang="ts">
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DjangoListResponse } from "~/types/api";
import type { Post, Category } from "~/types/blog";
import type { Image } from "~/types/core";
import type { BreadcrumbItem } from "~/composables/useBreadcrumbs";
import BlogComments from "~/components/blog/BlogComments.vue";
import BlogImageGallery from "~/components/blog/BlogImageGallery.vue";
import Breadcrumbs from "~/components/common/Breadcrumbs.vue";
import { formatYearMonthDay } from "~/utils/date";

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger);
}

const localePath = useLocalePath();
const { locale, t } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();
const slug = route.params.slug as string;

// Fetch post by slug
const { data: posts } = await useApi<
  DjangoListResponse<Post<{ category: true; author: true; tags: true }>>
>("/api/posts/", {
  params: {
    translations__slug: slug,
    expand: "category,series,tags",
  },
});

const post = computed(() => posts.value?.results?.[0]);

if (!post.value) {
  throw createError({ statusCode: 404, message: t("errors.post_not_found") });
}

const localViewCount = ref(post.value.view_count);

const { viewCounted, timeSpent } = usePostViewTracking(
  computed(() => post.value?.id || 0),
  {
    minReadTime: 3000,
  }
);

watch(viewCounted, (counted) => {
  if (counted && post.value) {
    localViewCount.value = post.value.view_count + 1;
  }
});

// Fetch images separately
const { data: imagesData } = await useApi<DjangoListResponse<Image>>(
  "/api/images/",
  {
    params: {
      content_type: config.public.postContentType,
      object_id: post.value.id,
    },
  }
);

const postImages = computed(() => imagesData.value?.results || []);
const coverImage = computed(() =>
  postImages.value.find((img) => img.image_type === "cover")
);
const galleryImages = computed(() =>
  postImages.value
    .filter(
      (img) => img.image_type === "gallery" || img.image_type === "document"
    )
    .sort((a, b) => a.order - b.order)
);

// Fetch related posts
const { data: relatedPosts } = await useApi<
  DjangoListResponse<Post<{ category: true }>>
>("/api/posts/published/", {
  params: {
    category: post.value.category?.id,
    limit: 3,
    expand: "category",
  },
});

const filteredRelatedPosts = computed(
  () =>
    relatedPosts.value?.results
      ?.filter((p) => p.id !== post.value?.id)
      .slice(0, 3) || []
);

// Fetch images for related posts
const relatedPostsImages = ref<Record<number, Image[]>>({});

onMounted(async () => {
  if (filteredRelatedPosts.value.length > 0) {
    const imagePromises = filteredRelatedPosts.value.map(
      async (relatedPost) => {
        const { data } = await useApi<DjangoListResponse<Image>>(
          "/api/images/",
          {
            params: {
              content_type: config.public.postContentType,
              object_id: relatedPost.id,
            },
          }
        );
        return { postId: relatedPost.id, images: data.value?.results || [] };
      }
    );

    const results = await Promise.all(imagePromises);
    results.forEach(({ postId, images }) => {
      relatedPostsImages.value[postId] = images;
    });
  }

  // GSAP Animations
  gsap.from(".post-header", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
  });

  gsap.from(".post-body", {
    y: 20,
    opacity: 0,
    duration: 0.8,
    delay: 0.2,
    ease: "power2.out",
  });

  gsap.utils.toArray(".fade-up").forEach((element: any) => {
    gsap.from(element, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: element,
        start: "top 90%",
        once: true,
      },
    });
  });
});

// Utility functions
const getCoverImageUrl = () => {
  return (
    coverImage.value?.file ||
    coverImage.value?.thumbnail ||
    `${config.public.siteUrl}/og-default.jpg`
  );
};

const getRelatedPostCoverImage = (postId: number) => {
  const images = relatedPostsImages.value[postId] || [];
  const cover = images.find((img) => img.image_type === "cover");
  return (
    cover?.file || cover?.thumbnail || "https://via.placeholder.com/600x400"
  );
};

const getCategoryName = (category: number | Category | null) => {
  if (!category) return "";
  return typeof category === "object" ? category.name : "";
};

const getWordCount = (html: string) => {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  return text.split(/\s+/).filter(Boolean).length;
};

const getArticleBody = (html: string) => {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
};

// Formata o tempo gasto na página
const formatTimeSpent = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
};

// SEO Configuration
const { setSeoMeta, setStructuredData } = useSeo();

setSeoMeta({
  title: post.value.seo_title || post.value.title,
  description: post.value.meta_description || post.value.excerpt,
  image: getCoverImageUrl(),
  type: "article",
  article: {
    publishedTime: post.value.published_at || undefined,
    modifiedTime: post.value.updated_at,
    author:
      typeof post.value.author === "object"
        ? `${post.value.author.first_name} ${post.value.author.last_name}`.trim()
        : undefined,
    section: getCategoryName(post.value.category),
    tags: post.value.tags
      ?.map((tag) => (typeof tag === "object" ? tag.name : ""))
      .filter(Boolean),
  },
});

// Enhanced Article Schema
setStructuredData({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.value.title,
  description: post.value.excerpt,
  image: {
    "@type": "ImageObject",
    url: getCoverImageUrl(),
    width: coverImage.value?.width || 1200,
    height: coverImage.value?.height || 630,
  },
  datePublished: post.value.published_at,
  dateModified: post.value.updated_at || post.value.published_at,
  author: {
    "@type": "Person",
    name:
      typeof post.value.author === "object"
        ? `${post.value.author.first_name} ${post.value.author.last_name}`.trim()
        : "Leonardo Costa",
  },
  publisher: {
    "@type": "Person",
    name: "Leonardo Costa",
    logo: {
      "@type": "ImageObject",
      url: `${config.public.siteUrl}/logo.png`,
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${config.public.siteUrl}/${locale.value}/blog/${post.value.slug}`,
  },

  timeRequired: `${post.value.reading_time || 5}M`,
  wordCount: getWordCount(post.value.body || ""),
  articleBody: getArticleBody(post.value.body || ""),
  ...(getCategoryName(post.value.category) && {
    articleSection: getCategoryName(post.value.category),
  }),
  ...(post.value.tags?.length && {
    keywords: post.value.tags
      .map((tag) => (typeof tag === "object" ? tag.name : ""))
      .filter(Boolean)
      .join(", "),
  }),
  inLanguage: locale.value === "pt-br" ? "pt-BR" : "en-US",
  ...(post.value.view_count && {
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ReadAction",
        userInteractionCount: post.value.view_count,
      },
    ],
  }),
});

// Breadcrumbs
const breadcrumbItems = computed(() => {
  const items: BreadcrumbItem[] = [
    { title: t("nav.home"), to: "/" },
    { title: t("nav.blog"), to: "/blog" },
  ];

  if (post.value?.category && typeof post.value.category === "object") {
    items.push({
      title: post.value.category.name,
      to: `/blog/category/${post.value.category.slug}`,
    });
  }

  items.push({
    title: post.value?.title || "",
    disabled: true,
  });

  return items;
});

const sharePost = (platform: string) => {
  const url = window.location.href;
  const title = post.value?.title || "";

  const urls: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
  };

  if (urls[platform]) {
    window.open(urls[platform], "_blank", "width=600,height=400");
  }
};

const copyLink = () => {
  navigator.clipboard.writeText(window.location.href);
};
</script>

<template>
  <div v-if="post" class="blog-post-page">
    <!-- Post Header -->
    <v-container class="post-header-section">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <Breadcrumbs :items="breadcrumbItems" />
          <div class="post-header">
            <!-- Category Badge -->
            <div class="post-meta-top">
              <span
                v-if="getCategoryName(post.category)"
                class="post-category-badge"
              >
                {{ getCategoryName(post.category) }}
              </span>
              <span class="post-date">{{
                formatYearMonthDay(post.published_at, locale)
              }}</span>
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
                  {{ post.reading_time }} {{ t("blog.readingTime") }}
                </span>
                <span
                  class="post-stat"
                  :class="{ 'view-counted': viewCounted }"
                >
                  <v-icon size="18">mdi-eye-outline</v-icon>
                  {{ localViewCount }} {{ t("blog.views") }}
                </span>
              </div>

              <!-- Share Buttons -->
              <div class="share-buttons">
                <v-btn
                  size="small"
                  variant="text"
                  icon
                  @click="sharePost('twitter')"
                  title="Compartilhar no Twitter"
                >
                  <v-icon>mdi-twitter</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  icon
                  @click="sharePost('facebook')"
                  title="Compartilhar no Facebook"
                >
                  <v-icon>mdi-facebook</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  icon
                  @click="sharePost('linkedin')"
                  title="Compartilhar no LinkedIn"
                >
                  <v-icon>mdi-linkedin</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  icon
                  @click="sharePost('whatsapp')"
                  title="Compartilhar no WhatsApp"
                >
                  <v-icon>mdi-whatsapp</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  icon
                  @click="copyLink"
                  title="Copiar link"
                >
                  <v-icon>mdi-link-variant</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Featured Image -->
    <v-container v-if="coverImage" class="post-featured-image">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <div
            style="
              aspect-ratio: 16 / 9;
              width: 100%;
              overflow: hidden;
              border-radius: 16px;
            "
          >
            <NuxtImg
              :src="coverImage.file"
              class="featured-image"
              format="webp"
              :alt="coverImage.alt_text || post.title"
              sizes="(max-width: 800px) 100vw, 800px"
              :width="coverImage.width || undefined"
              :height="coverImage.height || undefined"
              :placeholder="true"
              :quality="80"
              :fit="'cover'"
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
              "
            />
          </div>
          <p v-if="coverImage.caption" class="image-caption">
            {{ coverImage.caption }}
          </p>
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

    <!-- Image Gallery -->
    <v-container v-if="galleryImages.length > 0" class="gallery-section">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <BlogImageGallery :images="galleryImages" />
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
    <v-container
      v-if="filteredRelatedPosts.length"
      class="related-posts-section"
    >
      <v-row justify="center">
        <v-col cols="12">
          <h2 class="section-title text-center mb-12 fade-up">
            {{ t("blog.relatedPosts") }}
          </h2>
        </v-col>
      </v-row>

      <v-row>
        <v-col
          v-for="relatedPost in filteredRelatedPosts"
          :key="relatedPost.id"
          cols="12"
          md="4"
          class="fade-up"
        >
          <div class="related-post-card">
            <NuxtLink :to="localePath(`/blog/${relatedPost.slug}`)">
              <NuxtImg
                :src="getRelatedPostCoverImage(relatedPost.id)"
                class="related-post-image"
                format="webp"
                :alt="relatedPost.title"
                sizes="(max-width: 600px) 100vw, 400px"
                width="400"
                height="250"
                :placeholder="true"
                :quality="80"
                :fit="'cover'"
                style="
                  width: 100%;
                  aspect-ratio: 16 / 10;
                  object-fit: cover;
                  object-position: center;
                "
              />
            </NuxtLink>

            <div class="related-post-content">
              <span
                v-if="getCategoryName(relatedPost.category)"
                class="related-post-category"
              >
                {{ getCategoryName(relatedPost.category) }}
              </span>

              <NuxtLink
                :to="localePath(`/blog/${relatedPost.slug}`)"
                class="related-post-title-link"
              >
                <h3 class="related-post-title">{{ relatedPost.title }}</h3>
              </NuxtLink>

              <p class="related-post-excerpt">{{ relatedPost.excerpt }}</p>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Back to Blog -->
    <v-container class="back-section mt-6">
      <v-row justify="center">
        <v-col cols="12" class="text-center">
          <v-btn
            size="large"
            variant="outlined"
            color="grey-darken-2"
            class="text-none"
            :to="localePath('/blog')"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            {{ t("common.backToBlog") }}
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
  transition: all 0.3s ease;
}

.post-stat.view-counted {
  color: #2563eb;
  font-weight: 600;
}

.post-stat.view-counted .v-icon {
  animation: pulse 1s ease-in-out;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
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

.image-caption {
  margin-top: 12px;
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  font-style: italic;
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
  font-family: "Courier New", monospace;
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

/* Gallery and Comments */
.gallery-section,
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
  .gallery-section,
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
  .gallery-section,
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
