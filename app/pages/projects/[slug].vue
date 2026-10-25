<script setup lang="ts">
/**
 * Project detail — the long `description` (until now only in the Markdown
 * twin) rendered as a readable case study, plus period, stack and links.
 *
 * Slugs are translated per locale ("resolve-cliente" / "customer-resolve"),
 * so the page looks the project up by `translations__slug` and fetches the
 * other locale by id for hreflang and the language switcher — same pattern
 * as blog posts.
 *
 * Projects without a description render too (cards always link here), but
 * are noindexed and left out of the sitemap: a cover and one sentence is a
 * thin page, and Search Console already files those as "not indexed".
 */
import { ArrowLeft, Github, Globe } from 'lucide-vue-next';
import type { DjangoListResponse } from '~/types/api';
import type { Project, Skill } from '~/types/portfolio';
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs';
import Breadcrumbs from '~/components/common/Breadcrumbs.vue';
import { formatShortMonthYearOrPresent } from '~/utils/date';

const route = useRoute();
const slug = route.params.slug as string;
const localePath = useLocalePath();
const { locale, t } = useI18n();
const config = useRuntimeConfig();

const { data: projectsData, error: projectError } = await useApi<
  DjangoListResponse<Project<{ skills: true }>>
>('/api/projects/', {
  params: { translations__slug: slug, status: 'published', expand: 'skills' },
});
throwIfBackendDown(projectError.value);

const project = computed(() => projectsData.value?.results?.[0]);
if (!project.value) {
  throw createError({
    statusCode: 404,
    message: t('errors.projectNotFound'),
    fatal: true,
  });
}

const otherLocale = locale.value === 'pt-br' ? 'en-us' : 'pt-br';
const projectId = project.value.id;
const { data: altProject } = await useAsyncData(
  `project-alt-slug-${otherLocale}-${projectId}`,
  () =>
    $fetch<Pick<Project, 'id' | 'slug'>>(`/api/projects/${projectId}/`, {
      baseURL: config.public.apiBase,
      headers: { 'Accept-Language': otherLocale },
    }).catch(() => null),
);
const altSlug = computed(() => altProject.value?.slug || project.value?.slug);

// Teach the header language switcher the translated slug.
const setI18nParams = useSetI18nParams();
setI18nParams({
  [locale.value]: { slug },
  [otherLocale]: { slug: altSlug.value },
});

const skills = computed<Skill[]>(() =>
  (project.value?.skills ?? []).filter((s): s is Skill => typeof s === 'object'),
);

const description = computed(() => project.value?.description?.trim() || '');
const descriptionIsHtml = computed(() => looksLikeHtml(description.value));
const descriptionBlocks = computed(() =>
  descriptionIsHtml.value ? [] : textToBlocks(description.value),
);

const period = computed(() => {
  const p = project.value;
  if (!p?.start_date) return '';
  const start = formatShortMonthYearOrPresent(p.start_date, locale.value, '');
  const end = formatShortMonthYearOrPresent(
    p.end_date,
    locale.value,
    t('common.present'),
  );
  return `${start} — ${end}`;
});

const hostname = (raw: string) => {
  try {
    return new URL(raw).hostname.replace(/^www\./, '');
  } catch {
    return raw;
  }
};

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { title: t('nav.home'), to: '/' },
  { title: t('projects.title'), to: '/projects' },
  { title: project.value?.title || '', disabled: true },
]);

// SEO
const pageUrl = `${config.public.siteUrl}/${locale.value}/projects/${project.value.slug}`;
const { setSeoMeta, setStructuredData } = useSeo();
setSeoMeta({
  title: project.value.seo_title || project.value.title,
  description: project.value.meta_description || project.value.summary,
  image: project.value.cover
    ? { url: project.value.cover, alt: project.value.title }
    : undefined,
  type: 'article',
  markdown: true,
  noindex: !description.value,
  alternateLanguages: [
    { locale: locale.value, path: `/projects/${project.value.slug}` },
    { locale: otherLocale, path: `/projects/${altSlug.value}` },
  ],
});

setStructuredData([
  {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${pageUrl}#project`,
    name: project.value.title,
    description: project.value.meta_description || project.value.summary,
    url: pageUrl,
    ...(project.value.website_url && { sameAs: project.value.website_url }),
    ...(project.value.cover && { image: project.value.cover }),
    ...(project.value.start_date && { dateCreated: project.value.start_date }),
    dateModified: project.value.updated_at,
    author: { '@id': `${config.public.siteUrl}/#identity` },
    ...(skills.value.length && {
      keywords: skills.value.map((s) => s.name).join(', '),
    }),
    inLanguage: locale.value === 'pt-br' ? 'pt-BR' : 'en-US',
    isPartOf: {
      '@type': 'CollectionPage',
      '@id': `${config.public.siteUrl}/${locale.value}/projects#collection`,
    },
  },
]);
</script>

<template>
  <div v-if="project">
    <!-- Header. Same px-6 + max-w wrapper as the sections below, so the
         title, cover and body share one left edge. Period and links live in
         the facts panel, not in a label above the title. -->
    <section class="px-6">
      <div class="max-w-[1100px] mx-auto pt-10 pb-8">
        <Breadcrumbs :items="breadcrumbItems" class="mb-6" />
        <h1
          class="h-display text-[44px] sm:text-[56px] lg:text-[64px] font-bold leading-[1.02]"
        >
          {{ project.title }}
        </h1>
        <p
          v-if="project.summary"
          class="mt-5 text-[17px] sm:text-[19px] text-ink-2 leading-[1.6] max-w-[64ch]"
        >
          {{ project.summary }}
        </p>
      </div>
    </section>

    <!-- Cover — the page's largest image, so it loads eagerly. -->
    <section v-if="project.cover" class="px-6 pb-10">
      <figure
        class="max-w-[1100px] mx-auto rounded-tile overflow-hidden ring-hair bg-card-soft aspect-[16/10] relative"
      >
        <NuxtImg
          :src="project.cover"
          :alt="$t('projects.coverAlt', { title: project.title })"
          :width="1100"
          :height="688"
          sizes="sm:100vw md:100vw lg:1100px"
          format="webp"
          loading="eager"
          fetchpriority="high"
          decoding="async"
          preload
          class="absolute inset-0 w-full h-full object-cover object-top"
        />
      </figure>
    </section>

    <!-- Body + facts -->
    <section class="px-6 pb-12">
      <div class="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <article v-if="description" class="lg:col-span-8">
          <h2 class="h-display text-[28px] sm:text-[32px] font-bold mb-5">
            {{ $t('projects.aboutProject') }}
          </h2>
          <!-- Saved as HTML in the CMS: trusted, author-written content. -->
          <div
            v-if="descriptionIsHtml"
            class="prose prose-stone dark:prose-invert max-w-[68ch] text-[17px] leading-[1.75] prose-p:text-ink-2 prose-a:text-accent prose-a:underline-offset-4"
            v-html="description"
          />
          <div v-else class="max-w-[68ch] text-[17px] leading-[1.75] text-ink-2 space-y-5">
            <template v-for="(block, idx) in descriptionBlocks" :key="idx">
              <p v-if="block.type === 'p'">{{ block.text }}</p>
              <ul v-else class="space-y-4 pl-5 list-disc marker:text-accent">
                <li v-for="(item, i) in block.items" :key="i" class="pl-1">
                  <strong v-if="item.lead" class="font-semibold text-ink">{{ item.lead }}</strong>
                  <template v-if="item.lead"> — </template>{{ item.text }}
                </li>
              </ul>
            </template>
          </div>
        </article>

        <aside
          :class="[
            description ? 'lg:col-span-4' : 'lg:col-span-12',
            'self-start',
          ]"
        >
          <Tile class="px-6 py-6">
            <dl class="space-y-6">
              <div v-if="period">
                <dt class="font-mono-rail text-[11px]">{{ $t('projects.period') }}</dt>
                <dd class="mt-2 text-[15px] text-ink">
                  <time :datetime="project.start_date || undefined">{{ period }}</time>
                </dd>
              </div>
              <div v-if="skills.length">
                <dt class="font-mono-rail text-[11px]">{{ $t('projects.stack') }}</dt>
                <dd class="mt-2.5">
                  <ul class="flex flex-wrap gap-1.5">
                    <li v-for="skill in skills" :key="skill.id">
                      <Chip>{{ skill.name }}</Chip>
                    </li>
                  </ul>
                </dd>
              </div>
              <div v-if="project.website_url || project.repo_url">
                <dt class="font-mono-rail text-[11px]">{{ $t('projects.links') }}</dt>
                <dd class="mt-2 space-y-1">
                  <a
                    v-if="project.website_url"
                    :href="project.website_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 min-h-11 text-[15px] text-ink-2 hover:text-accent transition-colors"
                  >
                    <Globe :size="16" :stroke-width="1.8" />
                    {{ hostname(project.website_url) }}
                    <span class="sr-only">({{ $t('a11y.opensInNewTab') }})</span>
                  </a>
                  <a
                    v-if="project.repo_url"
                    :href="project.repo_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 min-h-11 text-[15px] text-ink-2 hover:text-accent transition-colors"
                  >
                    <Github :size="16" :stroke-width="1.8" />
                    {{ $t('projects.code') }}
                    <span class="sr-only">({{ $t('a11y.opensInNewTab') }})</span>
                  </a>
                </dd>
              </div>
            </dl>
          </Tile>
        </aside>
      </div>
    </section>

    <section class="px-6 pb-14">
      <div class="max-w-[1100px] mx-auto">
        <NuxtLink
          :to="localePath('/projects')"
          class="inline-flex items-center gap-2 px-5 py-3 rounded-input ring-hair bg-card hover:bg-card-soft text-[14px] font-medium transition-colors"
        >
          <ArrowLeft :size="16" :stroke-width="2" />
          {{ $t('projects.backToProjects') }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
