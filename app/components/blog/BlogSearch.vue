<script setup lang="ts">
import type { DjangoListResponse } from '~/types/api';
import type { Post, Category } from '~/types/blog';

const searchQuery = ref('');
const isSearching = ref(false);
const showResults = ref(false);
const searchResults = ref<Post[]>([]);

let searchTimeout: NodeJS.Timeout;

const performSearch = async () => {
    if (!searchQuery.value.trim()) {
        showResults.value = false;
        searchResults.value = [];
        return;
    }

    isSearching.value = true;

    try {
        const { data } = await useApi<DjangoListResponse<Post>>('/api/blog/posts/published/', {
            params: {
                search: searchQuery.value,
                limit: 5,
                expand: 'category'
            }
        });

        searchResults.value = data.value?.results || [];
        showResults.value = true;
    } catch (error) {
        console.error('Search error:', error);
    } finally {
        isSearching.value = false;
    }
};

watch(searchQuery, (newVal) => {
    clearTimeout(searchTimeout);

    if (!newVal.trim()) {
        showResults.value = false;
        searchResults.value = [];
        return;
    }

    searchTimeout = setTimeout(() => {
        performSearch();
    }, 500);
});

const getCategoryName = (category: number | Category | null) => {
    if (!category || typeof category !== 'object') return '';
    return category.name;
};

const closeSearch = () => {
    showResults.value = false;
};

const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR', {
        month: 'short',
        day: 'numeric'
    });
};
</script>

<template>
    <div class="blog-search">
        <div class="search-input-wrapper">
            <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" placeholder="Buscar artigos..."
                variant="outlined" density="comfortable" hide-details class="search-field"
                @focus="showResults = searchQuery.length > 0">
                <template v-slot:append-inner v-if="isSearching">
                    <v-progress-circular indeterminate size="20" width="2" color="primary" />
                </template>
            </v-text-field>
        </div>

        <!-- Search Results Dropdown -->
        <Transition name="fade">
            <div v-if="showResults" class="search-results-dropdown">
                <div v-if="searchResults.length" class="search-results">
                    <NuxtLink v-for="post in searchResults" :key="post.id" :to="`/blog/${post.slug}`"
                        class="search-result-item" @click="closeSearch">
                        <div class="search-result-image">
                            <v-img :src="post.featured_image || 'https://via.placeholder.com/80x60'"
                                :aspect-ratio="4 / 3" cover />
                        </div>

                        <div class="search-result-content">
                            <span v-if="getCategoryName(post.category)" class="search-result-category">
                                {{ getCategoryName(post.category) }}
                            </span>
                            <h4 class="search-result-title">{{ post.title }}</h4>
                            <p class="search-result-meta">
                                <span>{{ formatDate(post.published_at) }}</span>
                                <span>•</span>
                                <span>{{ post.reading_time }} min</span>
                            </p>
                        </div>
                    </NuxtLink>

                    <NuxtLink to="/blog" class="search-results-footer" @click="closeSearch">
                        Ver todos os resultados
                        <v-icon size="16" end>mdi-arrow-right</v-icon>
                    </NuxtLink>
                </div>

                <div v-else class="search-results-empty">
                    <v-icon size="48" color="grey-lighten-2">mdi-text-box-search-outline</v-icon>
                    <p class="search-empty-text">Nenhum resultado encontrado</p>
                </div>
            </div>
        </Transition>

        <!-- Backdrop -->
        <Transition name="fade">
            <div v-if="showResults" class="search-backdrop" @click="closeSearch" />
        </Transition>
    </div>
</template>

<style scoped>
.blog-search {
    position: relative;
    width: 100%;
    max-width: 600px;
}

.search-input-wrapper {
    position: relative;
    z-index: 1001;
}

.search-field {
    background: white;
    border-radius: 12px;
}

/* Search Results Dropdown */
.search-results-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: white;
    border-radius: 12px;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    z-index: 1001;
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
}

.search-results {
    padding: 8px;
}

.search-result-item {
    display: flex;
    gap: 16px;
    padding: 12px;
    text-decoration: none;
    border-radius: 8px;
    transition: background 0.2s ease;
}

.search-result-item:hover {
    background: #f9fafb;
}

.search-result-image {
    width: 80px;
    height: 60px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f3f4f6;
}

.search-result-content {
    flex: 1;
    min-width: 0;
}

.search-result-category {
    font-size: 0.75rem;
    color: #2563eb;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.search-result-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 4px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.search-result-meta {
    font-size: 0.75rem;
    color: #9ca3af;
    display: flex;
    gap: 6px;
    margin: 0;
}

.search-results-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 12px;
    text-decoration: none;
    color: #2563eb;
    font-size: 0.875rem;
    font-weight: 600;
    border-top: 1px solid #f3f4f6;
    margin-top: 8px;
    transition: background 0.2s ease;
}

.search-results-footer:hover {
    background: #f9fafb;
}

.search-results-empty {
    text-align: center;
    padding: 48px 24px;
}

.search-empty-text {
    font-size: 0.9375rem;
    color: #9ca3af;
    margin-top: 12px;
}

/* Backdrop */
.search-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1000;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Scrollbar */
.search-results-dropdown::-webkit-scrollbar {
    width: 8px;
}

.search-results-dropdown::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 0 12px 12px 0;
}

.search-results-dropdown::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;
}

.search-results-dropdown::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Responsive */
@media (max-width: 600px) {
    .search-results-dropdown {
        max-height: 400px;
    }

    .search-result-image {
        width: 60px;
        height: 45px;
    }
}
</style>