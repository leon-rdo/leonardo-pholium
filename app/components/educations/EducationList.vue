<script setup lang="ts">
import type { DjangoListResponse } from '~/types/api';
import type { Education } from '~/types/portfolio';

const config = useRuntimeConfig();

const { data: educations } = await useFetch<DjangoListResponse<Education>>('/api/educations/', {
    baseURL: config.public.apiBase,
    params: { limit: 3, ordering: '-start_date' }
});

const formatDate = (date: string | null) => {
    if (!date) return 'Presente';
    return new Date(date).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short'
    });
};
</script>

<template>
    <v-row v-if="educations?.results?.length">
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
</template>

<style scoped>
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
</style>