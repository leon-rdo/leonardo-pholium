<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ContentBlock, DjangoListResponse, Education, Experience, Project, Skill } from '~/types/api';

// Registrar plugin GSAP
if (process.client) {
  gsap.registerPlugin(ScrollTrigger);
}

// Meta tags SEO
useSeoMeta({
  title: 'Portfolio | Leonardo',
  description: 'Desenvolvedor Full Stack - Criando experiências digitais excepcionais',
});

const config = useRuntimeConfig();

// Buscar content blocks para a homepage
const { data: contentBlocks } = await useFetch<DjangoListResponse<ContentBlock>>('/api/content-blocks/', {
  baseURL: config.public.apiBase,
  params: { page_name: 'home' }
});

// Função helper para pegar content block por key
const getContentBlock = (key: string) => {
  return contentBlocks.value?.results?.find(block => block.key === key);
};

// Buscar dados do backend
const { data: skills } = await useFetch<DjangoListResponse<Skill>>('/api/skills/', {
  baseURL: config.public.apiBase,
  params: { limit: 6 }
});

const { data: projects } = await useFetch<DjangoListResponse<Project>>('/api/projects/', {
  baseURL: config.public.apiBase,
  params: { featured: true, limit: 3, status: 'published' }
});

const { data: experiences } = await useFetch<DjangoListResponse<Experience>>('/api/experiences/', {
  baseURL: config.public.apiBase,
  params: { limit: 3, ordering: '-start_date' }
});

const { data: educations } = await useFetch<DjangoListResponse<Education>>('/api/educations/', {
  baseURL: config.public.apiBase,
  params: { limit: 3, ordering: '-start_date' }
});

// Animações on mounted
onMounted(() => {
  // Animação hero
  gsap.from('.hero-title', {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: 'power3.out'
  });

  gsap.from('.hero-subtitle', {
    y: 30,
    opacity: 0,
    duration: 1,
    delay: 0.3,
    ease: 'power3.out'
  });

  gsap.from('.hero-cta', {
    scale: 0.9,
    opacity: 0,
    duration: 0.8,
    delay: 0.6,
    ease: 'back.out(1.7)'
  });

  // Animações scroll-triggered
  gsap.utils.toArray('.fade-up').forEach((element: any) => {
    gsap.from(element, {
      y: 60,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: element,
        start: 'top 85%',
        once: true
      }
    });
  });

  gsap.utils.toArray('.scale-in').forEach((element: any) => {
    gsap.from(element, {
      scale: 0.95,
      opacity: 0,
      duration: 0.8,
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        once: true
      }
    });
  });
});

// Estados reativos
const currentSkillHover = ref<number | null>(null);
const isLoading = ref(false);

// Navegação suave
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

// Formatação de datas
const formatDate = (date: string | null) => {
  if (!date) return 'Presente';
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short'
  });
};

// Renderizar markdown se necessário
const renderContent = (content: string, kind: string = 'text') => {
  if (kind === 'markdown' && process.client) {
    // Importar marked dinamicamente no cliente
    import('marked').then(({ marked }) => {
      return marked(content);
    });
  }
  return content;
};
</script>

<template>
  <div class="portfolio-home">
    <!-- Hero Section -->
    <v-container fluid class="hero-section pa-0">
      <v-row class="hero-content" align="center" justify="center" no-gutters>
        <v-col cols="12" md="10" lg="8" class="text-center px-4">
          <div class="hero-wrapper">
            <h1 class="hero-title text-h1 text-md-h1 font-weight-bold mb-4">
              {{ getContentBlock('hero_greeting')?.text || 'Olá, eu sou' }}
              <span class="gradient-text">{{ getContentBlock('hero_name')?.text || 'Leonardo' }}</span>
            </h1>
            <p class="hero-subtitle text-h5 text-md-h4 font-weight-light mb-8 text-grey">
              {{ getContentBlock('hero_subtitle')?.text || 'Full Stack Developer & Creative Problem Solver' }}
            </p>

            <div class="hero-cta d-flex justify-center gap-4 flex-wrap">
              <v-btn size="x-large" rounded="pill" color="primary" elevation="0" class="px-8"
                @click="scrollToSection('projects')">
                {{ getContentBlock('hero_cta_projects')?.text || 'Ver Projetos' }}
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
              <v-btn size="x-large" rounded="pill" variant="outlined" class="px-8" @click="scrollToSection('contact')">
                {{ getContentBlock('hero_cta_contact')?.text || 'Entrar em Contato' }}
              </v-btn>
            </div>

            <!-- Scroll indicator -->
            <div class="scroll-indicator mt-16">
              <v-icon size="40" class="scroll-arrow">mdi-chevron-down</v-icon>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- About Section (from content blocks) -->
    <v-container v-if="getContentBlock('about_intro')" class="about-section py-16">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6" class="text-center">
          <h2 class="text-h3 font-weight-bold fade-up mb-6">
            {{ getContentBlock('about_title')?.text || 'Sobre Mim' }}
          </h2>
          <div v-if="getContentBlock('about_intro')?.kind === 'html'" class="text-body-1 fade-up"
            v-html="getContentBlock('about_intro')?.text" />
          <p v-else class="text-body-1 fade-up">
            {{ getContentBlock('about_intro')?.text }}
          </p>
        </v-col>
      </v-row>
    </v-container>

    <!-- Skills Section -->
    <v-container class="skills-section py-16" id="skills">
      <v-row>
        <v-col cols="12" class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold fade-up mb-4">
            {{ getContentBlock('skills_title')?.text || 'Habilidades' }}
          </h2>
          <p class="text-h6 text-grey fade-up">
            {{ getContentBlock('skills_subtitle')?.text || 'Tecnologias que domino' }}
          </p>
        </v-col>
      </v-row>

      <v-row justify="center">
        <v-col v-for="(skill, index) in skills?.results" :key="skill.id" cols="6" sm="4" md="3" lg="2" class="fade-up">
          <v-card flat class="skill-card pa-4 text-center" :elevation="currentSkillHover === index ? 8 : 0"
            @mouseenter="currentSkillHover = index" @mouseleave="currentSkillHover = null">
            <v-icon size="48" :color="currentSkillHover === index ? 'primary' : 'grey'" class="mb-3 skill-icon">
              {{ skill.icon || 'mdi-code-tags' }}
            </v-icon>
            <h3 class="text-body-1 font-weight-medium">{{ skill.name }}</h3>
            <v-rating v-if="skill.level" :model-value="skill.level" density="compact" size="small" readonly
              color="primary" class="mt-2" />
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Projects Section -->
    <v-container class="projects-section py-16" id="projects">
      <v-row>
        <v-col cols="12" class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold fade-up mb-4">
            {{ getContentBlock('projects_title')?.text || 'Projetos em Destaque' }}
          </h2>
          <p class="text-h6 text-grey fade-up">
            {{ getContentBlock('projects_subtitle')?.text || 'Alguns dos meus trabalhos recentes' }}
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col v-for="project in projects?.results" :key="project.id" cols="12" md="4" class="scale-in">
          <v-card flat class="project-card" :elevation="0" height="100%">
            <v-img :src="project.cover || 'https://via.placeholder.com/600x400'" height="250" cover
              class="project-image">
              <template v-slot:placeholder>
                <v-skeleton-loader type="image" />
              </template>
            </v-img>

            <v-card-text class="pa-6">
              <h3 class="text-h5 font-weight-bold mb-3">
                {{ project.title }}
              </h3>
              <p class="text-body-1 text-grey mb-4">
                {{ project.summary }}
              </p>

              <div class="d-flex gap-2 flex-wrap mb-4">
                <v-chip v-for="skill in project.skills?.slice(0, 3)" :key="skill" size="small" variant="tonal"
                  color="primary">
                  {{ skill }}
                </v-chip>
              </div>

              <div class="d-flex gap-2">
                <v-btn v-if="project.website_url" icon="mdi-web" size="small" variant="tonal"
                  :href="project.website_url" target="_blank" />
                <v-btn v-if="project.repo_url" icon="mdi-github" size="small" variant="tonal" :href="project.repo_url"
                  target="_blank" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-8">
        <v-col cols="12" class="text-center">
          <v-btn size="large" rounded="pill" variant="outlined" to="/projects">
            {{ getContentBlock('projects_cta')?.text || 'Ver Todos os Projetos' }}
            <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Experience Section -->
    <v-container class="experience-section py-16" id="experience">
      <v-row>
        <v-col cols="12" class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold fade-up mb-4">
            {{ getContentBlock('experience_title')?.text || 'Experiência' }}
          </h2>
          <p class="text-h6 text-grey fade-up">
            {{ getContentBlock('experience_subtitle')?.text || 'Minha trajetória profissional' }}
          </p>
        </v-col>
      </v-row>

      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-timeline side="end" align="start" line-inset="12" truncate-line="both">
            <v-timeline-item v-for="exp in experiences?.results" :key="exp.id" dot-color="primary" size="small"
              class="fade-up">
              <template v-slot:opposite>
                <div class="text-caption text-grey">
                  {{ formatDate(exp.start_date) }} -
                  {{ exp.current ? 'Presente' : formatDate(exp.end_date) }}
                </div>
              </template>

              <v-card flat class="pa-4 experience-card">
                <h3 class="text-h6 font-weight-bold mb-1">
                  {{ exp.role }}
                </h3>
                <p class="text-body-2 text-primary mb-2">
                  {{ exp.company }}
                </p>
                <p v-if="exp.location" class="text-caption text-grey mb-2">
                  <v-icon size="small">mdi-map-marker</v-icon>
                  {{ exp.location }}
                </p>
                <p class="text-body-2 text-grey">
                  {{ exp.description }}
                </p>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-col>
      </v-row>
    </v-container>

    <!-- Education Section -->
    <v-container v-if="educations?.results?.length" class="education-section py-16" id="education">
      <v-row>
        <v-col cols="12" class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold fade-up mb-4">
            {{ getContentBlock('education_title')?.text || 'Educação' }}
          </h2>
          <p class="text-h6 text-grey fade-up">
            {{ getContentBlock('education_subtitle')?.text || 'Minha formação acadêmica' }}
          </p>
        </v-col>
      </v-row>

      <v-row justify="center">
        <v-col v-for="edu in educations?.results" :key="edu.id" cols="12" md="4" class="fade-up">
          <v-card flat class="pa-6 education-card h-100">
            <v-icon size="48" color="primary" class="mb-4">mdi-school</v-icon>
            <h3 class="text-h6 font-weight-bold mb-2">
              {{ edu.degree }}
            </h3>
            <p class="text-body-1 text-primary mb-2">
              {{ edu.institution }}
            </p>
            <p class="text-caption text-grey mb-3">
              {{ formatDate(edu.start_date) }} - {{ formatDate(edu.end_date) }}
            </p>
            <p v-if="edu.description" class="text-body-2 text-grey">
              {{ edu.description }}
            </p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Contact Section -->
    <v-container class="contact-section py-16 text-center" id="contact">
      <v-row justify="center">
        <v-col cols="12" md="6" lg="5">
          <h2 class="text-h3 font-weight-bold fade-up mb-4">
            {{ getContentBlock('contact_title')?.text || 'Vamos Conversar?' }}
          </h2>
          <p class="text-h6 text-grey fade-up mb-8">
            {{ getContentBlock('contact_subtitle')?.text || 'Estou sempre aberto a novos projetos e oportunidades' }}
          </p>

          <div class="d-flex justify-center gap-3 fade-up">
            <v-btn icon="mdi-linkedin" size="large" variant="tonal"
              :href="getContentBlock('contact_linkedin')?.text || 'https://linkedin.com'" target="_blank" />
            <v-btn icon="mdi-github" size="large" variant="tonal"
              :href="getContentBlock('contact_github')?.text || 'https://github.com'" target="_blank" />
            <v-btn icon="mdi-email" size="large" variant="tonal"
              :href="`mailto:${getContentBlock('contact_email')?.text || 'email@example.com'}`" />
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.portfolio-home {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  color: white;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.9) !important;
}

.scroll-indicator {
  position: relative;
  animation: bounce 2s infinite;
}

.scroll-arrow {
  color: rgba(255, 255, 255, 0.7);
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-10px);
  }

  60% {
    transform: translateY(-5px);
  }
}

/* About Section */
.about-section {
  background: linear-gradient(180deg, transparent 0%, rgba(103, 126, 234, 0.03) 100%);
}

/* Skills Section */
.skill-card {
  transition: all 0.3s ease;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.skill-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.1);
}

.skill-icon {
  transition: all 0.3s ease;
}

/* Projects Section */
.projects-section {
  background: linear-gradient(180deg, transparent 0%, rgba(103, 126, 234, 0.05) 100%);
}

.project-card {
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(103, 126, 234, 0.1);
}

.project-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(103, 126, 234, 0.2) !important;
}

.project-image {
  transition: transform 0.5s ease;
}

.project-card:hover .project-image {
  transform: scale(1.05);
}

/* Experience Section */
.experience-card {
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.experience-card:hover {
  border-left-color: #667eea;
  transform: translateX(5px);
  background: rgba(103, 126, 234, 0.05);
}

/* Education Section */
.education-section {
  background: linear-gradient(180deg, transparent 0%, rgba(118, 75, 162, 0.03) 100%);
}

.education-card {
  transition: all 0.3s ease;
  cursor: pointer;
  border-top: 3px solid transparent;
}

.education-card:hover {
  border-top-color: #667eea;
  transform: translateY(-5px);
  background: rgba(103, 126, 234, 0.05);
}

/* Contact Section */
.contact-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 24px;
  margin-top: 16px;
}

.contact-section h2,
.contact-section p {
  color: white !important;
}

/* Responsive */
@media (max-width: 960px) {
  .hero-title {
    font-size: 2.5rem !important;
  }

  .hero-subtitle {
    font-size: 1.25rem !important;
  }
}
</style>