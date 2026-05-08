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
    /** Tone of the label — accent uses the brand blue. */
    tone?: 'muted' | 'accent';
  }>(),
  { tone: 'muted' },
);
</script>

<template>
  <div
    :class="[
      'font-mono text-[11.5px] tracking-[0.16em] uppercase',
      tone === 'accent' ? 'text-accent' : 'text-ink-3',
    ]"
  >
    <span aria-hidden="true">//</span>
    <span v-if="index" class="ml-1">{{ index }}</span>
    <span v-if="index" class="mx-1 opacity-50">·</span>
    <span>{{ name }}</span>
  </div>
</template>
