<script setup lang="ts">
/**
 * Hero bento — 12-col × 5-row grid that lays out:
 *   - col-7 row-4 : name + headline + description + CTAs
 *   - col-5 row-4 : portrait
 *   - 4 × col-3 row-1 : stats (only the ones with a configured value render)
 *
 * Every piece of "content" — copy, stat values, portrait labels — is read
 * from ContentBlocks. Nothing is mocked in the template.
 *
 * Recognised ContentBlock keys (page_name="home"):
 *   hero_badge
 *   hero_kicker_lead, hero_kicker_mid, hero_kicker_accent, hero_kicker_tail
 *   hero_subtitle
 *   hero_initials                  — used when no portrait image is wired
 *   hero_portrait                  — has `images[]`; first cover image used
 *                                    (legacy fallback also checks `hero_image`,
 *                                    `about_intro`)
 *   hero_portrait_label            — label rendered on the portrait bottom-left
 *   hero_location                  — bottom-right portrait label
 *   hero_stat_1_value, hero_stat_1_label  (1..4)
 *
 * The h1 opens with the full site name (site settings, "Leonardo Costa"):
 * the tagline alone left the name people search for out of the page's h1.
 * The legacy `hero_name` block holds only the first name, so it isn't used.
 *
 * The fake `whoami.sh` terminal (hero_terminal_line_*) and the floating glass
 * chips (hero_chip_top/bottom) were removed as template ornament; those
 * blocks are no longer read.
 */
import type { ContentBlock } from '~/types/content';
import { ArrowRight } from 'lucide-vue-next';

interface Props {
  contentBlocks: ContentBlock[];
}
const props = defineProps<Props>();

const localePath = useLocalePath();
const { siteName } = useSeo();

const blockText = (key: string) =>
  props.contentBlocks.find((b) => b.key === key)?.text || '';

// Hero copy (each piece optional; the hero still renders if some are missing).
const badgeText = computed(() => blockText('hero_badge'));
const heroName = computed(() => siteName.value);
const lineKickerLead = computed(() => blockText('hero_kicker_lead'));
const lineKickerMid = computed(() => blockText('hero_kicker_mid'));
const lineKickerAccent = computed(() => blockText('hero_kicker_accent'));
const lineKickerTail = computed(() => blockText('hero_kicker_tail'));
const subtitleText = computed(() => blockText('hero_subtitle'));
const initials = computed(() => blockText('hero_initials') || 'LC');
const portraitLabel = computed(() => blockText('hero_portrait_label'));
const locationLabel = computed(() => blockText('hero_location'));

// Has at least one piece of headline copy?
const hasHeadline = computed(
  () =>
    !!lineKickerLead.value ||
    !!lineKickerMid.value ||
    !!lineKickerAccent.value ||
    !!lineKickerTail.value,
);

// Stats — keep only the ones with a configured value.
const stats = computed(() =>
  ([1, 2, 3, 4] as const)
    .map((n) => ({
      value: blockText(`hero_stat_${n}_value`),
      label: blockText(`hero_stat_${n}_label`),
    }))
    .filter((s) => !!s.value),
);

// Portrait image — looked up across a few likely ContentBlock keys so the
// admin can pick whichever feels natural. Returns the first cover/gallery
// image's `file` (or `thumbnail`) URL, or null when nothing is attached.
const portraitImage = computed(() => {
  const candidateKeys = ['hero_portrait', 'hero_image', 'about_intro'];
  for (const key of candidateKeys) {
    const block = props.contentBlocks.find((b) => b.key === key);
    if (!block?.images?.length) continue;
    const cover =
      block.images.find((img) => img.image_type === 'cover') ||
      block.images.find((img) => img.image_type === 'gallery') ||
      block.images[0];
    if (cover?.file || cover?.thumbnail) return cover;
  }
  return null;
});

const portraitAlt = computed(() => {
  const img = portraitImage.value;
  return img?.alt_text || img?.title || `${initials.value} — portrait`;
});
</script>

<template>
  <section class="relative">
    <div class="relative max-w-[1280px] mx-auto px-6 pt-10 pb-6">
      <!-- Mobile: stack vertically, stats two-up. lg+: 12-col bento with 5 rows. -->
      <div class="grid grid-cols-2 lg:grid-cols-12 gap-3 lg:auto-rows-[160px]">
        <!-- HEADLINE -->
        <Tile
          variant="card"
          :ring="true"
          class="col-span-2 lg:col-span-7 lg:row-span-4 px-8 py-8 sm:px-10 sm:py-10 flex flex-col justify-between fade-up"
        >
          <div>
            <div
              v-if="badgeText"
              class="inline-flex items-center gap-2 mb-7 px-3 py-1 rounded-chip bg-paper ring-hair"
            >
              <span class="w-2 h-2 rounded-full bg-status-ok" aria-hidden="true" />
              <span class="font-mono text-ink-2 text-[12px]">
                {{ badgeText }}
              </span>
            </div>

            <h1
              v-if="hasHeadline"
              class="h-display text-[56px] sm:text-[72px] lg:text-[88px] font-bold -ml-[2px]"
            >
              <span
                class="block ml-[2px] mb-4 sm:mb-5 text-[20px] sm:text-[24px] font-semibold tracking-[-0.01em] leading-tight text-ink"
                >{{ heroName }}</span
              >{{ ' ' }}
<template v-if="lineKickerLead">{{ lineKickerLead }}{{ ' ' }}<br /></template>
              <span v-if="lineKickerMid" class="text-ink-2 font-medium">{{ lineKickerMid }}</span>
              <template v-if="lineKickerMid && lineKickerAccent">{{ ' ' }}</template>
              <span v-if="lineKickerAccent" class="text-accent">{{ lineKickerAccent }}</span>
              <template v-if="lineKickerTail"><br />{{ ' ' }}{{ lineKickerTail }}</template>
            </h1>
          </div>

          <div class="mt-8">
            <p
              v-if="subtitleText"
              class="text-[16px] sm:text-[16.5px] leading-[1.65] text-ink-2 max-w-[540px]"
            >
              {{ subtitleText }}
            </p>
            <div class="mt-6 flex flex-wrap gap-2.5 items-center">
              <UiButton
                as="NuxtLink"
                :to="localePath('/projects')"
                variant="primary"
                size="md"
              >
                {{ $t('home.hero.viewWork') }}
                <ArrowRight :size="16" :stroke-width="2" />
              </UiButton>
              <UiButton
                as="NuxtLink"
                :to="localePath('/about')"
                variant="secondary"
                size="md"
              >
                {{ $t('home.hero.aboutMe') }}
              </UiButton>
            </div>
          </div>
        </Tile>

        <!-- PORTRAIT. Below lg there are no grid rows to size it, and the
             absolutely positioned image collapsed to 0px — the aspect ratio
             gives it a height of its own. -->
        <Tile
          variant="card"
          :ring="true"
          class="col-span-2 aspect-square sm:aspect-[16/10] lg:aspect-auto lg:col-span-5 lg:row-span-4 bg-gradient-to-br from-blob-1/40 via-blob-2/25 to-blob-3/40 fade-up"
        >
          <NuxtImg
            v-if="portraitImage"
            :src="portraitImage.file || portraitImage.thumbnail || ''"
            :alt="portraitAlt"
            :width="portraitImage.width || 800"
            :height="portraitImage.height || 1000"
            format="webp"
            sizes="sm:100vw lg:520px"
            :placeholder="true"
            :quality="85"
            fit="cover"
            preload
            loading="eager"
            fetchpriority="high"
            decoding="async"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <div v-else class="absolute inset-0 grid place-items-center">
            <div
              class="h-display font-extrabold text-ink/15 leading-none text-[140px] sm:text-[180px] lg:text-[200px]"
              aria-hidden="true"
            >
              {{ initials }}
            </div>
          </div>

          <!-- bottom shade for label readability when an image is rendered -->
          <div
            v-if="portraitImage && (portraitLabel || locationLabel)"
            aria-hidden="true"
            class="absolute inset-x-0 bottom-0 h-32 scrim-night"
          />
          <div
            v-if="portraitLabel || locationLabel"
            class="absolute inset-x-0 bottom-0 px-5 py-5 flex flex-wrap gap-x-4 gap-y-1 justify-between items-end"
          >
            <span
              v-if="portraitLabel"
              :class="[
                'font-mono text-[11px] tracking-[0.16em] uppercase',
                portraitImage ? 'text-night-text/85' : 'text-ink-2',
              ]"
              >{{ portraitLabel }}</span
            >
            <span
              v-if="locationLabel"
              :class="[
                'font-mono text-[11px] tracking-[0.16em] uppercase',
                portraitImage ? 'text-night-text/85' : 'text-ink-2',
              ]"
              >{{ locationLabel }}</span
            >
          </div>
        </Tile>

        <!-- STATS row (each tile renders only when its value is configured).
             Label on top, value on the floor of the tile — the value used to
             sit at the top with the rest of the 160px row empty. -->
        <Tile
          v-for="(stat, idx) in stats"
          :key="idx"
          class="lg:col-span-3 lg:row-span-1 px-5 py-5 bg-card flex flex-col justify-between gap-3 fade-up"
        >
          <div v-if="stat.label" class="font-mono-rail text-[11px]">
            {{ stat.label }}
          </div>
          <div class="h-display text-[34px] font-bold tabular-nums">
            {{ stat.value }}
          </div>
        </Tile>
      </div>
    </div>
  </section>
</template>
