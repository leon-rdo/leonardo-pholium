<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ArrowUpRight, Github, Linkedin, Mail } from 'lucide-vue-next';
import type { ContentBlock } from '~/types/content';
import HeroBento from '~/components/home/HeroBento.vue';
import NowPanel from '~/components/home/NowPanel.vue';
import AboutSection from '~/components/home/AboutSection.vue';
import StackSection from '~/components/home/StackSection.vue';
import ProjectList from '~/components/projects/ProjectList.vue';
import ExperienceList from '~/components/experiences/ExperienceList.vue';
import EducationList from '~/components/educations/EducationList.vue';
import TestimonialsList from '~/components/testimonials/TestimonialsList.vue';
import ContactForm from '~/components/contact-messages/ContactForm.vue';

const localePath = useLocalePath();
const { t, locale } = useI18n();
const config = useRuntimeConfig();

if (import.meta.client) gsap.registerPlugin(ScrollTrigger);

const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
  'home-content-blocks',
  '/api/content-blocks/',
  { page_name: 'home', expand: 'images' },
);

const blocks = computed(() => contentBlocks.value?.results ?? []);
const getContentBlock = (key: string) => blocks.value.find((b) => b.key === key);

// SEO
const { setSeoMeta } = useSeo();
setSeoMeta({
  title: getContentBlock('seo_title')?.text || t('home.seo_title'),
  description:
    getContentBlock('seo_description')?.text || t('home.seo_description'),
  image:
    getContentBlock('seo_image')?.text ||
    `${config.public.siteUrl}/og-default.jpg`,
  type: 'website',
  keywords: [
    'Leonardo Costa',
    'Backend Engineer',
    'Full Stack Developer',
    'Portfolio',
    'Vue',
    'Nuxt',
    'Django',
    'PostgreSQL',
    'Python',
    'TypeScript',
  ],
});

// Structured data: the site-wide Person (#identity) and WebSite nodes are
// emitted once by nuxt-schema-org from `schemaOrg.identity` in nuxt.config.
// Here we only augment those existing nodes (merged by @id) — promoting the
// home WebPage to a ProfilePage and attaching the blog SearchAction to the
// WebSite — instead of redefining Person/WebSite (which previously produced
// duplicate, conflicting entities).
useSchemaOrg([
  // ProfilePage must declare the entity it is about; Google rejects the rich
  // result without `mainEntity`. Point it at the site-wide Person (#identity).
  defineWebPage({
    '@type': 'ProfilePage',
    mainEntity: { '@id': `${config.public.siteUrl}/#identity` },
  }),
  defineWebSite({
    potentialAction: [
      defineSearchAction({
        target: `${config.public.siteUrl}/${locale.value}/blog?search={search_term_string}`,
      }),
    ],
  }),
]);

onMounted(() => {
  gsap.utils.toArray<HTMLElement>('.fade-up').forEach((element) => {
    gsap.from(element, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 90%', once: true },
    });
  });
});

// Contact links and meta — all backend-driven (ContentBlocks). When a key
// isn't configured we render nothing for it (no AI-mocked placeholders).
const linkedinUrl = computed(() => getContentBlock('contact_linkedin')?.text);
const githubUrl = computed(() => getContentBlock('contact_github')?.text);
const emailAddress = computed(() => getContentBlock('contact_email')?.text);
const contactTimezone = computed(() => getContentBlock('contact_timezone')?.text);
const contactOpenFor = computed(() => getContentBlock('contact_open_for')?.text);
const contactResponse = computed(() => getContentBlock('contact_response')?.text);

const hasAnyContactMeta = computed(
  () =>
    !!contactTimezone.value || !!contactOpenFor.value || !!contactResponse.value,
);
const hasAnyContactLink = computed(
  () => !!linkedinUrl.value || !!githubUrl.value || !!emailAddress.value,
);
</script>

<template>
  <div>
    <HeroBento :content-blocks="blocks" />
    <NowPanel :content-blocks="blocks" />
    <AboutSection :content-blocks="blocks" />
    <StackSection :content-blocks="blocks" />

    <!-- Selected work -->
    <section id="projects">
      <div class="max-w-[1280px] mx-auto px-6 py-10">
        <header class="flex items-end justify-between mb-4">
          <div>
            <SectionLabel index="04" :name="$t('home.work.label')" />
            <h2 class="h-display text-[36px] sm:text-[40px] font-bold mt-2">
              {{ $t('home.work.title') }}
            </h2>
          </div>
          <NuxtLink
            :to="localePath('/projects')"
            class="font-mono-rail underline-offset-4 hover:text-accent transition-colors hidden sm:inline-flex items-center gap-1"
          >
            {{ $t('home.work.allLink') }} <ArrowUpRight :size="14" :stroke-width="2" />
          </NuxtLink>
        </header>
        <ProjectList :featured-only="true" />
      </div>
    </section>

    <!-- Experience -->
    <section id="experience">
      <div class="max-w-[1280px] mx-auto px-6 py-10">
        <header class="mb-4">
          <SectionLabel index="05" :name="$t('home.experience.label')" />
          <h2 class="h-display text-[36px] sm:text-[40px] font-bold mt-2">
            {{ $t('home.experience.title') }}
          </h2>
        </header>
        <ExperienceList />
      </div>
    </section>

    <!-- Education -->
    <section id="education">
      <div class="max-w-[1280px] mx-auto px-6 py-10">
        <header class="mb-4">
          <SectionLabel index="06" :name="$t('home.education.label')" />
          <h2 class="h-display text-[36px] sm:text-[40px] font-bold mt-2">
            {{ $t('home.education.title') }}
          </h2>
        </header>
        <EducationList />
      </div>
    </section>

    <!-- Testimonials -->
    <section id="testimonials">
      <div class="max-w-[1280px] mx-auto px-6 py-10">
        <header class="mb-4">
          <SectionLabel index="07" :name="$t('home.testimonials.label')" />
          <h2 class="h-display text-[36px] sm:text-[40px] font-bold mt-2">
            {{ $t('home.testimonials.title') }}
          </h2>
        </header>
        <TestimonialsList />
      </div>
    </section>

    <!-- Contact CTA — always-dark tile with aurora glow.
         Uses `bg-night` / `text-night-text` so it stays deep ink in both
         themes (`bg-ink` would flip with the color-mode tokens). -->
    <section id="contact" class="px-6 pb-12 pt-6">
      <div
        class="max-w-[1280px] mx-auto rounded-tile bg-night text-night-text relative overflow-hidden fade-up"
      >
        <div
          aria-hidden="true"
          class="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style="background: radial-gradient(closest-side, rgba(44, 103, 232, 0.45), transparent 70%)"
        />
        <div
          aria-hidden="true"
          class="absolute -bottom-32 right-0 w-[400px] h-[400px] rounded-full"
          style="background: radial-gradient(closest-side, rgba(255, 209, 195, 0.18), transparent 70%)"
        />
        <div class="relative px-8 sm:px-12 py-16 sm:py-20 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div class="md:col-span-7">
            <SectionLabel index="08" :name="$t('home.contact.label')" />
            <h2
              class="h-display text-[40px] sm:text-[52px] lg:text-[60px] font-bold mt-2 leading-[1.02]"
            >
              {{ $t('home.contact.titleLead') }}
              <span class="text-accent">{{ $t('home.contact.titleAccent') }}</span>
            </h2>
            <p class="mt-6 text-[16px] sm:text-[17px] text-night-text/70 leading-[1.65] max-w-[520px]">
              {{ getContentBlock('contact_subtitle')?.text || $t('home.contact.subtitle') }}
            </p>

            <!-- Contact form sits inside the dark tile -->
            <div class="mt-8">
              <ContactForm />
            </div>
          </div>

          <aside
            v-if="hasAnyContactMeta || hasAnyContactLink"
            class="md:col-span-5 self-start font-mono text-[12.5px] text-night-text/70 space-y-6"
          >
            <div v-if="hasAnyContactMeta">
              <div class="font-mono-rail !text-night-text/50 mb-3">
                {{ $t('home.contact.metaLabel') }}
              </div>
              <div class="grid grid-cols-2 gap-y-3 gap-x-6">
                <template v-if="contactTimezone">
                  <span class="text-night-text/40">// {{ $t('home.contact.timezoneLabel') }}</span>
                  <span>{{ contactTimezone }}</span>
                </template>
                <template v-if="contactOpenFor">
                  <span class="text-night-text/40">// {{ $t('home.contact.openForLabel') }}</span>
                  <span class="text-accent">{{ contactOpenFor }}</span>
                </template>
                <template v-if="contactResponse">
                  <span class="text-night-text/40">// {{ $t('home.contact.responseLabel') }}</span>
                  <span>{{ contactResponse }}</span>
                </template>
              </div>
            </div>

            <div v-if="hasAnyContactLink">
              <div class="font-mono-rail !text-night-text/50 mb-3">
                {{ $t('home.contact.linksLabel') }}
              </div>
              <ul class="space-y-2">
                <li v-if="linkedinUrl">
                  <a
                    :href="linkedinUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-between gap-3 px-3.5 py-3 rounded-input border border-white/10 hover:bg-white/5 transition-colors group/link text-night-text"
                  >
                    <span class="inline-flex items-center gap-2.5 font-medium">
                      <Linkedin :size="16" :stroke-width="1.8" />
                      LinkedIn
                    </span>
                    <ArrowUpRight
                      :size="14"
                      :stroke-width="2"
                      class="text-night-text/50 group-hover/link:text-accent group-hover/link:translate-x-0.5 transition"
                    />
                  </a>
                </li>
                <li v-if="githubUrl">
                  <a
                    :href="githubUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-between gap-3 px-3.5 py-3 rounded-input border border-white/10 hover:bg-white/5 transition-colors group/link text-night-text"
                  >
                    <span class="inline-flex items-center gap-2.5 font-medium">
                      <Github :size="16" :stroke-width="1.8" />
                      GitHub
                    </span>
                    <ArrowUpRight
                      :size="14"
                      :stroke-width="2"
                      class="text-night-text/50 group-hover/link:text-accent group-hover/link:translate-x-0.5 transition"
                    />
                  </a>
                </li>
                <li v-if="emailAddress">
                  <a
                    :href="`mailto:${emailAddress}`"
                    class="flex items-center justify-between gap-3 px-3.5 py-3 rounded-input border border-white/10 hover:bg-white/5 transition-colors group/link text-night-text"
                  >
                    <span class="inline-flex items-center gap-2.5 font-medium">
                      <Mail :size="16" :stroke-width="1.8" />
                      {{ emailAddress }}
                    </span>
                    <ArrowRight
                      :size="14"
                      :stroke-width="2"
                      class="text-night-text/50 group-hover/link:text-accent group-hover/link:translate-x-0.5 transition"
                    />
                  </a>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </div>
</template>
