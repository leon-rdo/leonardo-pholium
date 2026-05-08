<script setup lang="ts">
/**
 * Featured projects bento grid:
 *   col-span-8 (featured card with cover + glass label) + col-span-4 (stack stack panel)
 *   col-span-6 + col-span-6 below for the next two
 *
 * Backend contract unchanged: hits /api/projects/ via useApi (DRF expand=skills).
 * `projects` prop is preserved for the "Projects page" use-case where the list
 * is provided by the parent.
 */
import type { DjangoListResponse } from '~/types/api';
import type { Project } from '~/types/portfolio';
import { ArrowUpRight, Github, Globe } from 'lucide-vue-next';

const props = defineProps<{
  featuredOnly?: boolean;
  projects?: Project<{ skills: true }>[];
  limit?: number;
}>();

const { data: fetchedProjects } = props.projects
  ? { data: ref(null) }
  : await useApi<DjangoListResponse<Project<{ skills: true }>>>('/api/projects/', {
      params: {
        expand: 'skills',
        ...(props.featuredOnly !== false && { featured: true }),
        limit: props.limit ?? 3,
        status: 'published',
      },
    });

const items = computed<Project<{ skills: true }>[]>(() => {
  if (props.projects) return props.projects;
  return fetchedProjects.value?.results ?? [];
});

// Background gradient palettes per project, picked from a small set so cards
// don't all blur into the same color when the cover image is missing.
const gradients = [
  'from-emerald-600/40 via-emerald-700/30 to-emerald-900/40',
  'from-amber-500/40 via-orange-600/30 to-orange-700/40',
  'from-blue-600/40 via-indigo-700/30 to-indigo-900/40',
  'from-rose-500/40 via-rose-700/30 to-rose-900/40',
];
const gradientFor = (idx: number) => gradients[idx % gradients.length];

// `URL` is a JS global, not auto-exposed to Vue templates — extract here.
const hostname = (raw: string | null | undefined): string => {
  if (!raw) return '';
  try {
    return new URL(raw).hostname;
  } catch {
    return raw;
  }
};

const yearOf = (project: Project<{ skills: true }>): number =>
  new Date(project.start_date || project.created_at).getFullYear();

const authorFirstName = (project: Project<{ skills: true }>): string => {
  const author = project.author;
  if (author && typeof author === 'object' && 'first_name' in author)
    return (author as { first_name: string }).first_name;
  return '';
};
</script>

<template>
  <div v-if="items.length" class="grid grid-cols-1 md:grid-cols-12 gap-3">
    <!-- Featured (first item) — wide tile -->
    <Tile
      v-if="items[0]"
      variant="card"
      :ring="true"
      class="md:col-span-8 px-3 py-3 group fade-up"
      as="article"
    >
      <NuxtLink
        :to="items[0].website_url"
        :external="!!items[0].website_url"
        :target="items[0].website_url ? '_blank' : undefined"
        :rel="items[0].website_url ? 'noopener noreferrer' : undefined"
        class="block relative h-full rounded-card overflow-hidden"
      >
        <div
          class="aspect-[16/9] bg-gradient-to-br relative"
          :class="gradientFor(0)"
        >
          <NuxtImg
            v-if="items[0].cover"
            :src="items[0].cover"
            :alt="items[0].title"
            :width="800"
            :height="450"
            format="webp"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent" />

          <Chip variant="blue" class="absolute top-4 left-4">
            ★ {{ $t('projects.featured') }}
          </Chip>
          <div
            v-if="items[0].website_url"
            class="absolute top-4 right-4 font-mono text-[11.5px] text-paper/80"
          >
            {{ hostname(items[0].website_url) }} ↗
          </div>

          <div class="absolute bottom-5 left-5 right-5 text-paper">
            <div class="font-mono-rail !text-paper/80">
              {{ yearOf(items[0]) }}
              <template v-if="authorFirstName(items[0])"> · {{ authorFirstName(items[0]) }}</template>
            </div>
            <h3 class="h-display text-3xl sm:text-4xl font-bold mt-1.5 text-paper">
              {{ items[0].title }}
            </h3>
            <p class="mt-3 text-[14.5px] sm:text-[15px] text-paper/85 leading-[1.65] max-w-[560px]">
              {{ items[0].summary }}
            </p>
            <div class="mt-4 flex flex-wrap gap-1.5">
              <span
                v-for="skill in items[0].skills.slice(0, 4)"
                :key="skill.id"
                class="inline-flex items-center font-mono text-[11px] bg-ink/40 backdrop-blur-sm text-paper/90 border border-white/10 px-2.5 py-0.5 rounded-chip"
              >
                {{ skill.name }}
              </span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </Tile>

    <!-- Right column for the featured: actions / external links -->
    <div v-if="items[0]" class="md:col-span-4 flex flex-col gap-3 fade-up">
      <Tile class="px-5 py-5 grow flex flex-col">
        <SectionLabel :name="$t('projects.actionsLabel')" tone="accent" />
        <div class="mt-3 space-y-2 flex-1">
          <a
            v-if="items[0].website_url"
            :href="items[0].website_url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-between gap-3 px-3.5 py-3 rounded-input ring-hair bg-paper hover:bg-card-soft transition-colors group/link"
          >
            <span class="inline-flex items-center gap-2.5 font-medium">
              <Globe :size="16" :stroke-width="1.8" />
              {{ $t('projects.website') }}
            </span>
            <ArrowUpRight
              :size="14"
              :stroke-width="2"
              class="text-ink-3 group-hover/link:text-accent group-hover/link:translate-x-0.5 transition"
            />
          </a>
          <a
            v-if="items[0].repo_url"
            :href="items[0].repo_url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-between gap-3 px-3.5 py-3 rounded-input ring-hair bg-paper hover:bg-card-soft transition-colors group/link"
          >
            <span class="inline-flex items-center gap-2.5 font-medium">
              <Github :size="16" :stroke-width="1.8" />
              {{ $t('projects.code') }}
            </span>
            <ArrowUpRight
              :size="14"
              :stroke-width="2"
              class="text-ink-3 group-hover/link:text-accent group-hover/link:translate-x-0.5 transition"
            />
          </a>
        </div>
      </Tile>

      <Tile class="px-5 py-5 bg-ink text-paper relative overflow-hidden">
        <div
          aria-hidden="true"
          class="absolute -top-10 -right-10 w-40 h-40 rounded-full"
          style="background: radial-gradient(closest-side, rgba(44, 103, 232, 0.5), transparent 70%)"
        />
        <div class="relative">
          <div class="font-mono-rail !text-paper/60">{{ $t('projects.techLabel') }}</div>
          <div class="h-display text-xl font-bold mt-1">
            {{ items[0].skills.slice(0, 2).map((s) => s.name).join(' · ') }}
          </div>
          <div class="text-[12.5px] text-paper/60 mt-1">
            {{ items[0].skills.length }} {{ $t('projects.toolsCount') }}
          </div>
        </div>
      </Tile>
    </div>

    <!-- Items 2 & 3 — wide cards side by side -->
    <Tile
      v-for="(project, idx) in items.slice(1)"
      :key="project.id"
      variant="card"
      :ring="true"
      class="md:col-span-6 px-3 py-3 group fade-up"
      as="article"
    >
      <NuxtLink
        :to="project.website_url"
        :external="!!project.website_url"
        :target="project.website_url ? '_blank' : undefined"
        :rel="project.website_url ? 'noopener noreferrer' : undefined"
        class="block relative h-full rounded-card overflow-hidden"
      >
        <div
          class="aspect-[16/9] bg-gradient-to-br relative"
          :class="gradientFor(idx + 1)"
        >
          <NuxtImg
            v-if="project.cover"
            :src="project.cover"
            :alt="project.title"
            :width="600"
            :height="375"
            format="webp"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/15 to-transparent" />

          <div class="absolute bottom-5 left-5 right-5 text-paper">
            <div class="font-mono-rail !text-paper/80">
              {{ yearOf(project) }}
            </div>
            <h3 class="h-display text-2xl font-bold mt-1.5 text-paper">{{ project.title }}</h3>
            <p class="mt-2 text-[14px] text-paper/85 leading-[1.6] line-clamp-2">
              {{ project.summary }}
            </p>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <span
                v-for="skill in project.skills.slice(0, 3)"
                :key="skill.id"
                class="inline-flex items-center font-mono text-[11px] bg-ink/40 backdrop-blur-sm text-paper/90 border border-white/10 px-2.5 py-0.5 rounded-chip"
              >
                {{ skill.name }}
              </span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </Tile>
  </div>
</template>
