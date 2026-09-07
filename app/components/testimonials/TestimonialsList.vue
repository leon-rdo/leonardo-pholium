<script setup lang="ts">
/**
 * Testimonials — bento grid layout (1 large + 1 smaller per row).
 * Replaces the legacy carousel; carousels rotate readers away from
 * content they wanted to compare.
 *
 * Backend contract unchanged: /api/testimonials/ list, ordered by `order`.
 */
import type { DjangoListResponse } from '~/types/api';
import type { Testimonial } from '~/types/content';

const { t } = useI18n();

const { data: testimonials } = await useApi<DjangoListResponse<Testimonial>>(
  '/api/testimonials/',
  { params: { ordering: 'order', limit: 6 } },
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
    <!-- Pair tiles up: even index → large (col-7) ; next → small (col-5).
         For odd-count tails the large stretches across both. -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
      <template v-for="(item, idx) in items" :key="item.id">
        <Tile
          v-if="idx % 2 === 0"
          :aurora="true"
          :class="[
            idx === items.length - 1 ? 'md:col-span-12' : 'md:col-span-7',
            'px-7 py-7 fade-up',
          ]"
          as="figure"
        >
          <div
            class="h-display text-7xl font-extrabold text-accent leading-none"
            aria-hidden="true"
          >
            "
          </div>
          <blockquote class="text-[16.5px] sm:text-[18px] leading-[1.6] text-ink mt-3">
            {{ item.text }}
          </blockquote>
          <figcaption class="mt-6 flex items-center gap-3">
            <div
              v-if="!item.photo"
              class="w-10 h-10 rounded-full bg-night text-night-text grid place-items-center font-mono text-[12px] font-bold"
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
              class="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div class="text-[14.5px] font-medium">{{ item.author_name }}</div>
              <div class="font-mono-rail">
                {{ item.author_role
                }}<template v-if="item.company"> · {{ item.company }}</template>
              </div>
            </div>
          </figcaption>
        </Tile>

        <Tile
          v-else
          class="md:col-span-5 px-6 py-6 fade-up"
          as="figure"
        >
          <blockquote class="text-[15.5px] leading-[1.65] text-ink">
            <span class="font-mono text-ink-3" aria-hidden="true">/* </span>
            {{ item.text }}
            <span class="font-mono text-ink-3" aria-hidden="true">*/</span>
          </blockquote>
          <figcaption class="mt-5 flex items-center gap-3">
            <div
              v-if="!item.photo"
              class="w-9 h-9 rounded-full bg-night text-night-text grid place-items-center font-mono text-[12px] font-bold"
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
              class="w-9 h-9 rounded-full object-cover"
            />
            <div>
              <div class="text-[14px] font-medium">{{ item.author_name }}</div>
              <div class="font-mono-rail">
                {{ item.author_role
                }}<template v-if="item.company"> · {{ item.company }}</template>
              </div>
            </div>
          </figcaption>
        </Tile>
      </template>
    </div>
  </div>

  <div v-else class="py-12 text-center text-ink-3">
    {{ t('testimonials.empty', 'Nenhum depoimento disponível.') }}
  </div>
</template>
