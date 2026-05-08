<script setup lang="ts">
/**
 * Soft radial gradient backdrop for hero/section ambiance.
 * Drop in absolutely-positioned blob spots; keep filters out of the main layer
 * so motion-reduce users can opt out cheaply.
 */
withDefaults(
  defineProps<{
    /** Opacity of the entire aurora layer (0–1). Default 0.55. */
    intensity?: number;
    /** Stronger blur for hero use; lighter for tile-internal. */
    variant?: 'page' | 'tile';
  }>(),
  { intensity: 0.55, variant: 'page' },
);
</script>

<template>
  <div
    aria-hidden="true"
    :class="[
      'pointer-events-none absolute inset-0 z-0',
      variant === 'page' ? '' : '',
    ]"
    :style="{ opacity: intensity }"
  >
    <!-- Three radial blobs in token colors. Placed via percent so they scale with the container. -->
    <div
      class="absolute -top-1/4 -left-1/4 w-[60%] h-[80%] rounded-full"
      :style="{
        background:
          'radial-gradient(closest-side, var(--color-blob-1) 0%, transparent 70%)',
        filter: variant === 'page' ? 'blur(60px)' : 'blur(30px)',
      }"
    />
    <div
      class="absolute -top-1/3 right-0 w-[50%] h-[70%] rounded-full"
      :style="{
        background:
          'radial-gradient(closest-side, var(--color-blob-2) 0%, transparent 70%)',
        filter: variant === 'page' ? 'blur(60px)' : 'blur(30px)',
      }"
    />
    <div
      class="absolute -bottom-1/4 left-1/4 w-[60%] h-[60%] rounded-full"
      :style="{
        background:
          'radial-gradient(closest-side, var(--color-blob-3) 0%, transparent 70%)',
        filter: variant === 'page' ? 'blur(80px)' : 'blur(40px)',
      }"
    />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  /* Aurora is decorative; respect motion preferences by hiding it. */
  div[aria-hidden] {
    display: none;
  }
}
</style>
