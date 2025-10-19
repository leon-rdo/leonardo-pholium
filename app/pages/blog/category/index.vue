<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { DjangoListResponse } from '~/types/api';
import type { Category } from '~/types/blog';

if (import.meta.client) {
    gsap.registerPlugin(ScrollTrigger);
}

const localePath = useLocalePath();

// Fetch all categories
const { data: categories } = await useApi<DjangoListResponse<Category>>('/api/post-categories/', {
    params: {
        is_active: true,
        ordering: 'order',
        expand: 'images'
    }
});

useSeoMeta({
    title: 'Categorias | Blog',
    description: 'Explore os artigos do blog por categoria'
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
        'web': 'mdi-web',
        'mobile': 'mdi-cellphone',
        'devops': 'mdi-server',
        'ia': 'mdi-robot',
        'segurança': 'mdi-shield-lock',
    };

    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }

    return 'mdi-folder-outline';
};

const getCategoryImage = (category: Category) => {
    const coverImage = category.images?.find(img => img.image_type === 'cover');
    return coverImage?.thumbnail || coverImage?.file || null;
};

onMounted(() => {
    gsap.from('.page-title', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
    });

    gsap.from('.page-description', {
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
    <div class="categories-page">
        <!-- Hero Section -->
        <v-container class="hero-section">
            <v-row justify="center">
                <v-col cols="12" md="10" lg="8" class="text-center">
                    <div class="breadcrumbs mb-6">
                        <NuxtLink :to="localePath('/blog')" class="breadcrumb-link">Blog</NuxtLink>
                        <v-icon size="16" class="breadcrumb-separator">mdi-chevron-right</v-icon>
                        <span class="breadcrumb-current">Categorias</span>
                    </div>

                    <h1 class="page-title mb-6">Categorias</h1>

                    <p class="page-description">
                        Explore os artigos organizados por categoria e encontre o conteúdo que mais interessa você
                    </p>
                </v-col>
            </v-row>
        </v-container>

        <!-- Categories Grid -->
        <v-container class="categories-section">
            <v-row>
                <v-col v-for="category in categories?.results" :key="category.id" cols="12" sm="6" md="4" lg="3"
                    class="fade-up">
                    <NuxtLink :to="localePath(`/blog/category/${category.slug}`)" class="category-card-link">
                        <div class="category-card">
                            <!-- Category Image or Icon -->
                            <div class="category-visual">
                                <div v-if="getCategoryImage(category)" class="category-image-wrapper">
                                    <v-img :src="getCategoryImage(category)!" :aspect-ratio="16 / 9" cover
                                        class="category-image" />
                                    <div class="category-overlay">
                                        <v-icon :icon="getCategoryIcon(category.name)" size="40"
                                            class="category-icon" />
                                    </div>
                                </div>
                                <div v-else class="category-icon-wrapper">
                                    <v-icon :icon="getCategoryIcon(category.name)" size="48" class="category-icon" />
                                </div>
                            </div>

                            <!-- Category Content -->
                            <div class="category-content">
                                <h3 class="category-name">{{ category.name }}</h3>

                                <p v-if="category.description" class="category-description">
                                    {{ category.description }}
                                </p>

                                <div class="category-footer">
                                    <span class="category-link-text">
                                        Ver artigos
                                        <v-icon size="16" end>mdi-arrow-right</v-icon>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </NuxtLink>
                </v-col>

                <!-- Empty State -->
                <v-col v-if="!categories?.results?.length" cols="12" class="text-center py-16">
                    <v-icon size="80" color="grey-lighten-1">mdi-folder-open-outline</v-icon>
                    <p class="text-h6 text-grey-darken-1 mt-4">
                        Nenhuma categoria disponível
                    </p>
                </v-col>
            </v-row>
        </v-container>

        <!-- Back to Blog -->
        <v-container class="back-section">
            <v-row justify="center">
                <v-col cols="12" class="text-center">
                    <v-btn size="large" variant="outlined" color="grey-darken-2" class="text-none"
                        :to="localePath('/blog')">
                        <v-icon start>mdi-arrow-left</v-icon>
                        Voltar para o Blog
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<style scoped>
.categories-page {
    background: #fafafa;
    min-height: 100vh;
}

/* Hero Section */
.hero-section {
    padding: 120px 24px 60px;
    background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
}

.breadcrumbs {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.875rem;
}

.breadcrumb-link {
    color: #6b7280;
    text-decoration: none;
    transition: color 0.2s ease;
}

.breadcrumb-link:hover {
    color: #2563eb;
}

.breadcrumb-separator {
    color: #d1d5db;
}

.breadcrumb-current {
    color: #1a1a1a;
    font-weight: 600;
}

.page-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -0.03em;
    line-height: 1.1;
}

.page-description {
    font-size: clamp(1rem, 2vw, 1.25rem);
    color: #6b7280;
    line-height: 1.6;
    max-width: 700px;
    margin: 0 auto;
}

/* Categories Section */
.categories-section {
    padding: 60px 24px 120px;
    max-width: 1400px;
}

/* Category Card */
.category-card-link {
    text-decoration: none;
    display: block;
    height: 100%;
}

.category-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #f3f4f6;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.category-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
    border-color: #2563eb;
}

/* Category Visual */
.category-visual {
    position: relative;
    overflow: hidden;
}

.category-image-wrapper {
    position: relative;
    background: #f9fafb;
}

.category-image {
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-card:hover .category-image {
    transform: scale(1.1);
}

.category-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.category-card:hover .category-overlay {
    opacity: 1;
}

.category-overlay .category-icon {
    color: white;
}

.category-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    transition: all 0.3s ease;
}

.category-card:hover .category-icon-wrapper {
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
}

.category-icon-wrapper .category-icon {
    color: #2563eb;
    transition: color 0.3s ease;
}

.category-card:hover .category-icon-wrapper .category-icon {
    color: white;
}

/* Category Content */
.category-content {
    padding: 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.category-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 12px;
    line-height: 1.3;
}

.category-description {
    font-size: 0.9375rem;
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 16px;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.category-footer {
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
}

.category-link-text {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.875rem;
    color: #2563eb;
    font-weight: 600;
    transition: gap 0.2s ease;
}

.category-card:hover .category-link-text {
    gap: 8px;
}

/* Back Section */
.back-section {
    padding: 0 24px 80px;
}

/* Responsive */
@media (max-width: 960px) {
    .hero-section {
        padding: 80px 24px 40px;
    }

    .categories-section {
        padding: 40px 24px 80px;
    }
}

@media (max-width: 600px) {
    .hero-section {
        padding: 60px 20px 30px;
    }

    .categories-section {
        padding: 30px 20px 60px;
    }

    .category-content {
        padding: 20px;
    }

    .back-section {
        padding: 0 20px 60px;
    }

    .category-icon-wrapper {
        padding: 40px 20px;
    }
}

/* Hover Effects */
@media (hover: hover) {
    .category-card {
        cursor: pointer;
    }
}
</style>