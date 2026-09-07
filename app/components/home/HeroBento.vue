<script setup lang="ts">
/**
 * Hero bento — 12-col × 5-row grid that lays out:
 *   - col-7 row-4 : headline + description + CTAs
 *   - col-5 row-3 : portrait (aurora + glass chips)
 *   - col-5 row-1 : terminal whoami.sh (only if any line is configured)
 *   - 4 × col-3 row-1 : stats (only the ones with a configured value render)
 *
 * Every piece of "content" — copy, stat values, floating chips, terminal
 * lines — is read from ContentBlocks. Nothing is mocked in the template.
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
 *   hero_chip_top, hero_chip_bottom
 *   hero_terminal_line_1..3        — each line uses the format
 *                                    "cmd → output" (split on " → ").
 *                                    A line with just text shows it as out-only.
 *   hero_stat_1_value, hero_stat_1_label  (1..4)
 */
import type { ContentBlock } from '~/types/content';
import { ArrowRight, ArrowUp } from 'lucide-vue-next';

interface Props {
  contentBlocks: ContentBlock[];
}
const props = defineProps<Props>();

const localePath = useLocalePath();

const blockText = (key: string) =>
  props.contentBlocks.find((b) => b.key === key)?.text || '';

// Hero copy (each piece optional; the hero still renders if some are missing).
const badgeText = computed(() => blockText('hero_badge'));
const lineKickerLead = computed(() => blockText('hero_kicker_lead'));
const lineKickerMid = computed(() => blockText('hero_kicker_mid'));
const lineKickerAccent = computed(() => blockText('hero_kicker_accent'));
const lineKickerTail = computed(() => blockText('hero_kicker_tail'));
const subtitleText = computed(() => blockText('hero_subtitle'));
const initials = computed(() => blockText('hero_initials') || 'LC');
const portraitLabel = computed(() => blockText('hero_portrait_label'));
const locationLabel = computed(() => blockText('hero_location'));
const chipTop = computed(() => blockText('hero_chip_top'));
const chipBottom = computed(() => blockText('hero_chip_bottom'));

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

// Terminal — each line is stored as "cmd → output". If there's no arrow,
// the whole text is treated as the output (cmd hidden).
interface TerminalLineParsed {
  cmd?: string;
  out: string;
}
const parseTerminalLine = (raw: string): TerminalLineParsed | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const arrow = trimmed.includes(' → ')
    ? ' → '
    : trimmed.includes(' -> ')
      ? ' -> '
      : null;
  if (!arrow) return { out: trimmed };
  const [cmd, out] = trimmed.split(arrow);
  return { cmd: cmd.trim(), out: out.trim() };
};
const terminalLines = computed(() =>
  ([1, 2, 3, 4, 5] as const)
    .map((n) => parseTerminalLine(blockText(`hero_terminal_line_${n}`)))
    .filter((l): l is TerminalLineParsed => l !== null),
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
    <AuroraBg :intensity="0.45" variant="page" />
    <div class="relative max-w-[1280px] mx-auto px-6 pt-10 pb-6">
      <!-- Mobile: stack vertically. lg+: 12-col bento with 5 rows. -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:auto-rows-[160px]">
        <!-- HEADLINE -->
        <Tile
          variant="card"
          :ring="true"
          class="lg:col-span-7 lg:row-span-4 px-8 py-8 sm:px-10 sm:py-10 flex flex-col justify-between fade-up"
        >
          <div>
            <div
              v-if="badgeText"
              class="font-mono inline-flex items-center gap-2 text-[11.5px] tracking-[0.16em] uppercase mb-7 px-3 py-1 rounded-chip bg-paper ring-hair"
            >
              <span class="relative flex w-2 h-2">
                <span
                  class="absolute inset-0 rounded-full bg-status-ok opacity-40 animate-ping"
                />
                <span class="relative w-2 h-2 rounded-full bg-status-ok" />
              </span>
              <span class="text-ink-2 normal-case tracking-normal text-[12px]">
                {{ badgeText }}
              </span>
            </div>

            <h1
              v-if="hasHeadline"
              class="h-display text-[56px] sm:text-[72px] lg:text-[88px] font-bold -ml-[2px]"
            >
<template v-if="lineKickerLead">{{ lineKickerLead }}{{ ' ' }}<br /></template>
              <span v-if="lineKickerMid" class="text-ink-2 font-medium">{{ lineKickerMid }}</span>
              <template v-if="lineKickerMid && lineKickerAccent">{{ ' ' }}</template>
              <span v-if="lineKickerAccent" class="text-accent">{{ lineKickerAccent }}</span>
              <template v-if="lineKickerTail"><br />{{ ' ' }}{{ lineKickerTail }}</template>
            </h1>
          </div>

          <div>
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
                glow
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

        <!-- PORTRAIT (aurora bg + glass chips) -->
        <Tile
          variant="transparent"
          :ring="false"
          :clip="false"
          class="lg:col-span-5 lg:row-span-3 px-3 py-3 fade-up"
        >
          <div
            class="relative w-full h-full rounded-tile overflow-hidden ring-hair bg-gradient-to-br from-blob-1/40 via-blob-2/25 to-blob-3/40"
          >
            <!-- subtle aurora inside the tile (rendered behind the image) -->
            <div
              aria-hidden="true"
              class="absolute inset-0 pointer-events-none"
              style="
                background:
                  radial-gradient(60% 80% at 30% 0%, rgba(44, 103, 232, 0.18), transparent 70%),
                  radial-gradient(80% 80% at 100% 100%, rgba(255, 209, 195, 0.22), transparent 60%);
                filter: blur(12px);
              "
            />
            <NuxtImg
              v-if="portraitImage"
              :src="portraitImage.file || portraitImage.thumbnail || ''"
              :alt="portraitAlt"
              :width="portraitImage.width || 800"
              :height="portraitImage.height || 1000"
              format="webp"
              sizes="(max-width: 768px) 100vw, 560px"
              :placeholder="true"
              :quality="85"
              fit="cover"
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
              class="absolute inset-x-0 bottom-0 px-5 py-5 flex justify-between items-end"
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

            <!-- floating chips (only when configured) -->
            <div
              v-if="chipTop"
              class="absolute top-4 right-4 glass-cream rounded-chip px-3 py-1.5 font-mono text-[11px] flex items-center gap-1.5"
            >
              <ArrowUp
                :size="12"
                :stroke-width="2.2"
                class="text-emerald-700 dark:text-emerald-400"
              />
              {{ chipTop }}
            </div>
            <div
              v-if="chipBottom"
              class="absolute -bottom-3 -left-3 glass-cream rounded-card px-3 py-2 font-mono text-[11px] flex items-center gap-2"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {{ chipBottom }}
            </div>
          </div>
        </Tile>

        <!-- TERMINAL (only if any line is configured) -->
        <div
          v-if="terminalLines.length"
          class="lg:col-span-5 lg:row-span-1 fade-up"
        >
          <TerminalPanel :title="$t('home.hero.terminalTitle')">
            <TerminalLine
              v-for="(line, idx) in terminalLines"
              :key="idx"
              :cmd="line.cmd"
              :out="line.out"
            />
          </TerminalPanel>
        </div>

        <!-- STATS row (each tile renders only when its value is configured) -->
        <Tile
          v-for="(stat, idx) in stats"
          :key="idx"
          class="lg:col-span-3 lg:row-span-1 px-5 py-5 bg-card fade-up"
        >
          <div v-if="stat.label" class="font-mono-rail text-[11px] mb-1">
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
