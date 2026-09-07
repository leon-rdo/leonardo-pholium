<script setup lang="ts">
/**
 * Mono comment-style label that anchors each section.
 * Example: <SectionLabel index="01" name="about" />  →  // 01 · about
 */
withDefaults(
  defineProps<{
    /** Optional numeric prefix (string so we can pass "01" without losing the zero). */
    index?: string;
    /** Section name (lowercase preferred). */
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
    <span aria-hidden="true">//</span>
    <span v-if="index" class="ml-1">{{ index }}</span>
    <span v-if="index" class="mx-1 opacity-50">·</span>
    <span>{{ name }}</span>
  </div>
</template>
