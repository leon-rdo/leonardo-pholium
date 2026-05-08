<script setup lang="ts">
/**
 * Lightweight dropdown menu — no Headless UI dependency.
 *
 *   <UiDropdown>
 *     <template #trigger>...</template>
 *     <template #menu>...</template>
 *   </UiDropdown>
 *
 * Click-outside dismisses; Escape closes; arrow keys not (yet) wired.
 */
withDefaults(
  defineProps<{
    /** Menu alignment relative to the trigger. */
    align?: 'left' | 'right';
    /** Pixels of margin between trigger and menu. */
    offset?: number;
  }>(),
  { align: 'right', offset: 8 },
);

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const onDocumentClick = (event: MouseEvent) => {
  if (!open.value) return;
  const target = event.target as Node | null;
  if (root.value && target && !root.value.contains(target)) {
    open.value = false;
  }
};

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') open.value = false;
};
</script>

<template>
  <div ref="root" class="relative" @keydown="onKeydown">
    <button
      type="button"
      :aria-expanded="open"
      class="inline-flex items-center"
      @click="open = !open"
    >
      <slot name="trigger" :open="open" />
    </button>
    <transition
      enter-active-class="transition duration-120 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        :class="[
          'absolute z-40 min-w-[180px] rounded-card bg-card ring-hair shadow-[0_8px_24px_rgba(20,15,5,0.06)]',
          'overflow-hidden',
          align === 'right' ? 'right-0' : 'left-0',
        ]"
        :style="{ top: `calc(100% + ${offset}px)` }"
        @click="open = false"
      >
        <slot name="menu" />
      </div>
    </transition>
  </div>
</template>
