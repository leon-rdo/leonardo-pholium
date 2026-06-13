<script setup lang="ts">
/**
 * Post card primitive used by /blog and /blog/category.
 *
 *   - `featured` mode renders a two-column wide card (image left, copy right)
 *   - default renders a single-column card with cover + summary
 */
import type { Post, Category } from '~/types/blog';
import { ArrowUpRight, Clock, Eye, Pin } from 'lucide-vue-next';
import { formatYearMonthDay } from '~/utils/date';

const props = defineProps<{
  post: Post;
  /** Categories the page already loaded — used to resolve a label when the
   *  post's `category` field is just a numeric id. */
  categories?: Category[];
  featured?: boolean;
}>();

const { locale } = useI18n();
const localePath = useLocalePath();

const categoryName = computed(() => {
  const cat = props.post.category;
  if (!cat) return '';
  if (typeof cat === 'object') return (cat as Category).name;
  return props.categories?.find((c) => c.id === cat)?.name ?? '';
});

const coverImage = computed(() => {
  const cover = props.post.images?.find((img) => img.image_type === 'cover');
  return cover?.thumbnail || cover?.file || '';
});

const postHref = computed(() => localePath(`/blog/${props.post.slug}`));
</script>

<template>
  <article :class="featured ? 'group fade-up' : 'group fade-up h-full'">
    <Tile
      v-if="featured"
      class="px-3 py-3 grid grid-cols-1 md:grid-cols-12 gap-3"
    >
      <!-- Cover -->
      <NuxtLink
        :to="postHref"
        class="md:col-span-5 block rounded-card overflow-hidden bg-card-soft relative aspect-[16/10]"
      >
        <NuxtImg
          v-if="coverImage"
          :src="coverImage"
          :alt="post.title"
          :width="640"
          :height="400"
          format="webp"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div
          class="absolute top-3 left-3 inline-flex items-center gap-1 font-mono text-[11.5px] bg-accent-soft text-accent-2 dark:text-accent border border-accent/20 px-2.5 py-[3px] rounded-chip"
        >
          <Pin :size="11" :stroke-width="2" />
          {{ $t('common.featured', 'Destaque') }}
        </div>
      </NuxtLink>

      <!-- Copy -->
      <div class="md:col-span-7 flex flex-col px-2 sm:px-3 py-2">
        <div class="font-mono-rail flex items-center gap-2 flex-wrap">
          <span v-if="categoryName" class="text-accent">{{ categoryName }}</span>
          <span v-if="categoryName" class="text-ink-4">·</span>
          <time :datetime="post.published_at">{{ formatYearMonthDay(post.published_at, locale) }}</time>
        </div>
        <NuxtLink :to="postHref" class="block">
          <h2
            class="h-display text-[26px] sm:text-[32px] font-bold mt-2 group-hover:text-accent transition-colors"
          >
            {{ post.title }}
          </h2>
        </NuxtLink>
        <p
          v-if="post.excerpt"
          class="mt-3 text-[15px] sm:text-[16px] text-ink-2 leading-[1.7] line-clamp-3"
        >
          {{ post.excerpt }}
        </p>
        <div class="mt-auto pt-5 flex items-center justify-between gap-4">
          <div class="flex items-center gap-4 text-[12.5px] text-ink-3 font-mono">
            <span class="inline-flex items-center gap-1">
              <Clock :size="13" :stroke-width="1.8" />
              {{ post.reading_time }} min
            </span>
            <span class="inline-flex items-center gap-1">
              <Eye :size="13" :stroke-width="1.8" />
              {{ post.view_count }}
            </span>
          </div>
          <NuxtLink
            :to="postHref"
            class="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-2 group-hover:text-accent transition-colors"
          >
            {{ $t('common.readMore') }}
            <ArrowUpRight
              :size="14"
              :stroke-width="2"
              class="group-hover:translate-x-0.5 transition-transform"
            />
          </NuxtLink>
        </div>
      </div>
    </Tile>

    <!-- Default (grid) variant -->
    <Tile v-else class="px-3 py-3 h-full flex flex-col">
      <NuxtLink
        :to="postHref"
        class="block rounded-card overflow-hidden bg-card-soft relative aspect-[16/10]"
      >
        <NuxtImg
          v-if="coverImage"
          :src="coverImage"
          :alt="post.title"
          :width="600"
          :height="375"
          format="webp"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </NuxtLink>
      <div class="flex flex-col flex-1 px-3 sm:px-4 pt-5 pb-3">
        <div class="font-mono-rail flex items-center gap-2 flex-wrap">
          <span v-if="categoryName" class="text-accent">{{ categoryName }}</span>
          <span v-if="categoryName" class="text-ink-4">·</span>
          <time :datetime="post.published_at">{{ formatYearMonthDay(post.published_at, locale) }}</time>
        </div>
        <NuxtLink :to="postHref" class="block">
          <h3
            class="text-[18px] sm:text-[20px] font-bold mt-2 group-hover:text-accent transition-colors leading-[1.3]"
          >
            {{ post.title }}
          </h3>
        </NuxtLink>
        <p
          v-if="post.excerpt"
          class="mt-2.5 text-[14.5px] text-ink-2 leading-[1.65] flex-1 line-clamp-3"
        >
          {{ post.excerpt }}
        </p>
        <div
          class="mt-4 pt-4 border-t border-line flex items-center justify-between gap-3 text-[12.5px] text-ink-3 font-mono"
        >
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1">
              <Clock :size="13" :stroke-width="1.8" />
              {{ post.reading_time }} min
            </span>
            <span class="inline-flex items-center gap-1">
              <Eye :size="13" :stroke-width="1.8" />
              {{ post.view_count }}
            </span>
          </div>
          <NuxtLink
            :to="postHref"
            class="inline-flex items-center gap-1 text-ink-2 group-hover:text-accent transition-colors"
          >
            {{ $t('common.readMore') }}
            <ArrowUpRight
              :size="13"
              :stroke-width="2"
              class="group-hover:translate-x-0.5 transition-transform"
            />
          </NuxtLink>
        </div>
      </div>
    </Tile>
  </article>
</template>
