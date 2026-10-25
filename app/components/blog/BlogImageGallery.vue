<script setup lang="ts">
/**
 * Inline image gallery for blog posts. Replaces the legacy v-carousel
 * with a simple grid + lightbox modal that opens on click.
 *
 * - Default: thumbnails laid out in a 1/2/3-column responsive grid
 * - Click → fullscreen lightbox with prev/next + ESC to close
 */
import type { Image } from '~/types/core';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-vue-next';

const props = defineProps<{ images: Image[] }>();

const open = ref(false);
const index = ref(0);

const currentImage = computed(() => props.images[index.value]);

/*
 * The lightbox is a modal dialog (WCAG 2.4.3 / 2.1.2): focus moves into it on
 * open, Tab stays inside, the page behind doesn't scroll, and focus goes back
 * to the thumbnail that opened it. Same contract as the mobile nav drawer.
 */
const dialogEl = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLElement | null>(null);
let opener: HTMLElement | null = null;

const openAt = (i: number, event: Event) => {
  opener = event.currentTarget as HTMLElement;
  index.value = i;
  open.value = true;
};
const close = () => (open.value = false);
const next = () =>
  (index.value = (index.value + 1) % props.images.length);
const prev = () =>
  (index.value = (index.value - 1 + props.images.length) % props.images.length);

watch(open, async (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : '';
  if (isOpen) {
    await nextTick();
    closeButton.value?.focus();
  } else {
    opener?.focus();
  }
});

const onKeydown = (event: KeyboardEvent) => {
  if (!open.value) return;
  if (event.key === 'ArrowRight') next();
  else if (event.key === 'ArrowLeft') prev();
  else if (event.key === 'Escape') close();
  else if (event.key === 'Tab' && dialogEl.value) {
    const buttons = Array.from(dialogEl.value.querySelectorAll('button'));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <section v-if="images.length">
    <!-- Thumbnails grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <button
        v-for="(image, i) in images"
        :key="image.id"
        type="button"
        class="group relative aspect-[4/3] rounded-card overflow-hidden ring-hair bg-card-soft cursor-zoom-in"
        :aria-label="
          $t('a11y.openImage', { n: i + 1, total: images.length }) +
          (image.alt_text || image.title ? `: ${image.alt_text || image.title}` : '')
        "
        @click="openAt(i, $event)"
      >
        <!-- The button carries the name; the thumbnail itself is decorative. -->
        <NuxtImg
          :src="image.thumbnail || image.file"
          alt=""
          :width="image.width || 600"
          :height="image.height || 450"
          format="webp"
          loading="lazy"
          decoding="async"
          sizes="sm:100vw md:50vw lg:400px"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span
          aria-hidden="true"
          class="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-night/70 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
        >
          <Maximize2 :size="13" :stroke-width="1.8" class="text-night-text" />
        </span>
      </button>
    </div>

    <!-- Lightbox modal -->
    <Teleport to="body">
      <transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="open"
          ref="dialogEl"
          class="fixed inset-0 z-[60] bg-night/90 backdrop-blur-sm flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          :aria-label="$t('a11y.imageViewer')"
          @click.self="close"
        >
          <!-- Close -->
          <button
            ref="closeButton"
            type="button"
            class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-night-text transition-colors"
            :aria-label="$t('common.close')"
            @click="close"
          >
            <X :size="20" :stroke-width="1.8" />
          </button>

          <!-- Prev / Next -->
          <button
            v-if="images.length > 1"
            type="button"
            class="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-night-text transition-colors"
            :aria-label="$t('a11y.previousImage')"
            @click="prev"
          >
            <ChevronLeft :size="22" :stroke-width="1.8" />
          </button>
          <button
            v-if="images.length > 1"
            type="button"
            class="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center text-night-text transition-colors"
            :aria-label="$t('a11y.nextImage')"
            @click="next"
          >
            <ChevronRight :size="22" :stroke-width="1.8" />
          </button>

          <!-- Image -->
          <figure class="max-w-[90vw] max-h-[88vh] flex flex-col items-center gap-3">
            <NuxtImg
              :key="currentImage?.id"
              :src="currentImage?.file"
              :alt="currentImage?.alt_text || currentImage?.title || ''"
              :width="currentImage?.width || 1600"
              :height="currentImage?.height || 1000"
              format="webp"
              loading="lazy"
              decoding="async"
              :placeholder="true"
              :quality="90"
              class="max-w-full max-h-[80vh] object-contain rounded-card"
            />
            <figcaption
              v-if="currentImage?.caption"
              class="font-mono text-[12px] text-night-text/70 text-center max-w-[640px]"
            >
              {{ currentImage.caption }}
            </figcaption>
            <div
              v-if="images.length > 1"
              class="font-mono text-[11px] text-night-text/60 tracking-[0.16em] uppercase"
            >
              {{ index + 1 }} / {{ images.length }}
            </div>
          </figure>
        </div>
      </transition>
    </Teleport>
  </section>
</template>
