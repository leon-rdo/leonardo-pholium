<script setup lang="ts">
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Eye,
  Facebook,
  Link2,
  Linkedin,
  Twitter,
} from 'lucide-vue-next';
import type { DjangoListResponse } from '~/types/api';
import type { Post, Category } from '~/types/blog';
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs';
import BlogComments from '~/components/blog/BlogComments.vue';
import BlogImageGallery from '~/components/blog/BlogImageGallery.vue';
import Breadcrumbs from '~/components/common/Breadcrumbs.vue';
import { formatYearMonthDay } from '~/utils/date';


const localePath = useLocalePath();
const { locale, t } = useI18n();
const route = useRoute();
const config = useRuntimeConfig();
const slug = route.params.slug as string;

// Post by slug — images come expanded on the post itself; a separate
// /api/images/?content_type= query needed a ContentType id the frontend
// doesn't know (config.public.postContentType was never defined).
const { data: posts } = await useApi<
  DjangoListResponse<
    Post<{ category: true; author: true; tags: true; images: true }>
  >
>('/api/posts/', {
  params: { translations__slug: slug, expand: 'category,series,tags,images' },
});

const post = computed(() => posts.value?.results?.[0]);
if (!post.value) {
  throw createError({ statusCode: 404, message: t('errors.post_not_found') });
}

// Fetch the same post by id in the alternate locale to get the translated slug,
// so hreflang points to a real URL (slugs differ per language). Querying by
// `translations__slug` won't work cross-locale, because Django filters that
// against the active language's translation only.
const otherLocale = locale.value === 'pt-br' ? 'en-us' : 'pt-br';
const postId = post.value.id;
const { data: altPost } = await useAsyncData(
  `post-alt-slug-${otherLocale}-${postId}`,
  () =>
    $fetch<Pick<Post, 'id' | 'slug'>>(`/api/posts/${postId}/`, {
      baseURL: config.public.apiBase,
      headers: { 'Accept-Language': otherLocale },
    }).catch(() => null),
);

const altSlug = computed(() => altPost.value?.slug || post.value?.slug);

// Teach the header language switcher the translated slug — switchLocalePath
// otherwise keeps the current slug and /en-us/blog/<pt-slug> 404s.
const setI18nParams = useSetI18nParams();
setI18nParams({
  [locale.value]: { slug },
  [otherLocale]: { slug: altSlug.value },
});

if (!altPost.value && import.meta.server) {
  console.warn(
    `[blog] alt-locale slug fetch failed for post id=${postId} (${otherLocale}); falling back to current slug for hreflang`,
  );
}

const localViewCount = ref(post.value.view_count);
const { viewCounted } = usePostViewTracking(
  computed(() => post.value?.id || 0),
  { minReadTime: 3000 },
);
watch(viewCounted, (counted) => {
  if (counted && post.value)
    localViewCount.value = post.value.view_count + 1;
});

// Images attached to the post (cover + gallery)
const postImages = computed(() => post.value?.images || []);
const coverImage = computed(() =>
  postImages.value.find((img) => img.image_type === 'cover'),
);
const galleryImages = computed(() =>
  postImages.value
    .filter((img) => img.image_type === 'gallery' || img.image_type === 'document')
    .sort((a, b) => a.order - b.order),
);

// Related posts — images expanded inline so thumbnails render during SSR
// (they were previously fetched in onMounted and invisible to crawlers).
const { data: relatedPostsData } = await useApi<
  DjangoListResponse<Post<{ category: true; images: true }>>
>('/api/posts/published/', {
  params: {
    category: post.value.category?.id,
    limit: 4,
    expand: 'category,images',
  },
});
const filteredRelatedPosts = computed(
  () =>
    relatedPostsData.value?.results
      ?.filter((p) => p.id !== post.value?.id)
      .slice(0, 3) || [],
);

useFadeUp();

// Helpers
const getCoverImageUrl = () =>
  coverImage.value?.file ||
  coverImage.value?.thumbnail ||
  `${config.public.siteUrl}/og-default.jpg`;

const getRelatedPostCoverImage = (postId: number) => {
  const images =
    filteredRelatedPosts.value.find((p) => p.id === postId)?.images || [];
  const cover = images.find((img) => img.image_type === 'cover');
  return cover?.thumbnail || cover?.file || '';
};

const getCategoryName = (category: number | Category | null) => {
  if (!category) return '';
  return typeof category === 'object' ? category.name : '';
};

const getWordCount = (html: string) => {
  const text = html.replace(/<[^>]*>/g, ' ').trim();
  return text.split(/\s+/).filter(Boolean).length;
};
const getArticleBody = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);

// SEO
const { setSeoMeta, setStructuredData } = useSeo();
setSeoMeta({
  title: post.value.seo_title || post.value.title,
  description: post.value.meta_description || post.value.excerpt,
  image: {
    url: getCoverImageUrl(),
    width: coverImage.value?.width || 1200,
    height: coverImage.value?.height || 630,
    alt: coverImage.value?.alt_text || post.value.title,
    type: coverImage.value?.mime_type || 'image/jpeg',
  },
  type: 'article',
  canonicalUrl: post.value.canonical_url || undefined,
  keywords: post.value.tags
    ?.map((tag) => (typeof tag === 'object' ? tag.name : ''))
    .filter(Boolean) as string[] | undefined,
  alternateLanguages: [
    { locale: locale.value, path: `/blog/${post.value.slug}` },
    { locale: otherLocale, path: `/blog/${altSlug.value}` },
  ],
  article: {
    publishedTime: post.value.published_at || undefined,
    modifiedTime: post.value.updated_at,
    author:
      typeof post.value.author === 'object'
        ? `${post.value.author.first_name} ${post.value.author.last_name}`.trim()
        : undefined,
    section: getCategoryName(post.value.category),
    tags: post.value.tags
      ?.map((tag) => (typeof tag === 'object' ? tag.name : ''))
      .filter(Boolean),
  },
});

const postUrl = `${config.public.siteUrl}/${locale.value}/blog/${post.value.slug}`;

setStructuredData([
  {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${postUrl}#article`,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${config.public.siteUrl}/#website`,
    },
    headline: post.value.title,
    alternativeHeadline: post.value.seo_title || undefined,
    description: post.value.meta_description || post.value.excerpt,
    image: {
      '@type': 'ImageObject',
      url: getCoverImageUrl(),
      width: coverImage.value?.width || 1200,
      height: coverImage.value?.height || 630,
    },
    datePublished: post.value.published_at,
    dateModified: post.value.updated_at || post.value.published_at,
    author: { '@id': `${config.public.siteUrl}/#identity` },
    publisher: { '@id': `${config.public.siteUrl}/#identity` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    timeRequired: `PT${post.value.reading_time || 5}M`,
    wordCount: getWordCount(post.value.body || ''),
    articleBody: getArticleBody(post.value.body || ''),
    ...(getCategoryName(post.value.category) && {
      articleSection: getCategoryName(post.value.category),
    }),
    ...(post.value.tags?.length && {
      keywords: post.value.tags
        .map((tag) => (typeof tag === 'object' ? tag.name : ''))
        .filter(Boolean)
        .join(', '),
    }),
    inLanguage: locale.value === 'pt-br' ? 'pt-BR' : 'en-US',
    ...(post.value.view_count && {
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/ReadAction',
          userInteractionCount: post.value.view_count,
        },
      ],
    }),
  },
]);

// Breadcrumbs
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { title: t('nav.home'), to: '/' },
    { title: t('nav.blog'), to: '/blog' },
  ];
  if (post.value?.category && typeof post.value.category === 'object') {
    items.push({
      title: post.value.category.name,
      to: `/blog/category/${post.value.category.slug}`,
    });
  }
  items.push({ title: post.value?.title || '', disabled: true });
  return items;
});

// Share helpers
const { trackEvent } = useAnalytics();
const trackShare = (method: string) =>
  trackEvent('post_share', { share_method: method, content_id: slug });

const sharePost = (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp') => {
  const url = window.location.href;
  const title = post.value?.title || '';
  const urls: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
  };
  if (urls[platform]) {
    trackShare(platform);
    window.open(urls[platform], '_blank', 'width=600,height=400');
  }
};

const linkCopied = ref(false);
const copyLink = async () => {
  await navigator.clipboard.writeText(window.location.href);
  trackShare('copy_link');
  linkCopied.value = true;
  setTimeout(() => (linkCopied.value = false), 2200);
};
</script>

<template>
  <div v-if="post">
    <!-- Header with breadcrumbs + meta + title -->
    <section class="relative">
      <AuroraBg :intensity="0.35" />
      <div
        class="relative max-w-[860px] mx-auto px-6 pt-10 pb-8 fade-up"
      >
        <Breadcrumbs :items="breadcrumbItems" class="mb-6" />

        <!-- Top meta: category + date -->
        <div class="font-mono-rail flex items-center gap-2 flex-wrap">
          <NuxtLink
            v-if="getCategoryName(post.category) && typeof post.category === 'object'"
            :to="localePath(`/blog/category/${post.category.slug}`)"
            class="text-accent hover:text-accent-2 transition-colors"
          >
            {{ getCategoryName(post.category) }}
          </NuxtLink>
          <span v-if="getCategoryName(post.category)" class="text-ink-4">·</span>
          <time :datetime="post.published_at">{{ formatYearMonthDay(post.published_at, locale) }}</time>
        </div>

        <!-- Title + excerpt -->
        <h1 class="h-display text-[36px] sm:text-[48px] lg:text-[56px] font-bold mt-4 leading-[1.06]">
          {{ post.title }}
        </h1>
        <p
          v-if="post.excerpt"
          class="mt-5 text-[17px] sm:text-[18px] text-ink-2 leading-[1.65]"
        >
          {{ post.excerpt }}
        </p>

        <!-- Bottom meta + share -->
        <div
          class="mt-7 pt-5 border-t border-line flex items-center justify-between gap-4 flex-wrap"
        >
          <div class="flex items-center gap-5 text-[13px] text-ink-3 font-mono">
            <span class="inline-flex items-center gap-1.5">
              <Clock :size="14" :stroke-width="1.8" />
              {{ post.reading_time }} {{ $t('blog.readingTime') }}
            </span>
            <span
              :class="[
                'inline-flex items-center gap-1.5 transition-colors',
                viewCounted ? 'text-accent' : '',
              ]"
            >
              <Eye :size="14" :stroke-width="1.8" />
              {{ localViewCount }} {{ $t('blog.views') }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="p-2 rounded text-ink-3 hover:text-ink hover:bg-card transition-colors"
              :title="$t('blog.shareOn') + ' Twitter / X'"
              @click="sharePost('twitter')"
            >
              <Twitter :size="16" :stroke-width="1.8" />
            </button>
            <button
              type="button"
              class="p-2 rounded text-ink-3 hover:text-ink hover:bg-card transition-colors"
              :title="$t('blog.shareOn') + ' Facebook'"
              @click="sharePost('facebook')"
            >
              <Facebook :size="16" :stroke-width="1.8" />
            </button>
            <button
              type="button"
              class="p-2 rounded text-ink-3 hover:text-ink hover:bg-card transition-colors"
              :title="$t('blog.shareOn') + ' LinkedIn'"
              @click="sharePost('linkedin')"
            >
              <Linkedin :size="16" :stroke-width="1.8" />
            </button>
            <button
              type="button"
              :class="[
                'inline-flex items-center gap-1.5 ml-1 p-2 rounded text-[12px] font-mono transition-colors',
                linkCopied ? 'text-accent' : 'text-ink-3 hover:text-ink hover:bg-card',
              ]"
              :title="$t('common.copyLink')"
              @click="copyLink"
            >
              <Link2 :size="16" :stroke-width="1.8" />
              <span v-if="linkCopied">{{ $t('common.copied', 'copiado') }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Cover image -->
    <section v-if="coverImage" class="px-6 pb-10">
      <div class="max-w-[1100px] mx-auto fade-up">
        <figure class="rounded-tile overflow-hidden ring-hair">
          <NuxtImg
            :src="coverImage.file"
            :alt="coverImage.alt_text || post.title"
            :width="coverImage.width || 1200"
            :height="coverImage.height || 675"
            sizes="(max-width: 800px) 100vw, 1100px"
            format="webp"
            :placeholder="true"
            :quality="80"
            class="w-full h-auto object-cover aspect-video"
          />
          <figcaption
            v-if="coverImage.caption"
            class="px-4 py-3 font-mono text-[12px] text-ink-3 bg-card-soft text-center"
          >
            {{ coverImage.caption }}
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- Body (markdown rendered server-side).
         Outer wrapper handles width + horizontal padding; inner div
         carries the prose styling. Splitting them avoids the conflict
         where `max-w-none` (needed inside prose to override Tailwind
         Typography's default ~65ch width) would also defeat the
         article's own max-w. -->
    <article class="px-6 fade-up">
      <div class="max-w-[760px] mx-auto">
        <div
          class="prose prose-stone dark:prose-invert max-w-none
                 text-[17px] leading-[1.78]
                 prose-headings:font-bold prose-headings:tracking-[-0.02em]
                 prose-headings:text-ink prose-headings:scroll-mt-20
                 prose-h2:text-[28px] prose-h2:mt-12 prose-h2:mb-4
                 prose-h3:text-[22px] prose-h3:mt-10 prose-h3:mb-3
                 prose-p:text-ink-2 prose-p:my-5
                 prose-strong:text-ink prose-strong:font-semibold
                 prose-a:text-accent prose-a:no-underline hover:prose-a:text-accent-2 prose-a:underline-offset-4 hover:prose-a:underline
                 prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:bg-card-soft/40 prose-blockquote:rounded-r-card prose-blockquote:py-3 prose-blockquote:px-5
                 prose-blockquote:text-ink-2
                 prose-code:font-mono prose-code:text-[14px] prose-code:bg-card-soft prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:hidden prose-code:after:hidden
                 prose-pre:bg-night prose-pre:text-night-text prose-pre:rounded-card
                 prose-img:rounded-card prose-img:ring-1 prose-img:ring-line
                 prose-hr:border-line"
          v-html="post.body"
        />
      </div>
    </article>

    <!-- Image gallery -->
    <section v-if="galleryImages.length > 0" class="px-6 pt-10 pb-4">
      <div class="max-w-[1100px] mx-auto fade-up">
        <BlogImageGallery :images="galleryImages" />
      </div>
    </section>

    <!-- Tags -->
    <section v-if="post.tags?.length" class="px-6 pt-2 pb-4">
      <div class="max-w-[760px] mx-auto fade-up">
        <div class="flex flex-wrap gap-1.5">
          <Chip
            v-for="tag in post.tags"
            :key="typeof tag === 'object' ? tag.id : tag"
            variant="default"
          >
            #{{ typeof tag === 'object' ? tag.name : tag }}
          </Chip>
        </div>
      </div>
    </section>

    <!-- Comments -->
    <section v-if="post.allow_comments" class="px-6 py-10">
      <div class="max-w-[760px] mx-auto fade-up">
        <BlogComments :post-id="post.id" />
      </div>
    </section>

    <!-- Related posts -->
    <section v-if="filteredRelatedPosts.length" class="px-6 py-10">
      <div class="max-w-[1280px] mx-auto">
        <header class="mb-4 fade-up">
          <SectionLabel :name="$t('blog.relatedLabel')" tone="accent" />
          <h2 class="h-display text-[28px] sm:text-[32px] font-bold mt-2">
            {{ $t('blog.relatedPosts') }}
          </h2>
        </header>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NuxtLink
            v-for="rp in filteredRelatedPosts"
            :key="rp.id"
            :to="localePath(`/blog/${rp.slug}`)"
            class="group fade-up"
          >
            <Tile class="px-3 py-3 h-full flex flex-col">
              <div
                class="rounded-card overflow-hidden bg-card-soft relative aspect-[16/10]"
              >
                <NuxtImg
                  v-if="getRelatedPostCoverImage(rp.id)"
                  :src="getRelatedPostCoverImage(rp.id)"
                  :alt="rp.title"
                  :width="600"
                  :height="375"
                  format="webp"
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div class="px-3 sm:px-4 pt-5 pb-3 flex flex-col flex-1">
                <div class="font-mono-rail">
                  <span v-if="getCategoryName(rp.category)" class="text-accent">{{ getCategoryName(rp.category) }}</span>
                </div>
                <h3
                  class="text-[17px] font-bold mt-1.5 group-hover:text-accent transition-colors leading-[1.3]"
                >
                  {{ rp.title }}
                </h3>
                <p
                  v-if="rp.excerpt"
                  class="mt-2 text-[14px] text-ink-2 leading-[1.65] flex-1 line-clamp-3"
                >
                  {{ rp.excerpt }}
                </p>
              </div>
            </Tile>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Back to blog -->
    <section class="px-6 pb-12 pt-4 text-center">
      <NuxtLink
        :to="localePath('/blog')"
        class="inline-flex items-center gap-2 px-5 py-3 rounded-input ring-hair bg-card hover:bg-card-soft text-[14px] font-medium transition-colors"
      >
        <ArrowLeft :size="16" :stroke-width="2" />
        {{ $t('common.backToBlog') }}
      </NuxtLink>
    </section>
  </div>
</template>
