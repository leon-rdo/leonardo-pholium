<script setup lang="ts">
import type { ContentBlock } from "~/types/content";

const props = defineProps<{
  contentBlock: ContentBlock;
  imageType?:
    | "cover"
    | "gallery"
    | "logo"
    | "icon"
    | "screenshot"
    | "certificate"
    | "team"
    | "document"
    | "other";
  fallbackSrc?: string;
  aspectRatio?: string;
  sizes?: string;
  class?: string;
}>();

// Get the image based on type or first available
const image = computed(() => {
  if (!props.contentBlock.images?.length) return null;

  if (props.imageType) {
    return props.contentBlock.images.find(
      (img) => img.image_type === props.imageType
    );
  }

  return props.contentBlock.images[0];
});

const imageSrc = computed(() => {
  if (!image.value)
    return props.fallbackSrc || "https://placehold.co/1200x630?text=No+Image";
  return image.value.file || image.value.thumbnail || props.fallbackSrc || "";
});

const imageAlt = computed(() => {
  return (
    image.value?.alt_text ||
    image.value?.title ||
    props.contentBlock.key ||
    "Content image"
  );
});
</script>

<template>
  <figure v-if="image || fallbackSrc" :class="props.class" class="content-block-figure">
    <div class="image-wrapper">
      <NuxtImg
        :src="imageSrc"
        :alt="imageAlt"
        :aspect-ratio="aspectRatio"
        :sizes="
          sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        "
        format="webp"
        :placeholder="true"
        :quality="85"
        loading="lazy"
        class="content-block-image"
      />
      
      <!-- Credits overlay inside image -->
      <small v-if="image?.credits" class="content-block-credits">
        <v-icon size="12" class="credits-icon">mdi-camera</v-icon>
        {{ image.credits }}
      </small>
    </div>
    
    <!-- Caption outside image -->
    <figcaption v-if="image?.caption" class="content-block-caption">
      {{ image.caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
.content-block-figure {
  margin: 0;
  position: relative;
  width: 100%;
}

.image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: #f3f4f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.image-wrapper:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.content-block-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.image-wrapper:hover .content-block-image {
  transform: scale(1.02);
}

.content-block-caption {
  display: block;
  padding: 4px 8px;
  text-align: center;
  font-size: 0.9375rem;
  color: #4b5563;
  font-style: italic;
  line-height: 1.6;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.content-block-credits {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: white;
  font-weight: 500;
  margin: 0;
  letter-spacing: 0.02em;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  z-index: 2;
}

.image-wrapper:hover .content-block-credits {
  background: rgba(0, 0, 0, 0.85);
  transform: translateY(-2px);
}

.credits-icon {
  opacity: 0.9;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .content-block-caption {
    font-size: 0.875rem;
  }
  
  .content-block-credits {
    font-size: 0.6875rem;
    padding: 5px 10px;
    bottom: 8px;
    right: 8px;
  }
  
  .image-wrapper {
    border-radius: 10px;
  }
}

/* Dark mode support (if applicable) */
/* @media (prefers-color-scheme: dark) {
  .image-wrapper {
    background: #1f2937;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
  
  .content-block-caption {
    color: #d1d5db;
  }
} */
</style>