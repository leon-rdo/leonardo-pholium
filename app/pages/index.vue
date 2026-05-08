<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ContentBlock } from '~/types/content';
import HeroBento from '~/components/home/HeroBento.vue';
import NowPanel from '~/components/home/NowPanel.vue';
import AboutSection from '~/components/home/AboutSection.vue';
import StackSection from '~/components/home/StackSection.vue';
// Sections still rendered with Vuetify until PR 4 migrates them.
import ProjectList from '~/components/projects/ProjectList.vue';
import ExperienceList from '~/components/experiences/ExperienceList.vue';
import EducationList from '~/components/educations/EducationList.vue';
import ContactForm from '~/components/contact-messages/ContactForm.vue';
import TestimonialsList from '~/components/testimonials/TestimonialsList.vue';

const localePath = useLocalePath();
const { t, locale } = useI18n();
const config = useRuntimeConfig();

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger);
}

// Fetch all paginated content blocks for the home page (with images expanded).
const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
  'home-content-blocks',
  '/api/content-blocks/',
  { page_name: 'home', expand: 'images' },
);

const blocks = computed(() => contentBlocks.value?.results ?? []);
const getContentBlock = (key: string) => blocks.value.find((b) => b.key === key);

// SEO
const { setSeoMeta, setStructuredData } = useSeo();
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

const homeUrl = computed(() => `${config.public.siteUrl}/${locale.value}`);

setStructuredData([
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${config.public.siteUrl}#person`,
    name: getContentBlock('hero_name')?.text || 'Leonardo Costa',
    jobTitle:
      getContentBlock('hero_subtitle')?.text || 'Backend Engineer',
    description:
      getContentBlock('seo_description')?.text || t('home.seo_description'),
    url: config.public.siteUrl,
    image:
      getContentBlock('seo_image')?.text ||
      `${config.public.siteUrl}/og-default.jpg`,
    sameAs: [
      getContentBlock('contact_linkedin')?.text || '',
      getContentBlock('contact_github')?.text || '',
    ].filter(Boolean),
    knowsAbout: [
      'Web Development',
      'Full Stack Engineering',
      'Vue.js',
      'Nuxt',
      'Django',
      'TypeScript',
      'Python',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${config.public.siteUrl}#website`,
    url: config.public.siteUrl,
    name: 'Leonardo Costa',
    description:
      getContentBlock('seo_description')?.text || t('home.seo_description'),
    inLanguage: locale.value === 'pt-br' ? 'pt-BR' : 'en-US',
    publisher: { '@id': `${config.public.siteUrl}#person` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.public.siteUrl}/${locale.value}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${homeUrl.value}#profile`,
    url: homeUrl.value,
    mainEntity: { '@id': `${config.public.siteUrl}#person` },
    inLanguage: locale.value === 'pt-br' ? 'pt-BR' : 'en-US',
  },
]);

// GSAP scroll-trigger fade-ups. The new home components mark fade-up
// elements with class="fade-up"; the same class is used by the legacy
// Vuetify sections below — single onMounted handles both.
onMounted(() => {
  gsap.utils.toArray<HTMLElement>('.fade-up').forEach((element) => {
    gsap.from(element, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 90%',
        once: true,
      },
    });
  });
});
</script>

<template>
  <div>
    <!-- New Tailwind sections (PR 3) -->
    <HeroBento :content-blocks="blocks" />
    <NowPanel :content-blocks="blocks" />
    <AboutSection :content-blocks="blocks" />
    <StackSection :content-blocks="blocks" />

    <!-- Legacy Vuetify sections — kept until PR 4 migrates them. -->

    <!-- Projects -->
    <v-container class="section-container" id="projects">
      <v-row>
        <v-col cols="12">
          <div class="section-header fade-up mb-16">
            <h2 class="section-title">
              {{ getContentBlock('projects_title')?.text || $t('projects.title') }}
            </h2>
            <p class="section-subtitle">
              {{
                getContentBlock('projects_subtitle')?.text ||
                $t('projects.subtitle') ||
                'Some of my recent work'
              }}
            </p>
          </div>
        </v-col>
      </v-row>
      <ProjectList :featured-only="true" />
      <v-row class="mt-8">
        <v-col cols="12" class="text-center fade-up">
          <v-btn
            size="large"
            variant="text"
            color="grey-darken-2"
            class="text-none"
            :to="localePath('/projects')"
          >
            {{
              getContentBlock('projects_cta')?.text || $t('common.viewAll')
            }}
            <v-icon end size="20">mdi-arrow-right</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Experience -->
    <v-container class="section-container" id="experience">
      <v-row>
        <v-col cols="12">
          <div class="section-header fade-up mb-16">
            <h2 class="section-title">
              {{ getContentBlock('experience_title')?.text || $t('experience.title') }}
            </h2>
            <p class="section-subtitle">
              {{
                getContentBlock('experience_subtitle')?.text ||
                $t('experience.subtitle') ||
                ''
              }}
            </p>
          </div>
        </v-col>
      </v-row>
      <ExperienceList />
    </v-container>

    <!-- Education -->
    <v-container class="section-container" id="education">
      <v-row>
        <v-col cols="12">
          <div class="section-header fade-up mb-16">
            <h2 class="section-title">
              {{ getContentBlock('education_title')?.text || $t('education.title') }}
            </h2>
            <p class="section-subtitle">
              {{ getContentBlock('education_subtitle')?.text || '' }}
            </p>
          </div>
        </v-col>
      </v-row>
      <EducationList />
    </v-container>

    <!-- Testimonials -->
    <v-container class="section-container" id="testimonials">
      <v-row justify="center">
        <v-col cols="12" md="8">
          <div class="section-header fade-up mb-12">
            <h2 class="section-title">
              {{ getContentBlock('testimonials_title')?.text || $t('testimonials.title') }}
            </h2>
            <p class="section-subtitle">
              {{
                getContentBlock('testimonials_subtitle')?.text ||
                $t('testimonials.subtitle') ||
                ''
              }}
            </p>
          </div>
          <TestimonialsList />
        </v-col>
      </v-row>
    </v-container>

    <!-- Contact -->
    <v-container class="section-container" id="contact">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <div class="contact-wrapper fade-up">
            <div class="contact-header text-center mb-12">
              <h2 class="contact-title">
                {{ getContentBlock('contact_title')?.text || $t('contact.title') }}
              </h2>
              <p class="contact-subtitle">
                {{
                  getContentBlock('contact_subtitle')?.text || $t('contact.subtitle')
                }}
              </p>
            </div>
            <ContactForm />
            <div class="contact-social mt-12">
              <p class="contact-social-text text-center">
                {{ $t('contact.connectSocial') }}
              </p>
              <div class="contact-links">
                <a
                  :href="getContentBlock('contact_linkedin')?.text || 'https://linkedin.com'"
                  target="_blank"
                  class="contact-link"
                  title="LinkedIn"
                >
                  <v-icon size="24">mdi-linkedin</v-icon>
                </a>
                <a
                  :href="getContentBlock('contact_github')?.text || 'https://github.com'"
                  target="_blank"
                  class="contact-link"
                  title="GitHub"
                >
                  <v-icon size="24">mdi-github</v-icon>
                </a>
                <a
                  :href="`mailto:${
                    getContentBlock('contact_email')?.text || 'email@example.com'
                  }`"
                  class="contact-link"
                  title="E-mail"
                >
                  <v-icon size="24">mdi-email</v-icon>
                </a>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
/*
 * Legacy Vuetify section styles — kept untouched until PR 4. The new
 * Tailwind sections (Hero, Now, About, Stack) carry their own styling
 * via tokens, no scoped styles needed.
 */
.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: var(--color-ink);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0;
}

.section-subtitle {
  font-size: 1.125rem;
  color: var(--color-ink-3);
  margin-top: 1rem;
  font-weight: 400;
}

.section-header {
  text-align: center;
}

.section-container {
  padding: 96px 24px;
  max-width: 1200px;
}

@media (max-width: 960px) {
  .section-container {
    padding: 64px 24px;
  }
}

.contact-wrapper {
  width: 100%;
}
.contact-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: var(--color-ink);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0 0 1rem;
}
.contact-subtitle {
  font-size: 1.125rem;
  color: var(--color-ink-3);
  font-weight: 400;
}
.contact-social-text {
  font-size: 0.95rem;
  color: var(--color-ink-3);
  margin-bottom: 1.5rem;
}
.contact-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.contact-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--color-card);
  color: var(--color-ink);
  border: 1px solid var(--color-line);
  transition: all 0.2s ease;
}
.contact-link:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}
</style>
