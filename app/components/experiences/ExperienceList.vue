<script setup lang="ts">
import type { DjangoListResponse, Experience } from '~/types/api';

const { data: experiences } = await useApi<DjangoListResponse<Experience>>('/api/experiences/', {
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
</template>

<style scoped>
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

@media (max-width: 960px) {
    .timeline {
        padding-left: 32px;
    }

    .timeline-dot {
        left: -30px;
    }
}
</style>