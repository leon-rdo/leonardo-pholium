<script setup lang="ts">
/**
 * "Currently" bento — six tiles that signal the site is alive.
 *
 *   building (col-5)  ·  reading (col-3)  ·  listening (col-2)  ·  learning (col-2)
 *   last published (col-7)                ·  where (col-5)
 *
 * Every tile is fully backend-driven (no AI-mocked fallback content) —
 * a tile renders only if its title ContentBlock is present, and the
 * whole section is hidden when no `now_*` blocks are configured.
 *
 * Recognised ContentBlock keys (page_name="home"):
 *   now_updated_at
 *   now_building_title       (required to render the building tile)
 *   now_building_description
 *   now_building_meta        — "last commit" sub-line
 *   now_building_stage       — "stage" sub-line
 *   now_reading_title        (required for reading)
 *   now_reading_subtitle
 *   now_reading_progress     — number 0-100
 *   now_listening_title      (required for listening)
 *   now_listening_subtitle
 *   now_learning_title       (required for learning)
 *   now_learning_subtitle
 *   now_published_title      (required for last-published)
 *   now_published_excerpt
 *   now_published_meta
 *   now_published_url
 *   now_where_title          (required for where)
 *   now_where_subtitle
 *   now_where_meta
 *   now_where_temp
 *   now_where_weather
 */
import type { ContentBlock } from '~/types/content';
import { ArrowUpRight } from 'lucide-vue-next';

interface Props {
  contentBlocks: ContentBlock[];
}
const props = defineProps<Props>();

const blockText = (key: string) =>
  props.contentBlocks.find((b) => b.key === key)?.text || '';

// Building
const buildingTitle = computed(() => blockText('now_building_title'));
const buildingDescription = computed(() => blockText('now_building_description'));
const buildingMeta = computed(() => blockText('now_building_meta'));
const buildingStage = computed(() => blockText('now_building_stage'));

// Reading
const readingTitle = computed(() => blockText('now_reading_title'));
const readingSubtitle = computed(() => blockText('now_reading_subtitle'));
const readingProgress = computed(() => {
  const raw = blockText('now_reading_progress');
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
});

// Listening
const listeningTitle = computed(() => blockText('now_listening_title'));
const listeningSubtitle = computed(() => blockText('now_listening_subtitle'));

// Learning
const learningTitle = computed(() => blockText('now_learning_title'));
const learningSubtitle = computed(() => blockText('now_learning_subtitle'));

// Last published
const publishedTitle = computed(() => blockText('now_published_title'));
const publishedExcerpt = computed(() => blockText('now_published_excerpt'));
const publishedMeta = computed(() => blockText('now_published_meta'));
const publishedUrl = computed(() => blockText('now_published_url'));

// Where
const whereTitle = computed(() => blockText('now_where_title'));
const whereSubtitle = computed(() => blockText('now_where_subtitle'));
const whereMeta = computed(() => blockText('now_where_meta'));
const whereTemp = computed(() => blockText('now_where_temp'));
const whereWeather = computed(() => blockText('now_where_weather'));

const updatedAt = computed(() => blockText('now_updated_at'));

// Section visibility — hide entirely if nothing is configured.
const hasAny = computed(
  () =>
    !!buildingTitle.value ||
    !!readingTitle.value ||
    !!listeningTitle.value ||
    !!learningTitle.value ||
    !!publishedTitle.value ||
    !!whereTitle.value,
);
</script>

<template>
  <section v-if="hasAny" class="relative">
    <div class="max-w-[1280px] mx-auto px-6 py-6">
      <header class="flex items-center justify-between mb-3">
        <div class="flex items-baseline gap-3">
          <SectionLabel index="01" :name="$t('home.now.label')" />
          <span
            v-if="updatedAt"
            class="font-mono text-[11px] text-ink-3 inline-flex items-center gap-1.5"
          >
            <span class="relative flex w-1.5 h-1.5">
              <span
                class="absolute inset-0 rounded-full bg-status-ok opacity-40 animate-ping"
              />
              <span class="relative w-1.5 h-1.5 rounded-full bg-status-ok" />
            </span>
            {{ updatedAt }}
          </span>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
        <!-- Building -->
        <Tile v-if="buildingTitle" :aurora="true" class="md:col-span-5 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.building.label')" tone="accent" />
          <h3 class="text-[18px] font-semibold mt-2">{{ buildingTitle }}</h3>
          <p
            v-if="buildingDescription"
            class="text-[13.5px] text-ink-2 mt-1.5 leading-[1.6]"
          >
            {{ buildingDescription }}
          </p>
          <dl
            v-if="buildingMeta || buildingStage"
            class="mt-3 grid grid-cols-[max-content_1fr] gap-y-1.5 gap-x-3 font-mono text-[12px] text-ink-2"
          >
            <template v-if="buildingMeta">
              <dt class="text-ink-3">last commit</dt>
              <dd>
                <span class="text-status-ok">●</span>
                <span class="ml-1">{{ buildingMeta }}</span>
              </dd>
            </template>
            <template v-if="buildingStage">
              <dt class="text-ink-3">stage</dt>
              <dd>{{ buildingStage }}</dd>
            </template>
          </dl>
        </Tile>

        <!-- Reading -->
        <Tile v-if="readingTitle" class="md:col-span-3 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.reading.label')" tone="accent" />
          <h3 class="text-[15.5px] font-semibold mt-2 leading-[1.3]">
            {{ readingTitle }}
          </h3>
          <p v-if="readingSubtitle" class="text-[12.5px] text-ink-2 mt-1">
            {{ readingSubtitle }}
          </p>
          <template v-if="readingProgress !== null">
            <div class="mt-3 h-1 bg-line/70 rounded-full overflow-hidden">
              <div
                class="h-full bg-accent rounded-full"
                :style="{ width: `${readingProgress}%` }"
              />
            </div>
            <div class="mt-2 font-mono text-[11px] text-ink-3">
              {{ readingProgress }}%
            </div>
          </template>
        </Tile>

        <!-- Listening -->
        <Tile v-if="listeningTitle" class="md:col-span-2 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.listening.label')" tone="accent" />
          <h3 class="text-[14.5px] font-semibold mt-2 leading-[1.25]">
            {{ listeningTitle }}
          </h3>
          <p v-if="listeningSubtitle" class="text-[12.5px] text-ink-2 mt-1">
            {{ listeningSubtitle }}
          </p>
        </Tile>

        <!-- Learning -->
        <Tile v-if="learningTitle" class="md:col-span-2 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.learning.label')" tone="accent" />
          <h3 class="text-[14.5px] font-semibold mt-2 leading-[1.25]">
            {{ learningTitle }}
          </h3>
          <p v-if="learningSubtitle" class="text-[12.5px] text-ink-2 mt-1">
            {{ learningSubtitle }}
          </p>
        </Tile>

        <!-- Last published -->
        <Tile v-if="publishedTitle" class="md:col-span-7 px-5 py-5 fade-up">
          <SectionLabel :name="$t('home.now.published.label')" tone="accent" />
          <component
            :is="publishedUrl ? 'a' : 'div'"
            :href="publishedUrl || undefined"
            :target="publishedUrl?.startsWith('http') ? '_blank' : undefined"
            :rel="publishedUrl?.startsWith('http') ? 'noopener noreferrer' : undefined"
            class="block group"
          >
            <h3
              class="text-[18px] font-semibold mt-2 group-hover:text-accent transition-colors flex items-start gap-2"
            >
              {{ publishedTitle }}
              <ArrowUpRight
                v-if="publishedUrl"
                :size="16"
                :stroke-width="2"
                class="text-ink-3 group-hover:text-accent group-hover:translate-x-0.5 transition mt-1 shrink-0"
              />
            </h3>
            <p
              v-if="publishedExcerpt"
              class="text-[13px] text-ink-2 mt-2 leading-[1.6]"
            >
              {{ publishedExcerpt }}
            </p>
            <div
              v-if="publishedMeta"
              class="mt-3 font-mono text-[11.5px] text-ink-3"
            >
              {{ publishedMeta }}
            </div>
          </component>
        </Tile>

        <!-- Where -->
        <Tile v-if="whereTitle" :aurora="true" class="md:col-span-5 px-5 py-5 fade-up">
          <div class="flex items-center justify-between gap-4">
            <div>
              <SectionLabel :name="$t('home.now.where.label')" tone="accent" />
              <h3 class="text-[16px] font-semibold mt-2">{{ whereTitle }}</h3>
              <p v-if="whereSubtitle" class="text-[12.5px] text-ink-2 mt-1">
                {{ whereSubtitle }}
              </p>
              <p
                v-if="whereMeta"
                class="font-mono text-[11px] text-ink-3 mt-2"
              >
                {{ whereMeta }}
              </p>
            </div>
            <div v-if="whereTemp" class="text-right shrink-0">
              <div class="font-mono tabular-nums text-accent text-[34px] font-bold h-display">
                {{ whereTemp }}
              </div>
              <div v-if="whereWeather" class="font-mono-rail mt-1">
                {{ whereWeather }}
              </div>
            </div>
          </div>
        </Tile>
      </div>
    </div>
  </section>
</template>
