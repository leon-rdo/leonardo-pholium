<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ContentBlock, DjangoListResponse, Project, Skill } from '~/types/api';
import ProjectList from '~/components/projects/ProjectList.vue';

if (import.meta.client) {
    gsap.registerPlugin(ScrollTrigger);
}

const config = useRuntimeConfig();

// Fetch content blocks for projects page
const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
    'projects-content-blocks',
    '/api/content-blocks/',
    { page_name: 'projects' }
);

const getContentBlock = (key: string) => {
    return contentBlocks.value?.results?.find(block => block.key === key);
};

// Fetch all projects
const { data: projects } = await useApi<DjangoListResponse<Project>>('/api/projects/', {
    params: { expand: 'skills', limit: 3, status: 'published' }
});

useSeoMeta({
    title: getContentBlock('page_title')?.text || 'Projetos | Leonardo',
    description: getContentBlock('page_description')?.text || 'Conheça todos os meus projetos e trabalhos'
});

const selectedFilter = ref('all');
const filters = computed(() => {
    const allSkills = new Set<string>();
    projects.value?.results?.forEach(project => {
        project.skills?.forEach(skill => {
            if (typeof skill === 'object' && skill.name) {
                allSkills.add(skill.name);
            }
        });
    });
    return ['all', ...Array.from(allSkills)];
});

const filteredProjects = computed(() => {
    if (selectedFilter.value === 'all') {
        return projects.value?.results || [];
    }
    return projects.value?.results?.filter(project =>
        project.skills?.some(skill =>
            typeof skill === 'object' && skill.name === selectedFilter.value
        )
    ) || [];
});

onMounted(() => {
    gsap.from('.page-title', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
    });

    gsap.from('.page-subtitle', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
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
    <div class="projects-page">
        <!-- Hero Section -->
        <v-container class="hero-section">
            <v-row justify="center">
                <v-col cols="12" md="10" lg="8" class="text-center">
                    <h1 class="page-title mb-6">
                        {{ getContentBlock('hero_title')?.text || 'Meus Projetos' }}
                    </h1>
                    <p class="page-subtitle">
                        {{ getContentBlock('hero_subtitle')?.text || 'Uma coleção dos meus trabalhos mais recentes e projetos pessoais' }}
                    </p>
                </v-col>
            </v-row>
        </v-container>

        <!-- Filters Section -->
        <v-container class="filters-section">
            <v-row justify="center">
                <v-col cols="12" md="10">
                    <div class="filters-wrapper fade-up">
                        <v-chip-group v-model="selectedFilter" mandatory color="primary" class="filters-chips">
                            <v-chip v-for="filter in filters" :key="filter" :value="filter" class="filter-chip">
                                {{ filter === 'all' ? 'Todos' : filter }}
                            </v-chip>
                        </v-chip-group>
                    </div>
                </v-col>
            </v-row>
        </v-container>

        <!-- Projects Grid -->
        <v-container class="projects-section">
            <ProjectList :featuredOnly="false" :projects="filteredProjects" md-cols="6" lg-cols="4" />

            <v-row v-if="filteredProjects.length === 0">
                <v-col cols="12" class="text-center py-16">
                    <v-icon size="80" color="grey-lighten-1">mdi-folder-open-outline</v-icon>
                    <p class="text-h6 text-grey-darken-1 mt-4">
                        Nenhum projeto encontrado com este filtro
                    </p>
                </v-col>
            </v-row>
        </v-container>

        <!-- CTA Section -->
        <v-container class="cta-section">
            <v-row justify="center">
                <v-col cols="12" md="8" lg="6" class="text-center fade-up">
                    <h2 class="cta-title">
                        {{ getContentBlock('cta_title')?.text || 'Gostou do que viu?' }}
                    </h2>
                    <p class="cta-subtitle mb-8">
                        {{ getContentBlock('cta_subtitle')?.text || 'Vamos trabalhar juntos no seu próximo projeto' }}
                    </p>
                    <v-btn size="large" color="primary" class="text-none px-8" to="/#contact">
                        {{ getContentBlock('cta_button')?.text || 'Entre em Contato' }}
                        <v-icon end>mdi-arrow-right</v-icon>
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<style scoped>
.projects-page {
    background: #fafafa;
    min-height: 100vh;
}

/* Hero Section */
.hero-section {
    padding: 120px 24px 60px;
    background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
}

.page-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0;
}

.page-subtitle {
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: #6b7280;
    font-weight: 400;
    line-height: 1.6;
    max-width: 700px;
    margin: 0 auto;
}

/* Filters Section */
.filters-section {
    padding: 40px 24px;
}

.filters-wrapper {
    display: flex;
    justify-content: center;
}

.filters-chips {
    justify-content: center;
}

.filter-chip {
    text-transform: capitalize;
    font-weight: 600;
}

/* Projects Section */
.projects-section {
    padding: 60px 24px 120px;
    max-width: 1400px;
}

/* CTA Section */
.cta-section {
    padding: 80px 24px 120px;
    background: white;
}

.cta-title {
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -0.02em;
    margin-bottom: 16px;
}

.cta-subtitle {
    font-size: 1.125rem;
    color: #6b7280;
    line-height: 1.6;
}

/* Responsive */
@media (max-width: 960px) {
    .hero-section {
        padding: 80px 24px 40px;
    }

    .projects-section {
        padding: 40px 24px 80px;
    }

    .cta-section {
        padding: 60px 24px 80px;
    }
}

@media (max-width: 600px) {
    .hero-section {
        padding: 60px 20px 30px;
    }

    .projects-section {
        padding: 30px 20px 60px;
    }

    .cta-section {
        padding: 50px 20px 60px;
    }
}
</style>