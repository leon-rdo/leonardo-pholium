<script setup lang="ts">
/**
 * Compact About section — section label on the left rail, two-column
 * paragraph block on the right. Fully backend-driven: render only the
 * paragraphs that have an `about_intro` / `about_intro_2` ContentBlock,
 * hide the whole section when nothing is configured. No AI-mocked
 * fallbacks here.
 */
import type { ContentBlock } from '~/types/content';

interface Props {
  contentBlocks: ContentBlock[];
}
const props = defineProps<Props>();

const blockText = (key: string) =>
  props.contentBlocks.find((b) => b.key === key)?.text;
const blockKind = (key: string) =>
  props.contentBlocks.find((b) => b.key === key)?.kind;

const intro1 = computed(() => blockText('about_intro'));
const intro2 = computed(() => blockText('about_intro_2'));
const intro1Kind = computed(() => blockKind('about_intro') || 'text');
const intro2Kind = computed(() => blockKind('about_intro_2') || 'text');

const hasAnyIntro = computed(() => !!intro1.value || !!intro2.value);
</script>

<template>
  <section v-if="hasAnyIntro">
    <div class="max-w-[1280px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-6">
      <div class="md:col-span-3 fade-up">
        <!-- Every other home section has an h2; without one this block was
             unreachable by heading navigation. -->
        <h2 class="sr-only">{{ $t('home.about.label') }}</h2>
        <SectionLabel :name="$t('home.about.label')" aria-hidden="true" />
      </div>
      <div
        :class="[
          'md:col-span-9 grid grid-cols-1 gap-8 md:gap-12 text-[16px] sm:text-[16.5px] leading-[1.7] text-ink-2 fade-up',
          // CMS html: preflight strips link colour and underline entirely.
          '[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-ink [&_strong]:font-semibold',
          intro1 && intro2 ? 'md:grid-cols-2' : 'md:grid-cols-1',
        ]"
      >
        <div v-if="intro1Kind === 'html' && intro1" v-html="intro1" />
        <p v-else-if="intro1">{{ intro1 }}</p>

        <div v-if="intro2Kind === 'html' && intro2" v-html="intro2" />
        <p v-else-if="intro2">{{ intro2 }}</p>
      </div>
    </div>
  </section>
</template>
