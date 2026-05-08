<script setup lang="ts">
/**
 * Three-state theme toggle: light / system / dark.
 * Backed by @nuxtjs/color-mode (cookie-persisted, SSR-safe).
 *
 * The composable returns `value` (current resolved value: 'light' | 'dark')
 * and `preference` (user choice: 'light' | 'dark' | 'system'). We toggle the
 * preference on click; the module handles class-on-html and storage.
 */
import { Sun, Moon, Monitor } from 'lucide-vue-next';

const colorMode = useColorMode();

const setPreference = (pref: 'light' | 'dark' | 'system') => {
  colorMode.preference = pref;
};

const isActive = (pref: string) => colorMode.preference === pref;
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-full bg-card ring-hair p-0.5"
    role="group"
    aria-label="Color mode"
  >
    <button
      type="button"
      :aria-pressed="isActive('light')"
      :title="'Light theme'"
      :class="[
        'inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors',
        isActive('light')
          ? 'bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)]'
          : 'text-ink-3 hover:text-ink',
      ]"
      @click="setPreference('light')"
    >
      <Sun :size="14" :stroke-width="1.8" />
      <span class="sr-only">Light</span>
    </button>
    <button
      type="button"
      :aria-pressed="isActive('system')"
      :title="'System theme'"
      :class="[
        'inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors',
        isActive('system')
          ? 'bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)]'
          : 'text-ink-3 hover:text-ink',
      ]"
      @click="setPreference('system')"
    >
      <Monitor :size="14" :stroke-width="1.8" />
      <span class="sr-only">System</span>
    </button>
    <button
      type="button"
      :aria-pressed="isActive('dark')"
      :title="'Dark theme'"
      :class="[
        'inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors',
        isActive('dark')
          ? 'bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)]'
          : 'text-ink-3 hover:text-ink',
      ]"
      @click="setPreference('dark')"
    >
      <Moon :size="14" :stroke-width="1.8" />
      <span class="sr-only">Dark</span>
    </button>
  </div>
</template>
