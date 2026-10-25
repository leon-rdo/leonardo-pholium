<script setup lang="ts">
type TileVariant = 'card' | 'flat' | 'dark' | 'transparent';

const props = withDefaults(
  defineProps<{
    /** Visual variant. `card` is the default cream tile; `dark` flips to ink. */
    variant?: TileVariant;
    /** Render with the hairline ring border. */
    ring?: boolean;
    /** Clip content to the rounded tile (default). Disable for content that must overflow it. */
    clip?: boolean;
    /** Wrapping element. Default `div`; pass `article`, `section`, `a` etc. */
    as?: string;
  }>(),
  {
    variant: 'card',
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
  <!--
    Content is slotted straight in, with no wrapper: layout classes passed to
    <Tile> (flex, grid, justify-between…) must reach the children. A wrapper
    div here swallowed them, which is what glued the hero headline to its
    subtitle and broke the featured PostCard grid. `isolate` keeps
    positioned children (stretched links, image overlays) stacked inside the
    tile.
  -->
  <component
    :is="as"
    :class="[
      'relative isolate rounded-tile transition-[transform,box-shadow] duration-200',
      'color-mode-fade',
      surfaceClass,
      ring ? 'ring-hair' : '',
      clip ? 'overflow-hidden' : '',
    ]"
  >
    <slot />
  </component>
</template>
