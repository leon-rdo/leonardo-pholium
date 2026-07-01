<script setup lang="ts">
import { Github, Linkedin, Rss, Twitter } from 'lucide-vue-next';
import type { ContentBlock } from '~/types/content';

const { locale } = useI18n();
const { siteName, setRssFeed } = useSeo();
setRssFeed({ includeBlog: true });

useSeoMeta({
  ogSiteName: siteName.value,
  twitterCard: 'summary_large_image',
});

const currentYear = new Date().getFullYear();

// RSS lives under /api/rss/<locale>.xml — that's a Nitro server route,
// not a Vue page, so we build the href directly (no localePath/NuxtLink).
const rssHref = computed(() => `/api/rss/${locale.value}.xml`);

// Footer social links are backend-driven (ContentBlocks), never hardcoded —
// hardcoded handles drift from the real accounts and pollute the identity
// signals. Shares the `home-content-blocks` fetch key with the home page.
const { data: contentBlocks } = await useApiPaginated<ContentBlock>(
  'home-content-blocks',
  '/api/content-blocks/',
  { page_name: 'home', expand: 'images' },
);
const blockText = (key: string) =>
  contentBlocks.value?.results?.find((b) => b.key === key)?.text || '';

const githubUrl = computed(() => blockText('contact_github'));
const linkedinUrl = computed(() => blockText('contact_linkedin'));
// No X/Twitter ContentBlock exists yet; render the link only once one is
// configured (either key), so we never ship a placeholder that 404s.
const twitterUrl = computed(
  () => blockText('contact_twitter') || blockText('contact_x'),
);
</script>

<template>
  <div class="min-h-screen flex flex-col bg-paper text-ink color-mode-fade">
    <AppNavbar />

    <main class="flex-1">
      <slot />
    </main>

    <footer
      class="border-t border-line color-mode-fade mt-auto"
      :aria-label="$t('footer.label')"
    >
      <div
        class="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between font-mono text-[12px] text-ink-3"
      >
        <div class="flex items-center gap-3">
          <span
            class="w-6 h-6 grid place-items-center rounded-md bg-ink text-paper text-[10px] font-bold"
            >LC</span
          >
          <span>© {{ currentYear }} leonardocosta.dev</span>
        </div>

        <nav class="flex items-center gap-5" :aria-label="$t('footer.social')">
          <a
            v-if="githubUrl"
            :href="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
            title="GitHub"
          >
            <Github :size="14" :stroke-width="1.8" />
            <span class="hidden sm:inline">github</span>
          </a>
          <a
            v-if="linkedinUrl"
            :href="linkedinUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
            title="LinkedIn"
          >
            <Linkedin :size="14" :stroke-width="1.8" />
            <span class="hidden sm:inline">linkedin</span>
          </a>
          <a
            :href="rssHref"
            class="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
            title="RSS"
          >
            <Rss :size="14" :stroke-width="1.8" />
            <span class="hidden sm:inline">rss</span>
          </a>
          <a
            v-if="twitterUrl"
            :href="twitterUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
            title="X / Twitter"
          >
            <Twitter :size="14" :stroke-width="1.8" />
            <span class="hidden sm:inline">x</span>
          </a>
        </nav>

        <div class="text-ink-3">
          built with nuxt · tailwind
        </div>
      </div>
    </footer>
  </div>
</template>
