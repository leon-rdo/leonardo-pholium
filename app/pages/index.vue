<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ContentBlock, DjangoListResponse, Education, Experience, Project, Skill } from '~/types/api';

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger);
}

useSeoMeta({
  title: 'Portfolio | Leonardo',
  description: 'Desenvolvedor Full Stack - Criando experiências digitais excepcionais',
});

const config = useRuntimeConfig();

// Fetch all paginated content blocks using $fetch instead of useFetch
const { data: contentBlocks } = await useAsyncData('content-blocks', async () => {
  let url: string | null = '/api/content-blocks/';
  const allResults: ContentBlock[] = [];

  while (url) {
    const response: DjangoListResponse<ContentBlock> = await $fetch<DjangoListResponse<ContentBlock>>(url, {
      baseURL: url.startsWith('http') ? undefined : config.public.apiBase,
      params: url.startsWith('http') ? undefined : { page_name: 'home' },
      headers: { 'Accept-Language': 'en-us' }
    });

    if (response) {
      allResults.push(...(response.results || []));
      url = response.next;
    } else {
      url = null;
    }
  }

  return {
    count: allResults.length,
    results: allResults,
    next: null,
    previous: null
  } as DjangoListResponse<ContentBlock>;
}, {
  default: () => ({ count: 0, results: [], next: null, previous: null })
});

const getContentBlock = (key: string) => {
  return contentBlocks.value?.results?.find(block => block.key === key);
};

const { data: projects } = await useFetch<DjangoListResponse<Project>>('/api/projects/', {
  baseURL: config.public.apiBase,
  params: { featured: true, limit: 3, status: 'published' }
});

const { data: skills } = await useFetch<DjangoListResponse<Skill>>('/api/skills/', {
  baseURL: config.public.apiBase,
  params: { limit: 6, ordering: '-level' }
});

const { data: experiences } = await useFetch<DjangoListResponse<Experience>>('/api/experiences/', {
  baseURL: config.public.apiBase,
  params: { limit: 3, ordering: '-start_date' }
});

const { data: educations } = await useFetch<DjangoListResponse<Education>>('/api/educations/', {
  baseURL: config.public.apiBase,
  params: { limit: 3, ordering: '-start_date' }
});

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

  // Scroll-triggered animations
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

const currentSkillHover = ref<number | null>(null);

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const formatDate = (date: string | null) => {
  if (!date) return 'Presente';
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short'
  });
};
</script>

<template>
  <div class="portfolio-home">
    <!-- Hero Section -->
    <v-container class="hero-section">
      <v-row align="center" justify="center" class="min-h-screen">
        <v-col cols="12" md="10" lg="8" class="text-center">
          <div class="hero-badge mb-6 fade-up">
            <span class="hero-badge-text">{{ getContentBlock('hero_badge')?.text || 'ERRO' }}</span>
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

      <v-row>
        <v-col v-for="(skill, index) in skills?.results" :key="skill.id" cols="6" sm="4" md="3" lg="2" class="fade-up">
          <div class="skill-card" @mouseenter="currentSkillHover = index" @mouseleave="currentSkillHover = null">
            <v-icon size="40" :color="currentSkillHover === index ? 'primary' : 'grey-lighten-1'" class="skill-icon">
              {{ skill.icon || 'mdi-code-tags' }}
            </v-icon>
            <h3 class="skill-name">{{ skill.name }}</h3>
            <div v-if="skill.level" class="skill-stars">
              <v-icon v-for="star in 5" :key="star" size="16" :color="star <= skill.level ? '#fbbf24' : '#e5e7eb'">
                {{ star <= skill.level ? 'mdi-star' : 'mdi-star-outline' }} </v-icon>
            </div>
          </div>
        </v-col>
      </v-row>
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

      <v-row>
        <v-col v-for="project in projects?.results" :key="project.id" cols="12" md="4" class="fade-up">
          <div class="project-card">
            <div class="project-image-wrapper">
              <v-img :src="project.cover || 'https://via.placeholder.com/600x400'" :aspect-ratio="16 / 10" cover
                class="project-image">
                <template v-slot:placeholder>
                  <v-skeleton-loader type="image" />
                </template>
              </v-img>
            </div>

            <div class="project-content">
              <h3 class="project-title">
                {{ project.title }}
              </h3>
              <p class="project-description">
                {{ project.summary }}
              </p>

              <div class="project-tags">
                <span v-for="skill in project.skills?.slice(0, 3)" :key="skill" class="project-tag">
                  {{ skill }}
                </span>
              </div>

              <div class="project-links">
                <a v-if="project.website_url" :href="project.website_url" target="_blank" class="project-link">
                  <v-icon size="20">mdi-web</v-icon>
                  <span>Site</span>
                </a>
                <a v-if="project.repo_url" :href="project.repo_url" target="_blank" class="project-link">
                  <v-icon size="20">mdi-github</v-icon>
                  <span>Código</span>
                </a>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-8">
        <v-col cols="12" class="text-center fade-up">
          <v-btn size="large" variant="text" color="grey-darken-2" class="text-none" to="/projects">
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

      <v-row justify="center">
        <v-col cols="12" md="10" lg="8">
          <div class="timeline">
            <div v-for="exp in experiences?.results" :key="exp.id" class="timeline-item fade-up">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-date">
                  {{ formatDate(exp.start_date) }} -
                  {{ exp.current ? 'Presente' : formatDate(exp.end_date) }}
                </div>
                <h3 class="timeline-title">{{ exp.role }}</h3>
                <p class="timeline-company">{{ exp.company }}</p>
                <p v-if="exp.location" class="timeline-location">
                  <v-icon size="14">mdi-map-marker</v-icon>
                  {{ exp.location }}
                </p>
                <p class="timeline-description">{{ exp.description }}</p>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Education Section -->
    <v-container v-if="educations?.results?.length" class="section-container" id="education">
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

      <v-row>
        <v-col v-for="edu in educations?.results" :key="edu.id" cols="12" md="4" class="fade-up">
          <div class="education-card">
            <v-icon size="32" color="primary" class="education-icon">
              mdi-school
            </v-icon>
            <h3 class="education-degree">{{ edu.degree }}</h3>
            <p class="education-institution">{{ edu.institution }}</p>
            <p class="education-date">
              {{ formatDate(edu.start_date) }} - {{ formatDate(edu.end_date) }}
            </p>
            <p v-if="edu.description" class="education-description">
              {{ edu.description }}
            </p>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Contact Section -->
    <v-container class="section-container" id="contact">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6" class="text-center">
          <div class="contact-wrapper fade-up">
            <h2 class="contact-title">
              {{ getContentBlock('contact_title')?.text || 'Vamos Conversar?' }}
            </h2>
            <p class="contact-subtitle">
              {{ getContentBlock('contact_subtitle')?.text || 'Estou sempre aberto a novos projetos e oportunidades' }}
            </p>

            <div class="contact-links">
              <a :href="getContentBlock('contact_linkedin')?.text || 'https://linkedin.com'" target="_blank"
                class="contact-link">
                <v-icon size="24">mdi-linkedin</v-icon>
              </a>
              <a :href="getContentBlock('contact_github')?.text || 'https://github.com'" target="_blank"
                class="contact-link">
                <v-icon size="24">mdi-github</v-icon>
              </a>
              <a :href="`mailto:${getContentBlock('contact_email')?.text || 'email@example.com'}`" class="contact-link">
                <v-icon size="24">mdi-email</v-icon>
              </a>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Footer -->
    <v-container class="footer-container">
      <v-row>
        <v-col cols="12" class="text-center">
          <p class="footer-text">
            © {{ new Date().getFullYear() }} Leonardo. Todos os direitos reservados.
          </p>
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

/* Skills Section */
.skill-card {
  text-align: center;
  padding: 32px 16px;
  background: white;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid #f3f4f6;
  height: 100%;
  aspect-ratio: 1 / 1;
}

.skill-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  border-color: #e5e7eb;
}

.skill-icon {
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.skill-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.skill-level {
  width: 100%;
  height: 3px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 12px;
}

.skill-level-bar {
  height: 100%;
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
  transition: width 0.6s ease;
}

/* Projects Section */
.project-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f3f4f6;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.project-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  border-color: #e5e7eb;
}

.project-image-wrapper {
  overflow: hidden;
  background: #f9fafb;
}

.project-image {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-card:hover .project-image {
  transform: scale(1.05);
}

.project-content {
  padding: 32px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.project-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.project-description {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
}

.project-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.project-tag {
  font-size: 0.75rem;
  padding: 6px 12px;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 6px;
  font-weight: 500;
}

.project-links {
  display: flex;
  gap: 16px;
}

.project-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.project-link:hover {
  color: #2563eb;
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  position: relative;
  padding-bottom: 48px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -36px;
  top: 6px;
  width: 16px;
  height: 16px;
  background: #2563eb;
  border-radius: 50%;
  border: 3px solid #fafafa;
  z-index: 1;
}

.timeline-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  transition: all 0.3s ease;
}

.timeline-content:hover {
  border-color: #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.timeline-date {
  font-size: 0.875rem;
  color: #2563eb;
  font-weight: 600;
  margin-bottom: 8px;
}

.timeline-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.timeline-company {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 8px;
}

.timeline-location {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.timeline-description {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
}

/* Education Section */
.education-card {
  background: white;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  transition: all 0.3s ease;
  height: 100%;
}

.education-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  border-color: #e5e7eb;
}

.education-icon {
  margin-bottom: 20px;
}

.education-degree {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.education-institution {
  font-size: 1rem;
  color: #2563eb;
  font-weight: 500;
  margin-bottom: 8px;
}

.education-date {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.education-description {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
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

/* Footer */
.footer-container {
  padding: 40px 24px;
  border-top: 1px solid #f3f4f6;
}

.footer-text {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 960px) {
  .section-container {
    padding: 80px 24px;
  }

  .hero-section {
    padding: 60px 24px;
  }

  .timeline {
    padding-left: 32px;
  }

  .timeline-dot {
    left: -30px;
  }
}

@media (max-width: 600px) {
  .section-container {
    padding: 60px 20px;
  }

  .project-content {
    padding: 24px;
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