<script setup lang="ts">
import type { Image } from "~/types/core";

interface Props {
  images: Image[];
}

const props = defineProps<Props>();

const dialog = ref(false);
const currentImageIndex = ref(0);
const carouselIndex = ref(0);

const openGallery = (index: number) => {
  currentImageIndex.value = index;
  dialog.value = true;
};

const closeGallery = () => {
  dialog.value = false;
};

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % props.images.length;
};

const prevImage = () => {
  currentImageIndex.value =
    (currentImageIndex.value - 1 + props.images.length) % props.images.length;
};

const currentImage = computed(() => props.images[currentImageIndex.value]);

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!dialog.value) return;

  if (event.key === "ArrowRight") {
    nextImage();
  } else if (event.key === "ArrowLeft") {
    prevImage();
  } else if (event.key === "Escape") {
    closeGallery();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="image-gallery">
    <!-- Carrossel Minimalista -->
    <div class="carousel-container">
      <v-carousel
        v-model="carouselIndex"
        height="auto"
        hide-delimiters
        :show-arrows="images.length > 1 ? 'hover' : false"
        class="minimal-carousel"
        :continuous="false"
      >
        <template #prev="{ props: prevProps }">
          <v-btn
            v-bind="prevProps"
            icon
            variant="text"
            class="carousel-nav-btn prev-btn"
          >
            <v-icon size="28">mdi-chevron-left</v-icon>
          </v-btn>
        </template>

        <template #next="{ props: nextProps }">
          <v-btn
            v-bind="nextProps"
            icon
            variant="text"
            class="carousel-nav-btn next-btn"
          >
            <v-icon size="28">mdi-chevron-right</v-icon>
          </v-btn>
        </template>

        <v-carousel-item
          v-for="(image, index) in images"
          :key="image.id"
          @click="openGallery(index)"
        >
          <div class="image-wrapper">
            <NuxtImg
              :src="image.file"
              :alt="image.alt_text || image.title"
              format="webp"
              :width="image.width || undefined"
              :height="image.height || undefined"
              sizes="(max-width: 600px) 100vw, 900px"
              :placeholder="true"
              :quality="90"
              fit="cover"
              class="carousel-image"
            />
            <div class="zoom-indicator">
              <v-icon size="20" color="white">mdi-arrow-expand</v-icon>
            </div>
          </div>
        </v-carousel-item>
      </v-carousel>

      <!-- Indicadores customizados -->
      <div v-if="images.length > 1" class="carousel-indicators">
        <button
          v-for="(image, index) in images"
          :key="image.id"
          class="indicator-dot"
          :class="{ active: index === carouselIndex }"
          @click="carouselIndex = index"
          :aria-label="`Ir para imagem ${index + 1}`"
        />
      </div>
    </div>

    <!-- Caption minimalista -->
    <div
      v-if="images[carouselIndex]?.caption || images[carouselIndex]?.credits"
      class="image-meta"
    >
      <p v-if="images[carouselIndex]?.caption" class="image-caption">
        {{ images[carouselIndex]?.caption }}
      </p>
      <p v-if="images[carouselIndex]?.credits" class="image-credits">
        {{ images[carouselIndex]?.credits }}
      </p>
    </div>

    <!-- Dialog para visualização fullscreen -->
    <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="gallery-viewer">
        <v-toolbar dark color="black" class="gallery-toolbar" elevation="0">
          <v-toolbar-title class="text-body-1">
            {{ currentImageIndex + 1 }} / {{ images.length }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="closeGallery" variant="text">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <div class="viewer-content">
          <!-- Navigation buttons -->
          <v-btn
            v-if="images.length > 1"
            icon
            size="large"
            class="nav-btn nav-btn-prev"
            variant="text"
            @click="prevImage"
          >
            <v-icon size="32">mdi-chevron-left</v-icon>
          </v-btn>

          <div v-if="currentImage" class="image-container">
            <NuxtImg
              :src="currentImage.file"
              :alt="currentImage.alt_text || currentImage.title"
              format="webp"
              :width="currentImage.width || undefined"
              :height="currentImage.height || undefined"
              :quality="95"
              fit="contain"
              class="viewer-image"
            />

            <div
              v-if="currentImage.caption || currentImage.credits"
              class="viewer-image-info"
            >
              <p v-if="currentImage.caption" class="viewer-caption">
                {{ currentImage.caption }}
              </p>
              <p v-if="currentImage.credits" class="viewer-credits">
                {{ currentImage.credits }}
              </p>
            </div>
          </div>

          <v-btn
            v-if="images.length > 1"
            icon
            size="large"
            class="nav-btn nav-btn-next"
            variant="text"
            @click="nextImage"
          >
            <v-icon size="32">mdi-chevron-right</v-icon>
          </v-btn>
        </div>

        <!-- Thumbnails strip at bottom -->
        <div v-if="images.length > 1" class="thumbnails-strip">
          <button
            v-for="(image, index) in images"
            :key="image.id"
            class="strip-thumbnail"
            :class="{ active: index === currentImageIndex }"
            @click="currentImageIndex = index"
          >
            <NuxtImg
              :src="image.thumbnail || image.file"
              :alt="image.alt_text"
              format="webp"
              width="100"
              height="75"
              :quality="60"
              fit="cover"
            />
          </button>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.image-gallery {
  margin: 80px 0;
}

/* Carrossel Minimalista */
.carousel-container {
  position: relative;
  max-width: 100%;
}

.minimal-carousel {
  border-radius: 0;
  overflow: hidden;
  background: transparent;
  aspect-ratio: 16 / 9;
}

.minimal-carousel :deep(.v-window__container) {
  height: 100%;
}

.minimal-carousel :deep(.v-carousel-item) {
  height: 100% !important;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-wrapper:hover .carousel-image {
  transform: scale(1.03);
}

.zoom-indicator {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-wrapper:hover .zoom-indicator {
  opacity: 1;
}

/* Botões de navegação customizados */
.carousel-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(8px);
  color: #1a1a1a !important;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.carousel-nav-btn:hover {
  background: rgba(255, 255, 255, 1) !important;
  transform: translateY(-50%) scale(1.1);
}

.prev-btn {
  left: 16px;
}

.next-btn {
  right: 16px;
}

/* Indicadores customizados */
.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.indicator-dot:hover {
  background: #9ca3af;
  transform: scale(1.2);
}

.indicator-dot.active {
  width: 24px;
  border-radius: 4px;
  background: #1a1a1a;
}

/* Meta informações */
.image-meta {
  margin-top: 20px;
  text-align: center;
}

.image-caption {
  font-size: 0.9375rem;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 6px;
}

.image-credits {
  font-size: 0.8125rem;
  color: #9ca3af;
  font-style: italic;
}

/* Gallery Viewer */
.gallery-viewer {
  background: #000;
  display: flex;
  flex-direction: column;
}

.gallery-toolbar {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.viewer-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 40px 20px;
  overflow: hidden;
}

.image-container {
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.viewer-image {
  max-width: 100%;
  max-height: calc(100vh - 350px);
  object-fit: contain;
}

.viewer-image-info {
  text-align: center;
  color: white;
  max-width: 600px;
}

.viewer-caption {
  font-size: 1rem;
  margin-bottom: 8px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.95);
}

.viewer-credits {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(8px);
  z-index: 2;
  color: white !important;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.nav-btn-prev {
  left: 20px;
}

.nav-btn-next {
  right: 20px;
}

/* Thumbnails strip */
.thumbnails-strip {
  display: flex;
  gap: 12px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.95);
  overflow-x: auto;
  justify-content: center;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.strip-thumbnail {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 0;
  background: none;
}

.strip-thumbnail:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.strip-thumbnail.active {
  border-color: #fff;
}

.strip-thumbnail img {
  display: block;
  width: 100px;
  height: 75px;
  object-fit: cover;
}

/* Responsive */
@media (max-width: 960px) {
  .image-gallery {
    margin: 60px 0;
  }

  .minimal-carousel :deep(.v-window__container) {
    aspect-ratio: 4 / 3;
  }

  .carousel-nav-btn {
    width: 40px;
    height: 40px;
  }

  .prev-btn {
    left: 12px;
  }

  .next-btn {
    right: 12px;
  }

  .viewer-image {
    max-height: calc(100vh - 300px);
  }

  .nav-btn {
    display: none;
  }
}

@media (max-width: 600px) {
  .image-gallery {
    margin: 40px 0;
  }

  .minimal-carousel :deep(.v-window__container) {
    aspect-ratio: 3 / 2;
  }

  .carousel-nav-btn {
    width: 36px;
    height: 36px;
  }

  .prev-btn {
    left: 8px;
  }

  .next-btn {
    right: 8px;
  }

  .zoom-indicator {
    width: 32px;
    height: 32px;
    bottom: 12px;
    right: 12px;
  }

  .carousel-indicators {
    margin-top: 16px;
    gap: 6px;
  }

  .indicator-dot {
    width: 6px;
    height: 6px;
  }

  .indicator-dot.active {
    width: 18px;
  }

  .image-meta {
    margin-top: 16px;
  }

  .image-caption {
    font-size: 0.875rem;
  }

  .image-credits {
    font-size: 0.75rem;
  }

  .viewer-content {
    padding: 20px 10px;
  }

  .thumbnails-strip {
    padding: 16px;
    gap: 8px;
  }

  .strip-thumbnail img {
    width: 80px;
    height: 60px;
  }
}
</style>
