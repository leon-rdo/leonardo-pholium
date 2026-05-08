<script setup lang="ts">
/**
 * One line inside <TerminalPanel>. Either:
 *   - prompt + cmd + out  (one-liner)
 *   - prompt + cmd, then any default slot for output below.
 *   - blinking-cursor only (omit everything; pass `cursor`).
 */
withDefaults(
  defineProps<{
    prompt?: string;
    cmd?: string;
    out?: string;
    /** Show the trailing blinking cursor — used at the end of the panel. */
    cursor?: boolean;
    /** Highlight color hint for the output (e.g. `success` for green). */
    tone?: 'default' | 'success' | 'warn' | 'accent';
  }>(),
  { prompt: '$', cursor: false, tone: 'default' },
);

const toneClass: Record<string, string> = {
  default: 'text-paper/80',
  success: 'text-status-ok',
  warn: 'text-status-warn',
  accent: 'text-accent',
};
</script>

<template>
  <div>
    <span v-if="prompt" class="text-paper/40">{{ prompt }}</span>
    <span v-if="cmd" class="text-paper ml-1.5">{{ cmd }}</span>
    <template v-if="out">
      <span class="text-paper/40 mx-2">→</span>
      <span :class="toneClass[tone]">{{ out }}</span>
    </template>
    <span v-else-if="$slots.default" class="ml-2">
      <slot />
    </span>
    <span v-if="cursor" class="ml-1 inline-block w-2 h-4 align-middle animate-pulse bg-paper" />
  </div>
</template>
