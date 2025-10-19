<script setup lang="ts">
import type { DjangoListResponse } from '~/types/api';
import type { Skill } from '~/types/portfolio';

const { data: skills } = await useApi<DjangoListResponse<Skill>>('/api/skills/', {
    params: { limit: 6, ordering: '-level' }
});

const currentSkillHover = ref<number | null>(null);
</script>

<template>
    <v-row>
        <v-col v-for="(skill, index) in skills?.results" :key="skill.id" cols="6" sm="4" md="3" lg="2" class="fade-up">
            <div class="skill-card" @mouseenter="currentSkillHover = index" @mouseleave="currentSkillHover = null">
                <v-icon size="40" :color="currentSkillHover === index ? 'primary' : 'grey-lighten-1'"
                    class="skill-icon">
                    {{ skill.icon || 'mdi-code-tags' }}
                </v-icon>
                <h3 class="skill-name">{{ skill.name }}</h3>
                <div v-if="skill.level" class="skill-stars">
                    <v-icon v-for="star in 5" :key="star" size="16"
                        :color="star <= skill.level ? '#fbbf24' : '#e5e7eb'">
                        {{ star <= skill.level ? 'mdi-star' : 'mdi-star-outline' }} </v-icon>
                </div>
            </div>
        </v-col>
    </v-row>
</template>

<style scoped>
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
</style>