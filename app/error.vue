<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{
  error: NuxtError;
}>();

const { t } = useI18n();
const localePath = useLocalePath();

const is404 = computed(() => props.error.statusCode === 404);
const title = computed(() =>
  is404.value ? t('errors.404') : t('errors.genericTitle'),
);
const description = computed(() =>
  is404.value ? t('errors.notFoundDescription') : t('errors.genericDescription'),
);

// Error pages must never be indexed; the status code alone is not enough
// when a soft-200 slips through (e.g. client-side navigation).
useHead({
  title: () => `${title.value} | Leonardo Costa`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

// 503 is what throwIfBackendDown() raises when the API is unreachable; tell
// crawlers when to come back instead of letting them file an empty page.
if (import.meta.server && props.error.statusCode === 503) {
  useResponseHeader('Retry-After').value = '300';
}

const goHome = () => clearError({ redirect: localePath('/') });
</script>

<template>
  <!-- Inside the default layout so a lost visitor keeps the nav, the
       language switch and the footer, not just two buttons. -->
  <NuxtLayout>
    <div
      class="min-h-[70vh] bg-paper text-ink flex items-center justify-center px-6 py-16"
    >
      <div class="max-w-md text-center">
        <p class="font-mono-rail text-accent text-sm tracking-widest mb-4">
          {{ error.statusCode }}
        </p>
        <h1 class="h-display text-3xl sm:text-4xl font-bold mb-4">
          {{ title }}
        </h1>
        <p class="text-ink-3 mb-8">
          {{ description }}
        </p>
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <button
            type="button"
            class="inline-flex items-center justify-center h-11 px-5 rounded-input bg-accent text-accent-fg text-[14px] font-medium transition-opacity hover:opacity-90"
            @click="goHome"
          >
            {{ t('errors.backHome') }}
          </button>
          <NuxtLink
            :to="localePath('/blog')"
            class="inline-flex items-center justify-center h-11 px-5 rounded-input ring-hair bg-card text-ink-2 text-[14px] font-medium transition-colors hover:text-accent hover:ring-1 hover:ring-accent"
          >
            {{ t('errors.goToBlog') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
