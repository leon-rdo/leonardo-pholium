<script setup lang="ts">
type TileVariant = 'card' | 'flat' | 'dark' | 'transparent';

const props = withDefaults(
  defineProps<{
    /** Visual variant. `card` is the default cream tile; `dark` flips to ink. */
    variant?: TileVariant;
    /** Show the soft aurora gradient inside the tile. */
    aurora?: boolean;
    /** Render with the hairline ring border. */
    ring?: boolean;
    /** Render the tile clipping content (default). Disable for floating glass chips. */
    clip?: boolean;
    /** Wrapping element. Default `div`; pass `article`, `section`, `a` etc. */
    as?: string;
  }>(),
  {
    variant: 'card',
    aurora: false,
    ring: true,
    clip: true,
    as: 'div',
  },
);

const surfaceClass = computed(() => {
  switch (props.variant) {
    case 'flat':
      return 'bg-transparent';
    case 'dark':
      return 'bg-ink text-paper';
    case 'transparent':
      return 'bg-transparent';
    case 'card':
    default:
      return 'bg-card text-ink';
  }
});
</script>

<template>
  <component
    :is="as"
    :class="[
      'relative rounded-tile transition-[transform,box-shadow] duration-200',
      'color-mode-fade',
      surfaceClass,
      ring ? 'ring-hair' : '',
      clip ? 'overflow-hidden' : '',
    ]"
  >
    <!-- Aurora layer behind content. Pointer-events disabled in CSS. -->
    <div v-if="aurora" class="aurora-soft" aria-hidden="true" />
    <!-- Content sits above aurora. -->
    <div class="relative z-10 h-full">
      <slot />
    </div>
  </component>
</template>
