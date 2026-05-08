<script setup lang="ts">
/**
 * "Tools, by layer." — three tiles grouping skills by category.
 *
 * The `Skill` type from the Django backend doesn't have a category field
 * yet, so categorization happens here by name pattern. When the backend
 * adds a `category` field, replace `categorize()` with a direct read.
 *
 * Each row also stores extra metadata (years, projects/notes) that the
 * backend doesn't model — kept inline until a more expressive type lands.
 */
import type { ContentBlock } from '~/types/content';
import type { DjangoListResponse } from '~/types/api';
import type { Skill } from '~/types/portfolio';

interface Props {
  contentBlocks: ContentBlock[];
}
defineProps<Props>();

const { t } = useI18n();

interface StackRow {
  name: string;
  years: string;
  meta: string;
}
interface StackGroup {
  label: string;
  title: string;
  rows: StackRow[];
}

// We still hit /api/skills/ so the data shape is retained — but we layer
// our own grouping/metadata on top, since the backend Skill model is too
// thin to drive the new layout faithfully.
const { data: skillsData } = await useApi<DjangoListResponse<Skill>>('/api/skills/', {
  params: { limit: 24, ordering: '-level' },
});

const skillNames = computed(() =>
  (skillsData.value?.results || []).map((s) => s.name.toLowerCase()),
);
const has = (needle: string) => skillNames.value.some((n) => n.includes(needle));

// Hardcoded stack metadata. Lives here (not in the backend) because:
// (a) the Skill model has no `years` / `notes` / `category` fields, and
// (b) this is meant as a curated narrative ("what I reach for daily"),
// not the full skills inventory the admin keeps elsewhere.
const groups = computed<StackGroup[]>(() => {
  return [
    {
      label: t('home.stack.backend.label'),
      title: t('home.stack.backend.title'),
      rows: [
        { name: 'Django + DRF', years: '3y', meta: '8 proj' },
        { name: 'PostgreSQL', years: '3y', meta: 'prod daily' },
        { name: 'Python · Celery', years: '3y', meta: 'ETL/jobs' },
        ...(has('openai') || has('langchain')
          ? [{ name: 'OpenAI · LangChain', years: '1y', meta: 'LLM ops' }]
          : []),
      ],
    },
    {
      label: t('home.stack.frontend.label'),
      title: t('home.stack.frontend.title'),
      rows: [
        { name: 'Vue · Nuxt', years: '2y', meta: 'SSR · i18n' },
        { name: 'Next.js', years: '1y', meta: 'app router' },
        { name: 'Tailwind / TS', years: '2y', meta: '' },
      ],
    },
    {
      label: t('home.stack.infra.label'),
      title: t('home.stack.infra.title'),
      rows: [
        { name: 'Docker · Compose', years: '3y', meta: '' },
        { name: 'Linux VPS', years: '3y', meta: 'nginx' },
        { name: 'GH Actions', years: '2y', meta: '' },
      ],
    },
  ];
});
</script>

<template>
  <section>
    <div class="max-w-[1280px] mx-auto px-6 pb-6 pt-2">
      <header class="flex items-end justify-between mb-4">
        <div>
          <SectionLabel index="03" :name="$t('home.stack.label')" />
          <h2 class="h-display text-[36px] sm:text-[40px] font-bold mt-2">
            {{ $t('home.stack.title') }}
          </h2>
        </div>
        <span class="font-mono-rail">{{ $t('home.stack.tagline') }}</span>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
        <Tile
          v-for="(group, idx) in groups"
          :key="group.label"
          :aurora="idx === 0"
          :class="[
            'px-7 py-7 fade-up',
            idx === 0 ? 'md:col-span-5' : idx === 1 ? 'md:col-span-4' : 'md:col-span-3',
          ]"
        >
          <SectionLabel :name="group.label" tone="accent" />
          <h3 class="h-display text-[24px] font-bold mt-2 mb-5">{{ group.title }}</h3>
          <ul class="divide-y divide-line">
            <li
              v-for="row in group.rows"
              :key="row.name"
              class="flex items-baseline justify-between gap-2 py-2.5"
            >
              <span class="font-medium">{{ row.name }}</span>
              <span class="font-mono text-[12px] text-ink-3 whitespace-nowrap">
                {{ row.years }}<template v-if="row.meta"> · {{ row.meta }}</template>
              </span>
            </li>
          </ul>
        </Tile>
      </div>
    </div>
  </section>
</template>
