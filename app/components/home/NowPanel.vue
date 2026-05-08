<script setup lang="ts">
/**
 * "Currently" bento — six tiles that signal the site is alive.
 *
 *   building (col-5)  ·  reading (col-3)  ·  listening (col-2)  ·  learning (col-2)
 *   last published (col-7)                ·  where (col-5)
 *
 * Hydrated from ContentBlocks with these keys (all optional — sensible
 * fallbacks come from i18n):
 *
 *   now_building_title       now_listening_title
 *   now_building_description now_listening_description
 *   now_building_meta        now_learning_title
 *   now_reading_title        now_learning_description
 *   now_reading_subtitle     now_where_title
 *   now_reading_progress     now_where_subtitle
 *   now_published_title      now_where_meta
 *   now_published_excerpt    now_where_temp
 *   now_published_url        now_where_weather
 *   now_updated_at
 */
import type { ContentBlock } from '~/types/content';
import { ArrowUpRight } from 'lucide-vue-next';

interface Props {
  contentBlocks: ContentBlock[];
}
const props = defineProps<Props>();

const { t } = useI18n();

const blockText = (key: string, fallback?: string) =>
  props.contentBlocks.find((b) => b.key === key)?.text || fallback;

const buildingTitle = computed(() =>
  blockText('now_building_title', t('home.now.building.titleFallback')),
);
const buildingDescription = computed(() =>
  blockText('now_building_description', t('home.now.building.descriptionFallback')),
);
const buildingMeta = computed(() => blockText('now_building_meta', '14h ago · main'));

const readingTitle = computed(() =>
  blockText('now_reading_title', t('home.now.reading.titleFallback')),
);
const readingSubtitle = computed(() =>
  blockText('now_reading_subtitle', t('home.now.reading.subtitleFallback')),
);
const readingProgressRaw = computed(() => blockText('now_reading_progress', '42'));
const readingProgress = computed(() => {
  const n = Number(readingProgressRaw.value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
});

const listeningTitle = computed(() =>
  blockText('now_listening_title', t('home.now.listening.titleFallback')),
);
const listeningSubtitle = computed(() =>
  blockText('now_listening_subtitle', t('home.now.listening.subtitleFallback')),
);

const learningTitle = computed(() =>
  blockText('now_learning_title', t('home.now.learning.titleFallback')),
);
const learningSubtitle = computed(() =>
  blockText('now_learning_subtitle', t('home.now.learning.subtitleFallback')),
);

const publishedTitle = computed(() =>
  blockText('now_published_title', t('home.now.published.titleFallback')),
);
const publishedExcerpt = computed(() =>
  blockText('now_published_excerpt', t('home.now.published.excerptFallback')),
);
const publishedMeta = computed(() =>
  blockText('now_published_meta', t('home.now.published.metaFallback')),
);
const publishedUrl = computed(() => blockText('now_published_url', '#'));

const whereTitle = computed(() =>
  blockText('now_where_title', t('home.now.where.titleFallback')),
);
const whereSubtitle = computed(() =>
  blockText('now_where_subtitle', t('home.now.where.subtitleFallback')),
);
const whereMeta = computed(() => blockText('now_where_meta'));
const whereTemp = computed(() => blockText('now_where_temp'));
const whereWeather = computed(() => blockText('now_where_weather'));

const updatedAt = computed(() =>
  blockText('now_updated_at', t('home.now.updatedFallback')),
);
</script>

<template>
  <section class="relative">
    <div class="max-w-[1280px] mx-auto px-6 py-6">
      <header class="flex items-center justify-between mb-3">
        <div class="flex items-baseline gap-3">
          <SectionLabel index="01" :name="$t('home.now.label')" />
          <span class="font-mono text-[11px] text-ink-3 inline-flex items-center gap-1.5">
            <span class="relative flex w-1.5 h-1.5">
              <span class="absolute inset-0 rounded-full bg-status-ok opacity-40 animate-ping" />
              <span class="relative w-1.5 h-1.5 rounded-full bg-status-ok" />
            </span>
            {{ updatedAt }}
          </span>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
        <!-- Building -->
        <Tile :aurora="true" class="md:col-span-5 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.building.label')" tone="accent" />
          <h3 class="text-[18px] font-semibold mt-2">{{ buildingTitle }}</h3>
          <p class="text-[13.5px] text-ink-2 mt-1.5 leading-[1.6]">{{ buildingDescription }}</p>
          <dl
            class="mt-3 grid grid-cols-[max-content_1fr] gap-y-1.5 gap-x-3 font-mono text-[12px] text-ink-2"
          >
            <dt class="text-ink-3">last commit</dt>
            <dd>
              <span class="text-status-ok">●</span>
              <span class="ml-1">{{ buildingMeta }}</span>
            </dd>
            <dt class="text-ink-3">stage</dt>
            <dd>{{ $t('home.now.building.stage') }}</dd>
          </dl>
        </Tile>

        <!-- Reading -->
        <Tile class="md:col-span-3 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.reading.label')" tone="accent" />
          <h3 class="text-[15.5px] font-semibold mt-2 leading-[1.3]">{{ readingTitle }}</h3>
          <p class="text-[12.5px] text-ink-2 mt-1">{{ readingSubtitle }}</p>
          <div class="mt-3 h-1 bg-line/70 rounded-full overflow-hidden">
            <div class="h-full bg-accent rounded-full" :style="{ width: `${readingProgress}%` }" />
          </div>
          <div class="mt-2 font-mono text-[11px] text-ink-3">{{ readingProgress }}%</div>
        </Tile>

        <!-- Listening -->
        <Tile class="md:col-span-2 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.listening.label')" tone="accent" />
          <h3 class="text-[14.5px] font-semibold mt-2 leading-[1.25]">{{ listeningTitle }}</h3>
          <p class="text-[12.5px] text-ink-2 mt-1">{{ listeningSubtitle }}</p>
        </Tile>

        <!-- Learning -->
        <Tile class="md:col-span-2 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.learning.label')" tone="accent" />
          <h3 class="text-[14.5px] font-semibold mt-2 leading-[1.25]">{{ learningTitle }}</h3>
          <p class="text-[12.5px] text-ink-2 mt-1">{{ learningSubtitle }}</p>
        </Tile>

        <!-- Last published -->
        <Tile class="md:col-span-7 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.published.label')" tone="accent" />
          <a
            :href="publishedUrl"
            class="block group"
            :target="publishedUrl?.startsWith('http') ? '_blank' : undefined"
            :rel="publishedUrl?.startsWith('http') ? 'noopener noreferrer' : undefined"
          >
            <h3
              class="text-[18px] font-semibold mt-2 group-hover:text-accent transition-colors flex items-start gap-2"
            >
              {{ publishedTitle }}
              <ArrowUpRight
                :size="16"
                :stroke-width="2"
                class="text-ink-3 group-hover:text-accent group-hover:translate-x-0.5 transition mt-1 shrink-0"
              />
            </h3>
            <p class="text-[13px] text-ink-2 mt-2 leading-[1.6]">{{ publishedExcerpt }}</p>
            <div class="mt-3 font-mono text-[11.5px] text-ink-3">{{ publishedMeta }}</div>
          </a>
        </Tile>

        <!-- Where -->
        <Tile :aurora="true" class="md:col-span-5 px-5 py-5 fade-up">
          <div class="flex items-center justify-between gap-4">
            <div>
              <SectionLabel :name="$t('home.now.where.label')" tone="accent" />
              <h3 class="text-[16px] font-semibold mt-2">{{ whereTitle }}</h3>
              <p class="text-[12.5px] text-ink-2 mt-1">{{ whereSubtitle }}</p>
              <p v-if="whereMeta" class="font-mono text-[11px] text-ink-3 mt-2">
                {{ whereMeta }}
              </p>
            </div>
            <div v-if="whereTemp" class="text-right shrink-0">
              <div class="font-mono tabular-nums text-accent text-[34px] font-bold h-display">
                {{ whereTemp }}
              </div>
              <div v-if="whereWeather" class="font-mono-rail mt-1">{{ whereWeather }}</div>
            </div>
          </div>
        </Tile>
      </div>
    </div>
  </section>
</template>
