<script setup lang="ts">
/**
 * Lightweight dropdown menu — no Headless UI dependency.
 *
 *   <UiDropdown label="Language">
 *     <template #trigger>...</template>
 *     <template #menu>...</template>
 *   </UiDropdown>
 *
 * Click-outside dismisses; Escape closes and returns focus to the trigger.
 */
withDefaults(
  defineProps<{
    /** Menu alignment relative to the trigger. */
    align?: 'left' | 'right';
    /** Pixels of margin between trigger and menu. */
    offset?: number;
    /**
     * Accessible name for the trigger. Needed when the visible trigger text is
     * only an abbreviation (e.g. the locale switcher renders just "PT"), which
     * a screen reader would otherwise announce without any context.
     */
    label?: string;
  }>(),
  { align: 'right', offset: 8 },
);

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const triggerEl = ref<HTMLElement | null>(null);
const menuId = useId();

const onDocumentClick = (event: MouseEvent) => {
  if (!open.value) return;
  const target = event.target as Node | null;
  if (root.value && target && !root.value.contains(target)) {
    open.value = false;
  }
};

onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));

const close = (returnFocus = false) => {
  open.value = false;
  // Escape must not strand focus on a node that just left the accessibility
  // tree — hand it back to the trigger (WCAG 2.4.3).
  if (returnFocus) triggerEl.value?.focus();
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && open.value) {
    event.preventDefault();
    close(true);
  }
};
</script>

<template>
  <div ref="root" class="relative" @keydown="onKeydown">
    <button
      ref="triggerEl"
      type="button"
      :aria-expanded="open"
      :aria-controls="open ? menuId : undefined"
      :aria-label="label"
      aria-haspopup="true"
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
        :id="menuId"
        :class="[
          'absolute z-40 min-w-[180px] rounded-card bg-card ring-hair shadow-[0_8px_24px_rgba(20,15,5,0.06)]',
          'overflow-hidden',
          align === 'right' ? 'right-0' : 'left-0',
        ]"
        :style="{ top: `calc(100% + ${offset}px)` }"
        @click="close()"
      >
        <slot name="menu" />
      </div>
    </transition>
  </div>
</template>
