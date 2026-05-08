<script setup lang="ts">
type ChipVariant = 'default' | 'blue' | 'dark' | 'ghost';

withDefaults(
  defineProps<{
    variant?: ChipVariant;
    /** Render as a link, button, or span. Default `span`. */
    as?: string;
  }>(),
  { variant: 'default', as: 'span' },
);

const styles: Record<ChipVariant, string> = {
  default:
    'border border-line bg-card text-ink-2 hover:bg-card-soft',
  blue:
    'border border-accent/20 bg-accent-soft text-accent-2 dark:text-accent',
  dark:
    'border border-line-2/40 bg-ink/90 text-paper dark:bg-ink dark:text-paper',
  ghost:
    'border border-transparent text-ink-3 hover:text-ink',
};
</script>

<template>
  <component
    :is="as"
    :class="[
      'inline-flex items-center gap-1.5',
      'font-mono text-[11.5px] tracking-[0.04em]',
      'px-2.5 py-[3px] rounded-chip',
      'transition-colors duration-150',
      styles[variant],
    ]"
  >
    <slot />
  </component>
</template>
