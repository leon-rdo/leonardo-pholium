<script setup lang="ts">
import type { DjangoListResponse } from '~/types/api';
import type { Category } from '~/types/blog';

const { data: categories } = await useApi<DjangoListResponse<Category>>('/api/blog/post-categories/', {
    params: {
        is_active: true,
        ordering: 'order'
    }
});

const getCategoryIcon = (name: string) => {
    const iconMap: Record<string, string> = {
        'tecnologia': 'mdi-code-tags',
        'desenvolvimento': 'mdi-laptop',
        'design': 'mdi-palette',
        'tutorial': 'mdi-book-open-variant',
        'dicas': 'mdi-lightbulb',
        'notícias': 'mdi-newspaper',
        'carreira': 'mdi-briefcase',
    };

    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }

    return 'mdi-folder';
};
</script>

<template>
    <div class="categories-widget">
        <h3 class="categories-title">Categorias</h3>

        <div class="categories-list">
            <NuxtLink v-for="category in categories?.results" :key="category.id" :to="`/blog?category=${category.id}`"
                class="category-item">
                <v-icon :icon="getCategoryIcon(category.name)" size="20" class="category-icon" />
                <span class="category-name">{{ category.name }}</span>
                <v-icon icon="mdi-chevron-right" size="16" class="category-arrow" />
            </NuxtLink>
        </div>
    </div>
</template>

<style scoped>
.categories-widget {
    background: white;
    padding: 32px;
    border-radius: 12px;
    border: 1px solid #f3f4f6;
}

.categories-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 24px;
}

.categories-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.category-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: #4b5563;
    border-radius: 8px;
    transition: all 0.2s ease;
    margin: -12px -16px;
    position: relative;
}

.category-item:hover {
    background: #f9fafb;
    color: #2563eb;
}

.category-icon {
    color: #9ca3af;
    transition: color 0.2s ease;
}

.category-item:hover .category-icon {
    color: #2563eb;
}

.category-name {
    flex: 1;
    font-size: 0.9375rem;
    font-weight: 500;
}

.category-arrow {
    color: #d1d5db;
    transition: all 0.2s ease;
}

.category-item:hover .category-arrow {
    color: #2563eb;
    transform: translateX(4px);
}
</style>