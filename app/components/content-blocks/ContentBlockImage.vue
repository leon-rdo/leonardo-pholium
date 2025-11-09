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
  <figure v-if="image || fallbackSrc" :class="props.class">
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
    <figcaption v-if="image?.caption" class="content-block-caption">
      {{ image.caption }}
    </figcaption>
    <small v-if="image?.credits" class="content-block-credits">
      {{ image.credits }}
    </small>
  </figure>
</template>

<style scoped>
figure {
  margin: 0;
  position: relative;
}

.content-block-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
}

.content-block-caption {
  margin-top: 12px;
  font-size: 0.9375rem;
  color: #6b7280;
  font-style: italic;
  line-height: 1.5;
}

.content-block-credits {
  display: block;
  margin-top: 4px;
  font-size: 0.8125rem;
  color: #9ca3af;
}
</style>
