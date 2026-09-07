<script setup lang="ts">
import { ArrowRight, Github, Linkedin, Mail, MapPin } from 'lucide-vue-next';
import type { ContentBlock } from '~/types/content';
import Breadcrumbs from '~/components/common/Breadcrumbs.vue';
import EducationList from '~/components/educations/EducationList.vue';
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs';


const localePath = useLocalePath();
const { locale, t } = useI18n();
const config = useRuntimeConfig();

const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
  'about-content-blocks',
  '/api/content-blocks/',
  { page_name: 'about' },
);

const blocks = computed(() => contentBlocks.value?.results ?? []);
const getContentBlock = (key: string) => blocks.value.find((b) => b.key === key);

// Pull contact handles from the home ContentBlocks (same backend) so the
// quick-facts panel doesn't need its own keys.
const { data: homeBlocks } = await useApiPaginated<ContentBlock>(
  'about-home-blocks',
  '/api/content-blocks/',
  { page_name: 'home' },
);
const homeBlockText = (key: string) =>
  homeBlocks.value?.results?.find((b) => b.key === key)?.text;

const breadcrumbItems = computed<BreadcrumbItem[]>(() => [
  { title: t('nav.home'), to: '/' },
  { title: t('nav.about'), disabled: true },
]);

// SEO
const { setSeoMeta, setStructuredData } = useSeo();
setSeoMeta({
  title: getContentBlock('seo_title')?.text || t('about.title'),
  description:
    getContentBlock('seo_description')?.text || t('about.description'),
  image:
    getContentBlock('seo_image')?.text ||
    `${config.public.siteUrl}/og-default.jpg`,
  type: 'profile',
});

const aboutUrl = computed(
  () => `${config.public.siteUrl}/${locale.value}/about`,
);

setStructuredData([
  {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${aboutUrl.value}#about`,
    name: getContentBlock('hero_title')?.text || t('about.title'),
    description: (getContentBlock('intro')?.text || t('about.description'))
      .replace(/<[^>]*>/g, '')
      .slice(0, 300),
    url: aboutUrl.value,
    inLanguage: locale.value === 'pt-br' ? 'pt-BR' : 'en-US',
    mainEntity: { '@id': `${config.public.siteUrl}/#identity` },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${config.public.siteUrl}/#website`,
    },
  },
]);

// Each section is rendered only when its title block exists in the backend.
// The rail label on the side carries the same numbering the home uses.
interface AboutSection {
  index: string;
  key: string;
  i18nFallback: string;
  textKey: string;
  labelKey: string;
}
const sections: AboutSection[] = [
  { index: '01', key: 'intro', i18nFallback: 'about.title', textKey: 'intro', labelKey: 'about.label' },
  { index: '02', key: 'journey_title', i18nFallback: 'about.myJourney', textKey: 'journey_text', labelKey: 'about.journeyLabel' },
  { index: '03', key: 'values_title', i18nFallback: 'about.values', textKey: 'values_text', labelKey: 'about.valuesLabel' },
  { index: '04', key: 'what_i_do_title', i18nFallback: 'about.whatIDo', textKey: 'what_i_do_text', labelKey: 'about.workLabel' },
];

const visibleSections = computed(() =>
  sections.filter((s) => getContentBlock(s.key) || s.key === 'intro'),
);

const sectionTitle = (s: AboutSection) =>
  getContentBlock(s.key)?.text || t(s.i18nFallback);
const sectionText = (s: AboutSection) => getContentBlock(s.textKey);

// Quick facts panel — every value comes from a ContentBlock; if the
// admin hasn't configured one, the row is hidden (no AI-mocked fallback).
const linkedinUrl = computed(() => homeBlockText('contact_linkedin'));
const githubUrl = computed(() => homeBlockText('contact_github'));
const emailAddress = computed(() => homeBlockText('contact_email'));
const factTimezone = computed(() => homeBlockText('contact_timezone'));
const factLanguages = computed(() => homeBlockText('contact_languages'));
const factOpenFor = computed(() => homeBlockText('contact_open_for'));

const hasAnyFact = computed(
  () => !!factTimezone.value || !!factLanguages.value || !!factOpenFor.value,
);
const hasAnyLink = computed(
  () => !!linkedinUrl.value || !!githubUrl.value || !!emailAddress.value,
);

useFadeUp({ y: 36, duration: 0.7 });
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative">
      <AuroraBg :intensity="0.4" />
      <div class="relative max-w-[1280px] mx-auto px-6 pt-12 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8">
          <Breadcrumbs :items="breadcrumbItems" class="mb-6" />
          <SectionLabel index="00" :name="$t('about.label')" />
          <h1 class="h-display text-[48px] sm:text-[72px] lg:text-[88px] font-bold mt-3 leading-[1.0]">
            {{ getContentBlock('hero_title')?.text || $t('about.title') }}
          </h1>
          <p
            v-if="getContentBlock('hero_subtitle')"
            class="mt-6 text-[17px] sm:text-[18px] text-ink-2 leading-[1.65] max-w-[640px]"
          >
            {{ getContentBlock('hero_subtitle')?.text }}
          </p>
        </div>

        <!-- Quick facts panel — only renders rows that have backend values -->
        <Tile
          v-if="hasAnyFact || hasAnyLink"
          class="lg:col-span-4 px-5 py-5 self-end fade-up"
        >
          <SectionLabel :name="$t('about.factsLabel')" tone="accent" />
          <dl
            v-if="hasAnyFact"
            class="mt-4 space-y-3 font-mono text-[12.5px]"
          >
            <div
              v-if="factTimezone"
              class="flex items-start justify-between gap-3"
            >
              <dt class="text-ink-3">{{ $t('home.contact.timezoneLabel') }}</dt>
              <dd class="text-ink inline-flex items-center gap-1.5">
                <MapPin :size="13" :stroke-width="1.8" />
                {{ factTimezone }}
              </dd>
            </div>
            <div
              v-if="factLanguages"
              class="flex items-start justify-between gap-3"
            >
              <dt class="text-ink-3">{{ $t('about.languagesLabel') }}</dt>
              <dd class="text-ink">{{ factLanguages }}</dd>
            </div>
            <div
              v-if="factOpenFor"
              class="flex items-start justify-between gap-3"
            >
              <dt class="text-ink-3">{{ $t('home.contact.openForLabel') }}</dt>
              <dd class="text-accent">{{ factOpenFor }}</dd>
            </div>
          </dl>
          <div
            v-if="hasAnyLink"
            :class="[
              'space-y-1.5',
              hasAnyFact ? 'mt-5 pt-4 border-t border-line' : 'mt-2',
            ]"
          >
            <a
              v-if="linkedinUrl"
              :href="linkedinUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-between gap-3 px-3 py-2 -mx-1 rounded-input hover:bg-card-soft transition-colors group/link"
            >
              <span class="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-2 group-hover/link:text-ink">
                <Linkedin :size="14" :stroke-width="1.8" />
                LinkedIn
              </span>
              <ArrowRight
                :size="13"
                :stroke-width="2"
                class="text-ink-3 group-hover/link:text-accent group-hover/link:translate-x-0.5 transition"
              />
            </a>
            <a
              v-if="githubUrl"
              :href="githubUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-between gap-3 px-3 py-2 -mx-1 rounded-input hover:bg-card-soft transition-colors group/link"
            >
              <span class="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-2 group-hover/link:text-ink">
                <Github :size="14" :stroke-width="1.8" />
                GitHub
              </span>
              <ArrowRight
                :size="13"
                :stroke-width="2"
                class="text-ink-3 group-hover/link:text-accent group-hover/link:translate-x-0.5 transition"
              />
            </a>
            <a
              v-if="emailAddress"
              :href="`mailto:${emailAddress}`"
              class="flex items-center justify-between gap-3 px-3 py-2 -mx-1 rounded-input hover:bg-card-soft transition-colors group/link"
            >
              <span class="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-2 group-hover/link:text-ink">
                <Mail :size="14" :stroke-width="1.8" />
                {{ $t('about.email') }}
              </span>
              <ArrowRight
                :size="13"
                :stroke-width="2"
                class="text-ink-3 group-hover/link:text-accent group-hover/link:translate-x-0.5 transition"
              />
            </a>
          </div>
        </Tile>
      </div>
    </section>

    <!-- Long-form prose: each section is a 3+9 split with section label on the rail -->
    <section v-for="section in visibleSections" :key="section.key" class="relative">
      <div class="max-w-[1280px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-6 fade-up">
        <div class="md:col-span-3">
          <SectionLabel :index="section.index" :name="$t(section.labelKey)" />
        </div>
        <div class="md:col-span-9 max-w-[760px]">
          <h2
            v-if="section.key !== 'intro'"
            class="h-display text-[28px] sm:text-[32px] font-bold mb-5"
          >
            {{ sectionTitle(section) }}
          </h2>
          <div
            v-if="sectionText(section)?.kind === 'html'"
            class="prose prose-stone dark:prose-invert max-w-none text-[16.5px] leading-[1.75] text-ink-2 [&_p]:mb-4 [&_strong]:text-ink [&_a]:text-accent hover:[&_a]:text-accent-2"
            v-html="sectionText(section)?.text"
          />
          <p v-else-if="sectionText(section)" class="text-[16.5px] leading-[1.75] text-ink-2 whitespace-pre-line">
            {{ sectionText(section)?.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- Education -->
    <section>
      <div class="max-w-[1280px] mx-auto px-6 py-10">
        <header class="mb-4">
          <SectionLabel index="05" :name="$t('home.education.label')" />
          <h2 class="h-display text-[36px] sm:text-[40px] font-bold mt-2">
            {{ $t('home.education.title') }}
          </h2>
        </header>
        <EducationList />
      </div>
    </section>

    <!-- CTA -->
    <section class="px-6 pb-12 pt-6">
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
            <SectionLabel :name="$t('home.contact.label')" />
            <h2 class="h-display text-[32px] sm:text-[44px] font-bold mt-2">
              {{ getContentBlock('cta_text')?.text || $t('about.cta') }}
            </h2>
          </div>
          <div class="md:col-span-4 md:justify-self-end">
            <NuxtLink
              :to="localePath('/#contact')"
              class="inline-flex items-center justify-center gap-2 bg-accent text-night-text font-semibold px-6 py-3.5 rounded-input hover:bg-accent-2 glow-blue transition-colors"
            >
              {{ getContentBlock('cta_button')?.text || $t('about.ctaButton') }}
              <ArrowRight :size="16" :stroke-width="2" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
