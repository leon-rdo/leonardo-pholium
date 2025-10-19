<script setup lang="ts">
import type { DjangoListResponse } from '~/types/api';
import type { Testimonial } from '~/types/content';

const { data: testimonials } = await useApi<DjangoListResponse<Testimonial>>('/api/testimonials/', {
    params: {
        ordering: 'order',
        limit: 10
    }
});

const currentIndex = ref(0);
const autoPlayInterval = ref<NodeJS.Timeout | null>(null);

const currentTestimonial = computed(() => {
    return testimonials.value?.results?.[currentIndex.value];
});

const nextTestimonial = () => {
    if (!testimonials.value?.results?.length) return;
    currentIndex.value = (currentIndex.value + 1) % testimonials.value.results.length;
};

const prevTestimonial = () => {
    if (!testimonials.value?.results?.length) return;
    currentIndex.value = currentIndex.value === 0
        ? testimonials.value.results.length - 1
        : currentIndex.value - 1;
};

const goToTestimonial = (index: number) => {
    currentIndex.value = index;
    resetAutoPlay();
};

const startAutoPlay = () => {
    if (testimonials.value?.results && testimonials.value.results.length > 1) {
        autoPlayInterval.value = setInterval(nextTestimonial, 6000);
    }
};

const stopAutoPlay = () => {
    if (autoPlayInterval.value) {
        clearInterval(autoPlayInterval.value);
        autoPlayInterval.value = null;
    }
};

const resetAutoPlay = () => {
    stopAutoPlay();
    startAutoPlay();
};

onMounted(() => {
    startAutoPlay();
});

onUnmounted(() => {
    stopAutoPlay();
});
</script>

<template>
    <div v-if="testimonials?.results?.length" class="testimonials-section">
        <div class="testimonials-container">
            <!-- Current Testimonial -->
            <Transition name="fade" mode="out-in">
                <div v-if="currentTestimonial" :key="currentTestimonial.id" class="testimonial-card">
                    <!-- Quote Icon -->
                    <div class="quote-icon">
                        <v-icon size="48" color="primary">mdi-format-quote-open</v-icon>
                    </div>

                    <!-- Testimonial Text -->
                    <p class="testimonial-text">{{ currentTestimonial.text }}</p>

                    <!-- Author Info -->
                    <div class="testimonial-author">
                        <div v-if="currentTestimonial.photo" class="author-photo">
                            <v-img :src="currentTestimonial.photo" :alt="currentTestimonial.author_name" cover
                                class="photo-img" />
                        </div>
                        <div v-else class="author-photo-placeholder">
                            <v-icon size="32" color="grey-lighten-1">mdi-account-circle</v-icon>
                        </div>

                        <div class="author-info">
                            <h4 class="author-name">{{ currentTestimonial.author_name }}</h4>
                            <p class="author-role">
                                {{ currentTestimonial.author_role }}
                                <span v-if="currentTestimonial.company"> • {{ currentTestimonial.company }}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- Navigation -->
            <div v-if="testimonials.results.length > 1" class="testimonials-navigation">
                <!-- Prev Button -->
                <v-btn icon variant="text" size="small" @click="prevTestimonial" class="nav-btn"
                    aria-label="Testemunho anterior">
                    <v-icon>mdi-chevron-left</v-icon>
                </v-btn>

                <!-- Dots Indicator -->
                <div class="dots-indicator">
                    <button v-for="(_, index) in testimonials.results" :key="index" class="dot"
                        :class="{ active: index === currentIndex }" @click="goToTestimonial(index)"
                        :aria-label="`Ir para testemunho ${index + 1}`" />
                </div>

                <!-- Next Button -->
                <v-btn icon variant="text" size="small" @click="nextTestimonial" class="nav-btn"
                    aria-label="Próximo testemunho">
                    <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </div>
        </div>
    </div>
</template>

<style scoped>
.testimonials-section {
    padding: 80px 0;
}

.testimonials-container {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
}

/* Testimonial Card */
.testimonial-card {
    background: white;
    padding: 60px 48px;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    position: relative;
    border: 1px solid #f3f4f6;
}

.quote-icon {
    position: absolute;
    top: 24px;
    left: 24px;
    opacity: 0.15;
}

.testimonial-text {
    font-size: 1.125rem;
    line-height: 1.8;
    color: #1a1a1a;
    margin-bottom: 40px;
    position: relative;
    z-index: 1;
    font-style: italic;
}

/* Author Section */
.testimonial-author {
    display: flex;
    align-items: center;
    gap: 20px;
    padding-top: 32px;
    border-top: 2px solid #f3f4f6;
}

.author-photo,
.author-photo-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 3px solid #f3f4f6;
}

.author-photo-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
}

.photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.author-info {
    flex: 1;
}

.author-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 4px;
}

.author-role {
    font-size: 0.9375rem;
    color: #6b7280;
    margin: 0;
}

/* Navigation */
.testimonials-navigation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    margin-top: 40px;
}

.nav-btn {
    color: #6b7280;
    transition: all 0.2s ease;
}

.nav-btn:hover {
    color: #2563eb;
    background: #f3f4f6;
}

/* Dots Indicator */
.dots-indicator {
    display: flex;
    gap: 12px;
    align-items: center;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #d1d5db;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
}

.dot:hover {
    background: #9ca3af;
    transform: scale(1.2);
}

.dot.active {
    width: 32px;
    border-radius: 5px;
    background: #2563eb;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 960px) {
    .testimonial-card {
        padding: 48px 36px;
    }

    .testimonial-text {
        font-size: 1rem;
    }
}

@media (max-width: 600px) {
    .testimonials-section {
        padding: 60px 0;
    }

    .testimonial-card {
        padding: 40px 24px;
    }

    .quote-icon {
        top: 16px;
        left: 16px;
    }

    .quote-icon :deep(.v-icon) {
        font-size: 36px !important;
    }

    .testimonial-text {
        font-size: 0.9375rem;
        margin-bottom: 32px;
    }

    .testimonial-author {
        flex-direction: column;
        text-align: center;
        padding-top: 24px;
    }

    .author-photo,
    .author-photo-placeholder {
        width: 56px;
        height: 56px;
    }

    .testimonials-navigation {
        margin-top: 32px;
        gap: 16px;
    }
}

/* Dark Mode Support */
/* @media (prefers-color-scheme: dark) {
  .testimonial-card {
    background: #1e293b;
    border-color: #334155;
  }

  .testimonial-text {
    color: #f1f5f9;
  }

  .testimonial-author {
    border-top-color: #334155;
  }

  .author-name {
    color: #f1f5f9;
  }

  .author-role {
    color: #94a3b8;
  }

  .author-photo,
  .author-photo-placeholder {
    border-color: #334155;
  }

  .author-photo-placeholder {
    background: #334155;
  }
} */
</style>