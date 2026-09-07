<script setup lang="ts">
import { ArrowRight, FolderOpen } from 'lucide-vue-next';
import type { DjangoListResponse } from '~/types/api';
import type { ContentBlock } from '~/types/content';
import type { Project, Skill } from '~/types/portfolio';
import ProjectCard from '~/components/projects/ProjectCard.vue';
import Breadcrumbs from '~/components/common/Breadcrumbs.vue';
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs';


const config = useRuntimeConfig();
const { locale, t } = useI18n();
const localePath = useLocalePath();

// Page-scoped ContentBlocks
const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
  'projects-content-blocks',
  '/api/content-blocks/',
  { page_name: 'projects' },
);
const getContentBlock = (key: string) =>
  contentBlocks.value?.results?.find((b) => b.key === key);

// All published projects
const { data: projects } = await useApi<
  DjangoListResponse<Project<{ tags: true; skills: true; author: true }>>
>('/api/projects/', {
  params: { expand: 'skills', limit: 100, status: 'published' },
});

// Breadcrumbs
const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { title: t('nav.home'), to: '/' },
  { title: t('projects.title'), disabled: true },
]);

// SEO
const { setSeoMeta, setStructuredData } = useSeo();
setSeoMeta({
  title: getContentBlock('seo_title')?.text || t('projects.title'),
  description:
    getContentBlock('seo_description')?.text || t('projects.subtitle'),
  image:
    getContentBlock('seo_image')?.text ||
    `${config.public.siteUrl}/og-default.jpg`,
  type: 'website',
});

const projectsUrl = computed(
  () => `${config.public.siteUrl}/${locale.value}/projects`,
);

watchEffect(() => {
  const list = projects.value?.results || [];
  setStructuredData([
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${projectsUrl.value}#collection`,
      name: getContentBlock('hero_title')?.text || t('projects.title'),
      description:
        getContentBlock('hero_subtitle')?.text || t('projects.subtitle'),
      url: projectsUrl.value,
      inLanguage: locale.value === 'pt-br' ? 'pt-BR' : 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${config.public.siteUrl}/#website`,
        url: config.public.siteUrl,
        name: 'Leonardo Costa',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: list.length,
      // No /projects/{slug} detail pages exist — @id/url must not advertise
      // URLs that 404. Anchor each item to the list page instead; url only
      // when the project has a real external site.
      itemListElement: list.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          '@id': `${projectsUrl.value}#project-${project.id}`,
          name: project.title,
          description: project.summary,
          ...(project.website_url && { url: project.website_url }),
          image: project.cover || undefined,
          dateCreated: project.start_date || undefined,
          dateModified: project.updated_at,
          author: {
            '@type': 'Person',
            name: 'Leonardo Costa',
            url: config.public.siteUrl,
          },
          keywords: project.skills
            ?.map((skill: Skill) =>
              typeof skill === 'object' ? skill.name : '',
            )
            .filter(Boolean)
            .join(', '),
          ...(project.repo_url && { codeRepository: project.repo_url }),
        },
      })),
    },
  ]);
});

// Filtering by skill name
const selectedFilter = ref('all');

const filters = computed(() => {
  const set = new Set<string>();
  projects.value?.results?.forEach((project) => {
    project.skills?.forEach((skill: Skill) => {
      if (typeof skill === 'object' && skill.name) set.add(skill.name);
    });
  });
  return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
});

const filteredProjects = computed(() => {
  const all = projects.value?.results || [];
  if (selectedFilter.value === 'all') return all;
  return all.filter((project) =>
    project.skills?.some(
      (skill: Skill) =>
        typeof skill === 'object' && skill.name === selectedFilter.value,
    ),
  );
});

useFadeUp();
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative">
      <AuroraBg :intensity="0.4" />
      <div class="relative max-w-[1280px] mx-auto px-6 pt-12 pb-10">
        <Breadcrumbs :items="breadcrumbItems" class="mb-6" />
        <SectionLabel index="01" :name="$t('projects.label')" />
        <h1 class="h-display text-[48px] sm:text-[64px] lg:text-[80px] font-bold mt-3 leading-[1.02]">
          {{ getContentBlock('hero_title')?.text || $t('projects.title') }}
        </h1>
        <p class="mt-6 text-[16px] sm:text-[17px] text-ink-2 leading-[1.65] max-w-[640px]">
          {{ getContentBlock('hero_subtitle')?.text || $t('projects.subtitle') }}
        </p>
      </div>
    </section>

    <!-- Filters -->
    <section>
      <div class="max-w-[1280px] mx-auto px-6 pb-6 flex items-center gap-3 overflow-x-auto">
        <span class="font-mono-rail shrink-0">{{ $t('projects.filterLabel') }}</span>
        <div class="flex flex-wrap gap-1.5 fade-up">
          <button
            v-for="filter in filters"
            :key="filter"
            type="button"
            :class="[
              'inline-flex items-center font-mono text-[11.5px] tracking-[0.04em] px-2.5 py-[5px]',
              'rounded-chip border transition-colors capitalize',
              selectedFilter === filter
                ? 'bg-accent-soft text-accent-2 dark:text-accent border-accent/20'
                : 'bg-card text-ink-2 hover:text-ink hover:bg-card-soft border-line',
            ]"
            @click="selectedFilter = filter"
          >
            {{ filter === 'all' ? $t('common.all') : filter }}
          </button>
        </div>
      </div>
    </section>

    <!-- Grid -->
    <section>
      <div class="max-w-[1280px] mx-auto px-6 pb-16">
        <div
          v-if="filteredProjects.length"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <ProjectCard
            v-for="(project, idx) in filteredProjects"
            :key="project.id"
            :project="project"
            :index="idx"
          />
        </div>

        <div
          v-else
          class="flex flex-col items-center text-center py-16 text-ink-3 fade-up"
        >
          <FolderOpen :size="48" :stroke-width="1.4" class="text-ink-4" />
          <p class="text-[16px] mt-4">{{ $t('projects.noProjectsFound') }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="px-6 pb-12">
      <div
        class="max-w-[1280px] mx-auto rounded-tile bg-night text-night-text relative overflow-hidden fade-up"
      >
        <div
          aria-hidden="true"
          class="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style="background: radial-gradient(closest-side, rgba(44, 103, 232, 0.4), transparent 70%)"
        />
        <div
          class="relative px-8 sm:px-12 py-14 sm:py-16 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
        >
          <div class="md:col-span-8">
            <SectionLabel index="" :name="$t('home.contact.label')" />
            <h2 class="h-display text-[32px] sm:text-[44px] font-bold mt-2">
              {{ getContentBlock('cta_title')?.text || $t('projects.ctaTitle') }}
            </h2>
            <p class="mt-4 text-[15.5px] text-night-text/70 leading-[1.65] max-w-[520px]">
              {{ getContentBlock('cta_subtitle')?.text || $t('projects.ctaSubtitle') }}
            </p>
          </div>
          <div class="md:col-span-4 md:justify-self-end">
            <NuxtLink
              :to="localePath('/#contact')"
              class="inline-flex items-center justify-center gap-2 bg-accent text-night-text font-semibold px-6 py-3.5 rounded-input hover:bg-accent-2 glow-blue transition-colors"
            >
              {{ getContentBlock('cta_button')?.text || $t('projects.ctaButton') }}
              <ArrowRight :size="16" :stroke-width="2" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
