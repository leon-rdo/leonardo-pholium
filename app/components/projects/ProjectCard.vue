<script setup lang="ts">
/**
 * Project card for the /projects grid (uniform sizing).
 * Different from `ProjectList.vue` — that one is the home featured bento;
 * this one is what fills the all-projects page.
 */
import type { Project, Skill } from '~/types/portfolio';
import { Github, Globe, Star } from 'lucide-vue-next';

const props = defineProps<{
  project: Project<{ skills: true }>;
  /** Position of the card in the grid; cycles a small palette of gradients
   *  so projects without a `cover` image don't all look the same. */
  index?: number;
}>();

const gradients = [
  'from-emerald-600/40 via-emerald-700/30 to-emerald-900/40',
  'from-amber-500/40 via-orange-600/30 to-orange-700/40',
  'from-blue-600/40 via-indigo-700/30 to-indigo-900/40',
  'from-rose-500/40 via-rose-700/30 to-rose-900/40',
  'from-violet-500/40 via-purple-600/30 to-purple-800/40',
  'from-teal-500/40 via-cyan-600/30 to-cyan-800/40',
];

const gradient = computed(() => gradients[(props.index ?? 0) % gradients.length]);

const yearOf = (project: Project<{ skills: true }>): number =>
  new Date(project.start_date || project.created_at).getFullYear();

const skills = computed(() => {
  const list = props.project.skills;
  return Array.isArray(list)
    ? (list.filter((s) => typeof s === 'object') as Skill[])
    : [];
});
</script>

<template>
  <Tile
    variant="card"
    :ring="true"
    class="px-3 py-3 group fade-up h-full flex flex-col"
    as="article"
  >
    <!-- Cover image / gradient -->
    <div
      class="relative rounded-card overflow-hidden aspect-[16/10] bg-gradient-to-br"
      :class="gradient"
    >
      <NuxtImg
        v-if="project.cover"
        :src="project.cover"
        :alt="project.title"
        :width="600"
        :height="375"
        format="webp"
        loading="lazy"
        decoding="async"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div
        v-if="project.featured"
        class="absolute top-3 left-3 inline-flex items-center gap-1 font-mono text-[11.5px] bg-accent-soft text-accent-2 dark:text-accent border border-accent/20 px-2.5 py-[3px] rounded-chip"
      >
        <Star :size="11" :stroke-width="2" />
        {{ $t('projects.featured') }}
      </div>
    </div>

    <!-- Body -->
    <div class="flex flex-col flex-1 px-3 sm:px-4 pt-5 pb-3">
      <div class="font-mono-rail">
        {{ yearOf(project) }}
        <template v-if="project.repo_url || project.website_url">
          · {{ project.website_url ? 'live' : 'repo' }}
        </template>
      </div>
      <h3 class="text-[19px] font-bold mt-1.5 group-hover:text-accent transition-colors">
        {{ project.title }}
      </h3>
      <p class="mt-2 text-[14.5px] text-ink-2 leading-[1.65] flex-1 line-clamp-3">
        {{ project.summary }}
      </p>
      <div v-if="skills.length" class="mt-4 flex flex-wrap gap-1.5">
        <Chip
          v-for="skill in skills.slice(0, 4)"
          :key="skill.id"
          variant="default"
        >
          {{ skill.name }}
        </Chip>
        <span
          v-if="skills.length > 4"
          class="font-mono text-[11px] text-ink-3 px-1 py-1"
        >
          +{{ skills.length - 4 }}
        </span>
      </div>
      <div
        v-if="project.website_url || project.repo_url"
        class="mt-4 flex items-center gap-3 pt-4 border-t border-line text-[13px]"
      >
        <a
          v-if="project.website_url"
          :href="project.website_url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-ink-2 hover:text-accent transition-colors"
          @click.stop
        >
          <Globe :size="14" :stroke-width="1.8" />
          {{ $t('projects.website') }}
        </a>
        <a
          v-if="project.repo_url"
          :href="project.repo_url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-ink-2 hover:text-accent transition-colors"
          @click.stop
        >
          <Github :size="14" :stroke-width="1.8" />
          {{ $t('projects.code') }}
        </a>
      </div>
    </div>
  </Tile>
</template>
