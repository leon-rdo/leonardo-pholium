<script setup lang="ts">
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Render as `a`/`NuxtLink`/`button`. Default `button`. */
    as?: string;
    /** Adds the blue glow shadow (used on the main hero CTA). */
    glow?: boolean;
    href?: string;
    to?: string;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    variant: 'primary',
    size: 'md',
    as: 'button',
    glow: false,
    type: 'button',
  },
);

// `:is` with a plain string only resolves globally registered components —
// "NuxtLink" isn't one, so it rendered an inert unknown element
// (<nuxtlink>) and hero CTAs didn't navigate at all.
const NuxtLink = resolveComponent('NuxtLink');
const tag = computed(() => (props.as === 'NuxtLink' ? NuxtLink : props.as));

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-paper hover:bg-accent-2',
  secondary:
    'bg-card text-ink ring-hair hover:bg-card-soft',
  ghost:
    'bg-transparent text-ink-2 hover:text-ink hover:bg-card',
  dark:
    'bg-ink text-paper hover:bg-ink-2',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'text-[13px] px-3.5 py-2 rounded-md font-medium',
  md: 'text-[14px] px-5 py-3 rounded-md font-semibold',
  lg: 'text-[15px] px-6 py-3.5 rounded-md font-semibold',
};
</script>

<template>
  <component
    :is="tag"
    :type="as === 'button' ? type : undefined"
    :href="href"
    :to="to"
    :class="[
      'inline-flex items-center justify-center gap-2',
      'transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
      variants[variant],
      sizes[size],
      glow ? 'glow-blue' : '',
    ]"
  >
    <slot />
  </component>
</template>
