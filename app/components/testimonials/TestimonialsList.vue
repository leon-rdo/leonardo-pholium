<script setup lang="ts">
import type { DjangoListResponse } from "~/types/api";
import type { Testimonial } from "~/types/content";

const { data: testimonials } = await useApi<DjangoListResponse<Testimonial>>(
  "/api/testimonials/",
  {
    params: {
      ordering: "order",
      limit: 10,
    },
  }
);

const currentIndex = ref(0);
const autoPlayInterval = ref<NodeJS.Timeout | null>(null);
const textContainerRef = ref<HTMLElement | null>(null);

const currentTestimonial = computed(() => {
  return testimonials.value?.results?.[currentIndex.value];
});

// Reseta scroll ao mudar de testemunho
watch(currentIndex, () => {
  if (textContainerRef.value) {
    textContainerRef.value.scrollTop = 0;
  }
});

const nextTestimonial = () => {
  if (!testimonials.value?.results?.length) return;
  currentIndex.value =
    (currentIndex.value + 1) % testimonials.value.results.length;
  resetAutoPlay();
};

const prevTestimonial = () => {
  if (!testimonials.value?.results?.length) return;
  currentIndex.value =
    currentIndex.value === 0
      ? testimonials.value.results.length - 1
      : currentIndex.value - 1;
  resetAutoPlay();
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
        <div
          v-if="currentTestimonial"
          :key="currentTestimonial.id"
          class="testimonial-card"
          @mouseenter="stopAutoPlay"
          @mouseleave="startAutoPlay"
        >
          <!-- Quote Icon -->
          <div class="quote-icon" aria-hidden="true">
            <v-icon size="48" color="primary">mdi-format-quote-open</v-icon>
          </div>

          <!-- Testimonial Text -->
          <div ref="textContainerRef" class="testimonial-text-container">
            <p class="testimonial-text">
              {{ currentTestimonial.text }}
            </p>
          </div>

          <!-- Author Info -->
          <div class="testimonial-author">
            <div v-if="currentTestimonial.photo" class="author-photo">
              <NuxtImg
                :src="currentTestimonial.photo"
                :alt="`Foto de ${currentTestimonial.author_name}`"
                class="photo-img"
                width="64"
                height="64"
                :cover="true"
              />
            </div>
            <div v-else class="author-photo-placeholder">
              <v-icon size="32" color="grey-lighten-1"
                >mdi-account-circle</v-icon
              >
            </div>

            <div class="author-info">
              <h4 class="author-name">{{ currentTestimonial.author_name }}</h4>
              <p class="author-role">
                {{ currentTestimonial.author_role }}
                <span
                  v-if="currentTestimonial.company"
                  class="company-separator"
                  >•</span
                >
                <span v-if="currentTestimonial.company" class="company-name">
                  {{ currentTestimonial.company }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Navigation -->
      <div
        v-if="testimonials.results.length > 1"
        class="testimonials-navigation"
      >
        <!-- Progress Bar -->
        <div class="navigation-progress" role="presentation">
          <div
            class="progress-bar"
            :style="{
              width: `${
                ((currentIndex + 1) / testimonials.results.length) * 100
              }%`,
            }"
          />
        </div>

        <div class="navigation-controls">
          <!-- Prev Button -->
          <v-btn
            icon
            variant="text"
            size="small"
            @click="prevTestimonial"
            class="nav-btn"
            aria-label="Testemunho anterior"
          >
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>

          <!-- Dots Indicator -->
          <div
            class="dots-indicator"
            role="tablist"
            aria-label="Navegação de testemunhos"
          >
            <button
              v-for="(_, index) in testimonials.results"
              :key="index"
              class="dot"
              :class="{ active: index === currentIndex }"
              @click="goToTestimonial(index)"
              role="tab"
              :aria-selected="index === currentIndex"
              :aria-label="`Testemunho ${index + 1} de ${
                testimonials.results.length
              }`"
            />
          </div>

          <!-- Next Button -->
          <v-btn
            icon
            variant="text"
            size="small"
            @click="nextTestimonial"
            class="nav-btn"
            aria-label="Próximo testemunho"
          >
            <v-icon>mdi-chevron-right</v-icon>
          </v-btn>
        </div>

        <!-- Counter -->
        <div class="testimonial-counter" aria-live="polite" aria-atomic="true">
          {{ currentIndex + 1 }} / {{ testimonials.results.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.testimonials-section {
  padding: 80px 20px;
}

.testimonials-container {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
}

/* Testimonial Card */
.testimonial-card {
  background: white;
  padding: 60px 48px 48px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
  position: relative;
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.3s ease;
}

.testimonial-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
}

.quote-icon {
  position: absolute;
  top: 20px;
  left: 20px;
  opacity: 0.12;
  pointer-events: none;
}

/* Text Container with Scroll */
.testimonial-text-container {
  position: relative;
  margin-bottom: 32px;
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  scroll-behavior: smooth;

  /* Scrollbar customizada */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

/* Webkit Scrollbar */
.testimonial-text-container::-webkit-scrollbar {
  width: 6px;
}

.testimonial-text-container::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 3px;
}

.testimonial-text-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.testimonial-text-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.testimonial-text-container::-webkit-scrollbar-thumb:active {
  background: #718096;
}

.testimonial-text {
  font-size: 1.125rem;
  line-height: 1.75;
  color: #2d3748;
  position: relative;
  z-index: 1;
  font-style: italic;
  white-space: pre-line;
  word-wrap: break-word;
  overflow-wrap: break-word;
  margin: 0;
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
  transition: border-color 0.2s ease;
}

.testimonial-card:hover .author-photo,
.testimonial-card:hover .author-photo-placeholder {
  border-color: #e5e7eb;
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
  min-width: 0;
}

.author-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
  line-height: 1.4;
}

.author-role {
  font-size: 0.9375rem;
  color: #718096;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  line-height: 1.5;
}

.company-separator {
  color: #cbd5e0;
}

.company-name {
  font-weight: 500;
  color: #4a5568;
}

/* Navigation */
.testimonials-navigation {
  margin-top: 48px;
}

.navigation-progress {
  height: 3px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 24px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.navigation-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.nav-btn {
  color: #6b7280;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  color: #2563eb;
  background: #f3f4f6;
  transform: scale(1.05);
}

.nav-btn:active {
  transform: scale(0.98);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  position: relative;
}

.dot::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
}

.dot:hover {
  background: #9ca3af;
  transform: scale(1.2);
}

.dot:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}

.dot.active {
  width: 32px;
  border-radius: 5px;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
}

/* Counter */
.testimonial-counter {
  text-align: center;
  margin-top: 16px;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  letter-spacing: 0.025em;
}

/* Fade Transition */
.fade-enter-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive */
@media (max-width: 960px) {
  .testimonial-card {
    padding: 48px 36px 36px;
  }

  .testimonial-text-container {
    max-height: 200px;
  }

  .testimonial-text {
    font-size: 1rem;
  }
}

@media (max-width: 600px) {
  .testimonials-section {
    padding: 60px 16px;
  }

  .testimonial-card {
    padding: 40px 24px 32px;
    border-radius: 16px;
  }

  .quote-icon {
    top: 16px;
    left: 16px;
  }

  .quote-icon :deep(.v-icon) {
    font-size: 36px !important;
  }

  .testimonial-text-container {
    max-height: 180px;
    margin-bottom: 24px;
  }

  .testimonial-text {
    font-size: 0.9375rem;
    line-height: 1.7;
  }

  .testimonial-author {
    flex-direction: column;
    align-items: flex-start;
    padding-top: 24px;
    gap: 16px;
  }

  .author-photo,
  .author-photo-placeholder {
    width: 56px;
    height: 56px;
  }

  .author-name {
    font-size: 1rem;
  }

  .author-role {
    font-size: 0.875rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .company-separator {
    display: none;
  }

  .testimonials-navigation {
    margin-top: 36px;
  }

  .navigation-controls {
    gap: 16px;
  }

  .dots-indicator {
    gap: 10px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }

  .dot.active {
    width: 24px;
  }
}

/* Acessibilidade - Redução de movimento */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .testimonial-text-container,
  .nav-btn,
  .dot {
    transition: none !important;
  }

  .testimonial-text-container {
    scroll-behavior: auto;
  }
}

/* Dark Mode Support */
/*
@media (prefers-color-scheme: dark) {
  .testimonial-card {
    background: #1e293b;
    border-color: #334155;
  }

  .testimonial-text {
    color: #f1f5f9;
  }

  .testimonial-text-container {
    scrollbar-color: #475569 #334155;
  }

  .testimonial-text-container::-webkit-scrollbar-track {
    background: #334155;
  }

  .testimonial-text-container::-webkit-scrollbar-thumb {
    background: #475569;
  }

  .testimonial-text-container::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }

  .testimonial-text-container::-webkit-scrollbar-thumb:active {
    background: #94a3b8;
  }

  .testimonial-author {
    border-top-color: #334155;
  }

  .author-name {
    color: #f1f5f9;
  }

  .author-role,
  .company-name {
    color: #94a3b8;
  }

  .company-separator {
    color: #475569;
  }

  .author-photo,
  .author-photo-placeholder {
    border-color: #334155;
  }

  .author-photo-placeholder {
    background: #334155;
  }

  .navigation-progress {
    background: #334155;
  }

  .testimonial-counter {
    color: #94a3b8;
  }
}
*/
</style>
