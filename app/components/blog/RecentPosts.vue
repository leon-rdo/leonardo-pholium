<script setup lang="ts">
import type { DjangoListResponse } from '~/types/api';
import type { Post } from '~/types/blog';

const props = defineProps<{
    limit?: number;
    excludeId?: number;
}>();

const { data: posts } = await useApi<DjangoListResponse<Post<{ category: true }>>>('/api/posts/published/', {
    params: {
        limit: props.limit || 5,
        ordering: '-published_at',
        expand: 'category,images'
    }
});

const filteredPosts = computed(() => {
    let result = posts.value?.results || [];
    if (props.excludeId) {
        result = result.filter(p => p.id !== props.excludeId);
    }
    return result;
});

const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
</script>

<template>
    <div class="recent-posts">
        <h3 class="recent-posts-title">Artigos Recentes</h3>

        <div class="recent-posts-list">
            <NuxtLink v-for="post in filteredPosts" :key="post.id" :to="`/blog/${post.slug}`" class="recent-post-item">
                <div class="recent-post-image">
                    <v-img
                        :src="post.images?.find(img => img.image_type === 'cover')?.thumbnail || 'https://via.placeholder.com/100x80'"
                        :aspect-ratio="5 / 4" cover />
                </div>

                <div class="recent-post-content">
                    <h4 class="recent-post-title">{{ post.title }}</h4>
                    <p class="recent-post-date">{{ formatDate(post.published_at) }}</p>
                </div>
            </NuxtLink>
        </div>
    </div>
</template>

<style scoped>
.recent-posts {
    background: white;
    padding: 32px;
    border-radius: 12px;
    border: 1px solid #f3f4f6;
}

.recent-posts-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 24px;
}

.recent-posts-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.recent-post-item {
    display: flex;
    gap: 16px;
    text-decoration: none;
    transition: all 0.2s ease;
    padding: 12px;
    border-radius: 8px;
    margin: -12px;
}

.recent-post-item:hover {
    background: #f9fafb;
}

.recent-post-image {
    width: 80px;
    height: 64px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f3f4f6;
}

.recent-post-content {
    flex: 1;
    min-width: 0;
}

.recent-post-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.4;
    margin-bottom: 4px;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;
}

.recent-post-item:hover .recent-post-title {
    color: #2563eb;
}

.recent-post-date {
    font-size: 0.75rem;
    color: #9ca3af;
    margin: 0;
}
</style>