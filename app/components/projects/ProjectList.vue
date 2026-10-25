<script setup lang="ts">
/**
 * Featured projects:
 *   col-span-12 featured card (cover beside the copy on md+, links inline)
 *   col-span-6 + col-span-6 below for the next two
 *
 * Backend contract unchanged: hits /api/projects/ via useApi (DRF expand=skills).
 * `projects` prop is preserved for the "Projects page" use-case where the list
 * is provided by the parent.
 */
import type { DjangoListResponse } from '~/types/api';
import type { Project } from '~/types/portfolio';
import { Github, Globe, Star } from 'lucide-vue-next';

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

const localePath = useLocalePath();

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

</script>

<template>
  <div v-if="items.length" class="grid grid-cols-1 md:grid-cols-12 gap-3">
    <!-- Featured (first item) — full-width tile, cover beside the copy on
         md+. The copy used to sit on the cover under a scrim: over a product
         screenshot it collided with the product's own marketing text, and at
         390px the 16:9 box clipped the title. The title links to the
         project page; its ::after stretches over the whole card, and the
         external action links sit above that layer (relative z-10). -->
    <Tile
      v-if="items[0]"
      variant="card"
      :ring="true"
      class="md:col-span-12 px-3 py-3 group fade-up grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6"
      as="article"
    >
      <div
        class="md:col-span-7 relative aspect-[16/10] rounded-card overflow-hidden bg-gradient-to-br"
        :class="gradientFor(0)"
      >
        <NuxtImg
          v-if="items[0].cover"
          :src="items[0].cover"
          alt=""
          :width="800"
          :height="500"
          sizes="sm:100vw md:60vw xl:720px"
          format="webp"
          loading="lazy"
          decoding="async"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <Chip variant="blue" class="absolute top-4 left-4">
          <Star :size="11" :stroke-width="2" />
          {{ $t('projects.featured') }}
        </Chip>
      </div>

      <div
        class="md:col-span-5 flex flex-col px-3 sm:px-4 md:px-0 md:pr-4 pt-2 pb-3 md:py-4"
      >
        <div class="font-mono-rail">
          {{ yearOf(items[0]) }}
          <template v-if="items[0].website_url">
            · {{ hostname(items[0].website_url) }}
          </template>
        </div>
        <h3 class="h-display text-3xl sm:text-4xl font-bold mt-1.5">
          <NuxtLink
            :to="localePath(`/projects/${items[0].slug}`)"
            class="after:absolute after:inset-0 group-hover:text-accent transition-colors"
          >
            {{ items[0].title }}
          </NuxtLink>
        </h3>
        <p class="mt-3 text-[15px] text-ink-2 leading-[1.65]">
          {{ items[0].summary }}
        </p>
        <div v-if="items[0].skills.length" class="mt-4 flex flex-wrap gap-1.5">
          <Chip v-for="skill in items[0].skills.slice(0, 5)" :key="skill.id">
            {{ skill.name }}
          </Chip>
        </div>
        <div
          v-if="items[0].website_url || items[0].repo_url"
          class="mt-auto pt-6 flex items-center gap-4 text-[13.5px]"
        >
          <a
            v-if="items[0].website_url"
            :href="items[0].website_url"
            target="_blank"
            rel="noopener noreferrer"
            class="relative z-10 inline-flex items-center gap-1.5 py-2 -my-2 text-ink-2 hover:text-accent transition-colors"
          >
            <Globe :size="14" :stroke-width="1.8" />
            {{ $t('projects.website') }}
          </a>
          <a
            v-if="items[0].repo_url"
            :href="items[0].repo_url"
            target="_blank"
            rel="noopener noreferrer"
            class="relative z-10 inline-flex items-center gap-1.5 py-2 -my-2 text-ink-2 hover:text-accent transition-colors"
          >
            <Github :size="14" :stroke-width="1.8" />
            {{ $t('projects.code') }}
          </a>
        </div>
      </div>
    </Tile>

    <!-- Items 2 & 3 — same anatomy as the featured tile, one size down. -->
    <Tile
      v-for="(project, idx) in items.slice(1)"
      :key="project.id"
      variant="card"
      :ring="true"
      class="md:col-span-6 px-3 py-3 group fade-up flex flex-col"
      as="article"
    >
      <div
        class="relative aspect-[16/9] rounded-card overflow-hidden bg-gradient-to-br"
        :class="gradientFor(idx + 1)"
      >
        <NuxtImg
          v-if="project.cover"
          :src="project.cover"
          alt=""
          :width="600"
          :height="338"
          sizes="sm:100vw md:620px"
          format="webp"
          loading="lazy"
          decoding="async"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <div class="flex flex-col flex-1 px-3 sm:px-4 pt-5 pb-3">
        <div class="font-mono-rail">
          {{ yearOf(project) }}
          <template v-if="project.website_url">
            · {{ hostname(project.website_url) }}
          </template>
        </div>
        <h3 class="h-display text-2xl font-bold mt-1.5">
          <NuxtLink
            :to="localePath(`/projects/${project.slug}`)"
            class="after:absolute after:inset-0 group-hover:text-accent transition-colors"
          >
            {{ project.title }}
          </NuxtLink>
        </h3>
        <p class="mt-2 text-[14.5px] text-ink-2 leading-[1.65] line-clamp-2">
          {{ project.summary }}
        </p>
        <div v-if="project.skills.length" class="mt-4 flex flex-wrap gap-1.5">
          <Chip v-for="skill in project.skills.slice(0, 3)" :key="skill.id">
            {{ skill.name }}
          </Chip>
        </div>
      </div>
    </Tile>
  </div>
</template>
