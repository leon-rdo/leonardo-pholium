<script setup lang="ts">
import type { DjangoListResponse, Project } from '~/types/api';

const config = useRuntimeConfig();

const { data: projects } = await useFetch<DjangoListResponse<Project>>('/api/projects/', {
    baseURL: config.public.apiBase,
    params: { featured: true, limit: 3, status: 'published' }
});
</script>

<template>
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
                    <h3 class="project-title">{{ project.title }}</h3>
                    <p class="project-description">{{ project.summary }}</p>

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
</template>

<style scoped>
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

@media (max-width: 600px) {
    .project-content {
        padding: 24px;
    }
}
</style>