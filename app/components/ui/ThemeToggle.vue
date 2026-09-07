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

const { t } = useI18n();
const colorMode = useColorMode();

type Preference = 'light' | 'system' | 'dark';

const setPreference = (pref: Preference) => {
  colorMode.preference = pref;
};

/*
 * The stored preference is only known on the client, so rendering the pressed
 * state during SSR produced a hydration mismatch (the server guessed "system",
 * the client knew better) and, worse, shipped an `aria-pressed` that did not
 * match reality. Stay unpressed until mounted, then reflect the real value.
 */
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

const isActive = (pref: Preference) =>
  mounted.value && colorMode.preference === pref;

const options: Array<{
  pref: Preference;
  icon: typeof Sun;
  labelKey: string;
}> = [
  { pref: 'light', icon: Sun, labelKey: 'a11y.themeLight' },
  { pref: 'system', icon: Monitor, labelKey: 'a11y.themeSystem' },
  { pref: 'dark', icon: Moon, labelKey: 'a11y.themeDark' },
];
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-full bg-card ring-hair p-0.5"
    role="group"
    :aria-label="t('a11y.themeLabel')"
  >
    <button
      v-for="option in options"
      :key="option.pref"
      type="button"
      :aria-pressed="isActive(option.pref)"
      :title="t(option.labelKey)"
      :class="[
        'inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors',
        isActive(option.pref)
          ? 'bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-line)]'
          : 'text-ink-3 hover:text-ink',
      ]"
      @click="setPreference(option.pref)"
    >
      <component :is="option.icon" :size="14" :stroke-width="1.8" />
      <span class="sr-only">{{ t(option.labelKey) }}</span>
    </button>
  </div>
</template>
