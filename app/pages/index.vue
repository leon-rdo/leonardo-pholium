<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ContentBlock } from '~/types/content';
import SkillList from '~/components/skills/SkillList.vue';
import ProjectList from '~/components/projects/ProjectList.vue';
import ExperienceList from '~/components/experiences/ExperienceList.vue';
import EducationList from '~/components/educations/EducationList.vue';
import RecentPosts from '~/components/blog/RecentPosts.vue';
import ContactForm from '~/components/contact-messages/ContactForm.vue';
import TestimonialsList from '~/components/testimonials/TestimonialsList.vue';

const localePath = useLocalePath();

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger);
}

useSeoMeta({
  title: 'Portfolio | Leonardo',
  description: 'Desenvolvedor Full Stack - Criando experiências digitais excepcionais',
});

// Fetch all paginated content blocks
const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
  'home-content-blocks',
  '/api/content-blocks/',
  { page_name: 'home' }
);

const getContentBlock = (key: string) => {
  return contentBlocks.value?.results?.find(block => block.key === key);
};

onMounted(() => {
  gsap.from('.hero-title', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.from('.hero-subtitle', {
    y: 20,
    opacity: 0,
    duration: 0.8,
    delay: 0.2,
    ease: 'power2.out'
  });

  gsap.from('.hero-cta', {
    y: 20,
    opacity: 0,
    duration: 0.8,
    delay: 0.4,
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

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>

<template>
  <div class="portfolio-home">
    <!-- Hero Section -->
    <v-container class="hero-section">
      <v-row align="center" justify="center" class="min-h-screen">
        <v-col cols="12" md="10" lg="8" class="text-center">
          <div class="hero-badge mb-6 fade-up">
            <span class="hero-badge-text">{{ getContentBlock('hero_badge')?.text || 'Disponível para novos projetos'
            }}</span>
          </div>

          <h1 class="hero-title mb-6">
            {{ getContentBlock('hero_greeting')?.text || 'Olá, eu sou' }}
            <span class="hero-name">{{ getContentBlock('hero_name')?.text || 'Leonardo' }}</span>
          </h1>

          <p class="hero-subtitle mb-12">
            {{ getContentBlock('hero_subtitle')?.text || 'Full Stack Developer & Creative Problem Solver' }}
          </p>

          <div class="hero-cta d-flex justify-center flex-wrap">
            <v-btn size="large" flat color="primary" class="text-none px-8 hero-btn ma-2"
              @click="scrollToSection('projects')">
              {{ getContentBlock('hero_cta_projects')?.text || 'Ver Projetos' }}
            </v-btn>
            <v-btn size="large" variant="outlined" color="grey-darken-2" class="text-none px-8 hero-btn-outline ma-2"
              @click="scrollToSection('contact')">
              {{ getContentBlock('hero_cta_contact')?.text || 'Entrar em Contato' }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- About Section -->
    <v-container v-if="getContentBlock('about_intro')" class="section-container">
      <v-row justify="center">
        <v-col cols="12" md="8">
          <div class="section-header fade-up mb-12">
            <h2 class="section-title">
              {{ getContentBlock('about_title')?.text || 'Sobre Mim' }}
            </h2>
          </div>

          <div class="about-content fade-up">
            <div v-if="getContentBlock('about_intro')?.kind === 'html'" v-html="getContentBlock('about_intro')?.text" />
            <p v-else class="about-text">
              {{ getContentBlock('about_intro')?.text }}
            </p>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <v-container class="section-container" id="recent-posts">
      <v-row justify="center">
        <v-col cols="12" md="8">
          <div class="section-header fade-up mb-12">
            <h2 class="section-title">
              {{ getContentBlock('recent_posts_title')?.text || 'Posts Recentes' }}
            </h2>
            <p class="section-subtitle">
              {{ getContentBlock('recent_posts_subtitle')?.text || 'Últimas novidades do meu blog' }}
            </p>
          </div>
          <RecentPosts />
        </v-col>
      </v-row>
    </v-container>

    <!-- Skills Section -->
    <v-container class="section-container" id="skills">
      <v-row>
        <v-col cols="12">
          <div class="section-header fade-up mb-16">
            <h2 class="section-title">
              {{ getContentBlock('skills_title')?.text || 'Habilidades' }}
            </h2>
            <p class="section-subtitle">
              {{ getContentBlock('skills_subtitle')?.text || 'Tecnologias que domino' }}
            </p>
          </div>
        </v-col>
      </v-row>

      <SkillList />
    </v-container>

    <!-- Projects Section -->
    <v-container class="section-container" id="projects">
      <v-row>
        <v-col cols="12">
          <div class="section-header fade-up mb-16">
            <h2 class="section-title">
              {{ getContentBlock('projects_title')?.text || 'Projetos em Destaque' }}
            </h2>
            <p class="section-subtitle">
              {{ getContentBlock('projects_subtitle')?.text || 'Alguns dos meus trabalhos recentes' }}
            </p>
          </div>
        </v-col>
      </v-row>

      <ProjectList :featuredOnly="true" />

      <v-row class="mt-8">
        <v-col cols="12" class="text-center fade-up">
          <v-btn size="large" variant="text" color="grey-darken-2" class="text-none" :to="localePath('/projects')">
            {{ getContentBlock('projects_cta')?.text || 'Ver Todos os Projetos' }}
            <v-icon end size="20">mdi-arrow-right</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Experience Section -->
    <v-container class="section-container" id="experience">
      <v-row>
        <v-col cols="12">
          <div class="section-header fade-up mb-16">
            <h2 class="section-title">
              {{ getContentBlock('experience_title')?.text || 'Experiência' }}
            </h2>
            <p class="section-subtitle">
              {{ getContentBlock('experience_subtitle')?.text || 'Minha trajetória profissional' }}
            </p>
          </div>
        </v-col>
      </v-row>

      <ExperienceList />
    </v-container>

    <!-- Education Section -->
    <v-container class="section-container" id="education">
      <v-row>
        <v-col cols="12">
          <div class="section-header fade-up mb-16">
            <h2 class="section-title">
              {{ getContentBlock('education_title')?.text || 'Educação' }}
            </h2>
            <p class="section-subtitle">
              {{ getContentBlock('education_subtitle')?.text || 'Minha formação acadêmica' }}
            </p>
          </div>
        </v-col>
      </v-row>

      <EducationList />
    </v-container>

    <v-container class="section-container" id="testimonials">
      <v-row justify="center">
        <v-col cols="12" md="8">
          <div class="section-header fade-up mb-12">
            <h2 class="section-title">
              {{ getContentBlock('testimonials_title')?.text || 'Depoimentos' }}
            </h2>
            <p class="section-subtitle">
              {{ getContentBlock('testimonials_subtitle')?.text || 'O que meus clientes dizem' }}
            </p>
          </div>
          <TestimonialsList />
        </v-col>
      </v-row>
    </v-container>

    <!-- Contact Section -->
    <v-container class="section-container" id="contact">
      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <div class="contact-wrapper fade-up">
            <div class="contact-header text-center mb-12">
              <h2 class="contact-title">
                {{ getContentBlock('contact_title')?.text || 'Vamos Conversar?' }}
              </h2>
              <p class="contact-subtitle">
                {{ getContentBlock('contact_subtitle')?.text || 'Estou sempre aberto a novos projetos e oportunidades'
                }}
              </p>
            </div>

            <!-- Contact Form -->
            <ContactForm />

            <!-- Social Links -->
            <div class="contact-social mt-12">
              <p class="contact-social-text text-center">Ou conecte-se comigo nas redes sociais:</p>
              <div class="contact-links">
                <a :href="getContentBlock('contact_linkedin')?.text || 'https://linkedin.com'" target="_blank"
                  class="contact-link" title="LinkedIn">
                  <v-icon size="24">mdi-linkedin</v-icon>
                </a>
                <a :href="getContentBlock('contact_github')?.text || 'https://github.com'" target="_blank"
                  class="contact-link" title="GitHub">
                  <v-icon size="24">mdi-github</v-icon>
                </a>
                <a :href="`mailto:${getContentBlock('contact_email')?.text || 'email@example.com'}`"
                  class="contact-link" title="E-mail">
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
.portfolio-home {
  background: #fafafa;
  min-height: 100vh;
}

/* Typography Base */
.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0;
}

.section-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin-top: 1rem;
  font-weight: 400;
}

.section-header {
  text-align: center;
}

.section-container {
  padding: 120px 24px;
  max-width: 1200px;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
}

.hero-badge {
  display: inline-block;
  padding: 8px 20px;
  background: #f3f4f6;
  border-radius: 100px;
  margin-bottom: 32px;
}

.hero-badge-text {
  font-size: 0.875rem;
  color: #4b5563;
  font-weight: 500;
}

.hero-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0;
}

.hero-name {
  color: #2563eb;
  display: block;
  margin-top: 0.25em;
}

.hero-subtitle {
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  color: #6b7280;
  font-weight: 400;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.hero-btn {
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  height: 48px;
}

.hero-btn-outline {
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  height: 48px;
  border: 2px solid #e5e7eb;
}

.hero-btn-outline:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

/* About Section */
.about-content {
  max-width: 700px;
  margin: 0 auto;
}

.about-text {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #4b5563;
}

/* Contact Section */
.contact-wrapper {
  padding: 80px 0;
}

.contact-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.contact-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 48px;
  line-height: 1.6;
}

.contact-links {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.contact-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: white;
  border-radius: 12px;
  color: #6b7280;
  transition: all 0.3s ease;
  border: 1px solid #f3f4f6;
  text-decoration: none;
}

.contact-link:hover {
  background: #2563eb;
  color: white;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
  border-color: #2563eb;
}

/* Responsive */
@media (max-width: 960px) {
  .section-container {
    padding: 80px 24px;
  }

  .hero-section {
    padding: 60px 24px;
  }
}

@media (max-width: 600px) {
  .section-container {
    padding: 60px 20px;
  }

  .contact-wrapper {
    padding: 60px 0;
  }
}

/* Utilities */
.min-h-screen {
  min-height: 100vh;
}
</style>