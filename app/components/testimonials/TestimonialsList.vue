<script setup lang="ts">
/**
 * Testimonials.
 *
 *   - default: bento grid (1 large + 1 smaller per row) with the full text —
 *     used on /about, which holds the whole set.
 *   - `compact`: equal columns, text clamped — the home shows a few and links
 *     to /about. The full quotes ran ~2,000px on desktop and 4,000px on
 *     mobile, the longest valley on the page.
 *
 * Backend contract unchanged: /api/testimonials/ list, ordered by `order`.
 */
import type { DjangoListResponse } from '~/types/api';
import type { Testimonial } from '~/types/content';

const props = withDefaults(
  defineProps<{
    /** How many testimonials to request. */
    limit?: number;
    compact?: boolean;
  }>(),
  { limit: 6, compact: false },
);

const { t } = useI18n();

const { data: testimonials } = await useApi<DjangoListResponse<Testimonial>>(
  '/api/testimonials/',
  { params: { ordering: 'order', limit: props.limit } },
);

const items = computed<Testimonial[]>(() => testimonials.value?.results ?? []);

// Initials for avatar fallback when no `photo` is set.
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('') || '?';
</script>

<template>
  <div v-if="items.length">
    <!-- Compact: equal columns, clamped quotes. -->
    <div v-if="compact" class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Tile
        v-for="item in items"
        :key="item.id"
        class="px-6 py-6 flex flex-col justify-between gap-6 fade-up"
        as="figure"
      >
        <blockquote class="text-[15.5px] leading-[1.65] text-ink line-clamp-6">
          {{ item.text }}
        </blockquote>
        <figcaption class="flex items-center gap-3">
          <div
            v-if="!item.photo"
            class="shrink-0 w-9 h-9 rounded-full bg-night text-night-text grid place-items-center font-mono text-[12px] font-bold"
            aria-hidden="true"
          >
            {{ initials(item.author_name) }}
          </div>
          <NuxtImg
            v-else
            :src="item.photo"
            :alt="$t('a11y.authorPhoto', { name: item.author_name })"
            :width="36"
            :height="36"
            format="webp"
            loading="lazy"
            decoding="async"
            class="shrink-0 w-9 h-9 rounded-full object-cover"
          />
          <div class="min-w-0">
            <div class="text-[14px] font-medium">{{ item.author_name }}</div>
            <div class="text-[12.5px] text-ink-3">
              {{ item.author_role
              }}<template v-if="item.company"> · {{ item.company }}</template>
            </div>
          </div>
        </figcaption>
      </Tile>
    </div>

    <!-- Full: pair tiles up — even index → large (col-7), next → small
         (col-5). For odd-count tails the large stretches across both. -->
    <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
      <template v-for="(item, idx) in items" :key="item.id">
        <Tile
          :class="[
            idx % 2 === 0
              ? idx === items.length - 1
                ? 'md:col-span-12'
                : 'md:col-span-7'
              : 'md:col-span-5',
            'px-7 py-7 fade-up',
          ]"
          as="figure"
        >
          <blockquote
            :class="[
              'leading-[1.6] text-ink',
              idx % 2 === 0 ? 'text-[16.5px] sm:text-[18px]' : 'text-[15.5px]',
            ]"
          >
            {{ item.text }}
          </blockquote>
          <figcaption class="mt-6 flex items-center gap-3">
            <div
              v-if="!item.photo"
              class="shrink-0 w-10 h-10 rounded-full bg-night text-night-text grid place-items-center font-mono text-[12px] font-bold"
              aria-hidden="true"
            >
              {{ initials(item.author_name) }}
            </div>
            <NuxtImg
              v-else
              :src="item.photo"
              :alt="$t('a11y.authorPhoto', { name: item.author_name })"
              :width="40"
              :height="40"
              format="webp"
              loading="lazy"
              decoding="async"
              class="shrink-0 w-10 h-10 rounded-full object-cover"
            />
            <div class="min-w-0">
              <div class="text-[14.5px] font-medium">{{ item.author_name }}</div>
              <div class="text-[12.5px] text-ink-3">
                {{ item.author_role
                }}<template v-if="item.company"> · {{ item.company }}</template>
              </div>
            </div>
          </figcaption>
        </Tile>
      </template>
    </div>
  </div>

  <div v-else-if="!compact" class="py-12 text-center text-ink-3">
    {{ t('testimonials.empty') }}
  </div>
</template>
