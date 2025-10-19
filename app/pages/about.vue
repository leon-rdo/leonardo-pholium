<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { DjangoListResponse } from '~/types/api';
import type { ContentBlock } from '~/types/content';

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger);
}

useSeoMeta({
  title: 'Sobre | Leonardo',
  description: 'Conheça mais sobre mim, minha história e minha jornada no desenvolvimento',
});

const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
  'about-content-blocks',
  '/api/content-blocks/',
  { page_name: 'about' }
);

const allContentBlocks = computed<DjangoListResponse<ContentBlock> | null>(() => {
  return contentBlocks.value || null;
});

const getContentBlock = (key: string) => {
  return allContentBlocks.value?.results?.find(block => block.key === key);
};

onMounted(() => {
  gsap.from('.hero-title', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.from('.hero-line', {
    scaleX: 0,
    duration: 1,
    delay: 0.3,
    ease: 'power2.out'
  });

  gsap.utils.toArray('.fade-up').forEach((element: any) => {
    gsap.from(element, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: element,
        start: 'top 90%',
        once: true
      }
    });
  });
});
</script>

<template>
  <div class="about-page">
    <!-- Hero Section -->
    <v-container class="hero-section">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <div class="hero-content">
            <h1 class="hero-title">
              {{ getContentBlock('hero_title')?.text || 'Sobre Mim' }}
            </h1>
            <div class="hero-line"></div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Main Content Section -->
    <v-container class="content-section">
      <v-row justify="center">
        <v-col cols="12">
          <!-- Introduction -->
          <div v-if="getContentBlock('intro')" class="content-block fade-up">
            <div v-if="getContentBlock('intro')?.kind === 'html'" v-html="getContentBlock('intro')?.text"
              class="content-text" />
            <p v-else class="content-text">
              {{ getContentBlock('intro')?.text }}
            </p>
          </div>

          <!-- Journey Section -->
          <div v-if="getContentBlock('journey_title')" class="content-block fade-up">
            <h2 class="section-subtitle">
              {{ getContentBlock('journey_title')?.text || 'Minha Jornada' }}
            </h2>
            <div v-if="getContentBlock('journey_text')?.kind === 'html'" v-html="getContentBlock('journey_text')?.text"
              class="content-text" />
            <p v-else-if="getContentBlock('journey_text')" class="content-text">
              {{ getContentBlock('journey_text')?.text }}
            </p>
          </div>

          <!-- Values Section -->
          <div v-if="getContentBlock('values_title')" class="content-block fade-up">
            <h2 class="section-subtitle">
              {{ getContentBlock('values_title')?.text || 'Valores' }}
            </h2>
            <div v-if="getContentBlock('values_text')?.kind === 'html'" v-html="getContentBlock('values_text')?.text"
              class="content-text" />
            <p v-else-if="getContentBlock('values_text')" class="content-text">
              {{ getContentBlock('values_text')?.text }}
            </p>
          </div>

          <!-- What I Do Section -->
          <div v-if="getContentBlock('what_i_do_title')" class="content-block fade-up">
            <h2 class="section-subtitle">
              {{ getContentBlock('what_i_do_title')?.text || 'O Que Faço' }}
            </h2>
            <div v-if="getContentBlock('what_i_do_text')?.kind === 'html'"
              v-html="getContentBlock('what_i_do_text')?.text" class="content-text" />
            <p v-else-if="getContentBlock('what_i_do_text')" class="content-text">
              {{ getContentBlock('what_i_do_text')?.text }}
            </p>
          </div>

          <!-- Call to Action -->
          <div class="cta-section fade-up">
            <div class="cta-line"></div>
            <p class="cta-text">
              {{ getContentBlock('cta_text')?.text || 'Vamos trabalhar juntos?' }}
            </p>
            <v-btn size="large" color="primary" class="text-none cta-btn" to="/#contact">
              {{ getContentBlock('cta_button')?.text || 'Entre em Contato' }}
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.about-page {
  background: #fafafa;
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  padding: 160px 24px 100px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
}

.hero-content {
  text-align: center;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.03em;
  line-height: 1;
  margin: 0 0 40px 0;
}

.hero-line {
  width: 80px;
  height: 4px;
  background: #2563eb;
  margin: 0 auto;
  transform-origin: left;
}

/* Content Section */
.content-section {
  padding: 60px 24px 120px;
  max-width: 800px;
}

.content-block {
  margin-bottom: 80px;
}

.content-block:last-of-type {
  margin-bottom: 100px;
}

.section-subtitle {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  position: relative;
  padding-left: 20px;
}

.section-subtitle::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: #2563eb;
  border-radius: 2px;
}

.content-text {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #1a1a1a;
  margin: 0;
}

.content-text :deep(p) {
  margin-bottom: 20px;
  line-height: 1.8;
}

.content-text :deep(p:last-child) {
  margin-bottom: 0;
}

.content-text :deep(strong) {
  color: #1a1a1a;
  font-weight: 600;
}

.content-text :deep(a) {
  color: #2563eb;
  text-decoration: none;
  transition: color 0.2s ease;
}

.content-text :deep(a:hover) {
  color: #1d4ed8;
}

/* Call to Action */
.cta-section {
  text-align: center;
  padding: 60px 0 0;
  margin-top: 40px;
}

.cta-line {
  width: 60px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 auto 32px;
}

.cta-text {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 32px;
  font-weight: 500;
}

.cta-btn {
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  height: 48px;
  padding: 0 32px;
}

/* Responsive */
@media (max-width: 960px) {
  .hero-section {
    padding: 120px 24px 80px;
  }

  .content-section {
    padding: 40px 24px 80px;
  }

  .content-block {
    margin-bottom: 60px;
  }

  .section-subtitle {
    font-size: 1.25rem;
  }

  .content-text {
    font-size: 1rem;
  }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 100px 20px 60px;
  }

  .content-section {
    padding: 30px 20px 60px;
  }

  .hero-line {
    width: 60px;
  }

  .cta-section {
    padding: 40px 0 0;
  }

  .cta-text {
    font-size: 1.125rem;
  }
}

/* Dark Mode Support */
/* @media (prefers-color-scheme: dark) {
  .about-page {
    background: #0f172a;
  }

  .hero-section {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  }

  .hero-title {
    color: #f1f5f9;
  }

  .section-subtitle {
    color: #f1f5f9;
  }

  .content-text {
    color: #cbd5e1;
  }

  .content-text :deep(strong) {
    color: #f1f5f9;
  }

  .cta-text {
    color: #94a3b8;
  }
} */
</style>