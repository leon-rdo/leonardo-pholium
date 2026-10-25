<script setup lang="ts">
/**
 * Small mono label that names a piece of content — a "now" tile, the facts
 * panel, the About rail. Not an eyebrow: section headings carry their own
 * weight, so it never sits on top of an h1/h2.
 */
withDefaults(
  defineProps<{
    name: string;
    /**
     * Tone of the label. `accent` uses the brand blue; `night` is for labels
     * placed on the always-dark night tile, where the light-mode `ink-3`
     * would only reach 3.99:1.
     */
    tone?: 'muted' | 'accent' | 'night';
  }>(),
  { tone: 'muted' },
);
</script>

<template>
  <div
    :class="[
      'font-mono text-[11.5px] tracking-[0.16em] uppercase',
      tone === 'accent' ? 'text-accent' : '',
      tone === 'night' ? 'text-night-text/70' : '',
      tone === 'muted' ? 'text-ink-3' : '',
    ]"
  >
    {{ name }}
  </div>
</template>
