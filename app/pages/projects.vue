<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ContentBlock, DjangoListResponse, Project, Skill } from '~/types/api';

if (import.meta.client) {
    gsap.registerPlugin(ScrollTrigger);
}

const config = useRuntimeConfig();

// Fetch content blocks for projects page
const { data: contentBlocks } = await useAsyncData('projects-content-blocks', async () => {
    let url: string | null = '/api/content-blocks/';
    const allResults: ContentBlock[] = [];

    while (url) {
        const response: DjangoListResponse<ContentBlock> = await $fetch<DjangoListResponse<ContentBlock>>(url, {
            baseURL: url.startsWith('http') ? undefined : config.public.apiBase,
            params: url.startsWith('http') ? undefined : { page_name: 'projects' },
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

// Fetch all projects
const { data: projects } = await useFetch<DjangoListResponse<Project>>('/api/projects/', {
    baseURL: config.public.apiBase,
    params: { expand: 'skills', status: 'published', ordering: '-created_at' },
    headers: { 'Accept-Language': 'en-us' }
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

// Helper function to get skills as objects
const getSkillsAsObjects = (skills: (number | Skill)[] | undefined) => {
    return skills?.filter((skill): skill is Skill => typeof skill === 'object') || [];
};

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
            <v-row>
                <v-col v-for="project in filteredProjects" :key="project.id" cols="12" md="6" lg="4" class="fade-up">
                    <div class="project-card">
                        <div class="project-image-wrapper">
                            <v-img :src="project.cover || 'https://via.placeholder.com/600x400'" :aspect-ratio="16 / 10"
                                cover class="project-image">
                                <template v-slot:placeholder>
                                    <v-skeleton-loader type="image" />
                                </template>
                            </v-img>
                            <div v-if="project.featured" class="featured-badge">
                                <v-icon size="16">mdi-star</v-icon>
                                Destaque
                            </div>
                        </div>

                        <div class="project-content">
                            <h3 class="project-title">{{ project.title }}</h3>
                            <p class="project-description">{{ project.summary }}</p>

                            <div class="project-tags">
                                <span v-for="skill in getSkillsAsObjects(project.skills).slice(0, 4)" :key="skill.id"
                                    class="project-tag">
                                    {{ skill.name }}
                                </span>
                            </div>

                            <div class="project-links">
                                <a v-if="project.website_url" :href="project.website_url" target="_blank"
                                    class="project-link">
                                    <v-icon size="20">mdi-web</v-icon>
                                    <span>Site</span>
                                </a>
                                <a v-if="project.repo_url" :href="project.repo_url" target="_blank"
                                    class="project-link">
                                    <v-icon size="20">mdi-github</v-icon>
                                    <span>Código</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </v-col>
            </v-row>

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
    position: relative;
    overflow: hidden;
    background: #f9fafb;
}

.project-image {
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-card:hover .project-image {
    transform: scale(1.05);
}

.featured-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(37, 99, 235, 0.95);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(8px);
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
    line-height: 1.3;
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

    .project-content {
        padding: 24px;
    }

    .cta-section {
        padding: 50px 20px 60px;
    }
}
</style>