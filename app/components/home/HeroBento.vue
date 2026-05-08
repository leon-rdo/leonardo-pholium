<script setup lang="ts">
/**
 * Hero bento — 12-col × 5-row grid that lays out:
 *   - col-7 row-4 : headline + description + CTAs
 *   - col-5 row-3 : portrait (aurora + glass chips)
 *   - col-5 row-1 : terminal whoami.sh
 *   - 4 × col-3 row-1 : stats (years, projects, response, languages)
 *
 * Copy is hydrated from ContentBlocks (`hero_*`) when present, falling back
 * to i18n keys. Stat numbers come from props (or i18n) so they're easy to
 * tweak without a backend round-trip.
 */
import type { ContentBlock } from '~/types/content';
import { ArrowRight, ArrowUp, Command } from 'lucide-vue-next';

interface Props {
  contentBlocks: ContentBlock[];
}
const props = defineProps<Props>();

const { t } = useI18n();
const localePath = useLocalePath();

const blockText = (key: string, fallback?: string) =>
  props.contentBlocks.find((b) => b.key === key)?.text || fallback;

// Hero copy
const badgeText = computed(() => blockText('hero_badge', t('home.hero.badge')));
const lineKickerLead = computed(() => blockText('hero_kicker_lead', t('home.hero.lineLead')));
const lineKickerMid = computed(() => blockText('hero_kicker_mid', t('home.hero.lineMid')));
const lineKickerAccent = computed(() =>
  blockText('hero_kicker_accent', t('home.hero.lineAccent')),
);
const lineKickerTail = computed(() => blockText('hero_kicker_tail', t('home.hero.lineTail')));
const subtitleText = computed(() => blockText('hero_subtitle', t('home.hero.subtitle')));

// Initials shown over the portrait gradient (used as a placeholder when
// no real portrait image is wired yet).
const initials = computed(() => blockText('hero_initials', 'LC'));

/**
 * Portrait image — looked up across a few likely ContentBlock keys so the
 * admin can pick whichever feels natural ("hero_portrait", "hero_image",
 * or even the legacy "about_intro" that already had a cover wired). Returns
 * the first cover/gallery image's `file` (or `thumbnail`) URL, or null
 * when nothing is attached — in which case the LC initials are shown.
 */
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

            <h1 class="h-display text-[56px] sm:text-[72px] lg:text-[88px] font-bold -ml-[2px]">
              {{ lineKickerLead }}<br />
              <span class="text-ink-2 font-medium">{{ lineKickerMid }}</span>
              <!-- Explicit space so the accent word doesn't jam against the kicker -->
              {{ ' ' }}<span class="text-accent">{{ lineKickerAccent }}</span><br />
              {{ lineKickerTail }}
            </h1>
          </div>

          <div>
            <p class="text-[16px] sm:text-[16.5px] leading-[1.65] text-ink-2 max-w-[540px]">
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
                {{ $t('home.hero.readUses') }}
              </UiButton>
              <span class="font-mono-rail text-[11px] ml-2 hidden sm:inline-flex items-center gap-1">
                <Command :size="12" :stroke-width="1.8" />K
              </span>
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
          <!-- the inner card has the gradient + image (or initials placeholder) -->
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
            <!-- Real portrait when present, else big initials placeholder -->
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
            <!-- subtle bottom shade so the rail labels stay readable over a real photo -->
            <div
              v-if="portraitImage"
              aria-hidden="true"
              class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night/55 via-night/15 to-transparent"
            />
            <!-- bottom rail -->
            <div class="absolute inset-x-0 bottom-0 px-5 py-5 flex justify-between items-end">
              <span
                :class="[
                  'font-mono text-[11px] tracking-[0.16em] uppercase',
                  portraitImage ? 'text-night-text/85' : 'text-ink-2',
                ]"
              >
                {{ $t('home.hero.portraitLabel') }}
              </span>
              <span
                :class="[
                  'font-mono text-[11px] tracking-[0.16em] uppercase',
                  portraitImage ? 'text-night-text/85' : 'text-ink-2',
                ]"
              >
                {{ $t('home.hero.location') }}
              </span>
            </div>
            <!-- floating chip top-right (uptime) -->
            <div
              class="absolute top-4 right-4 glass-cream rounded-chip px-3 py-1.5 font-mono text-[11px] flex items-center gap-1.5"
            >
              <ArrowUp :size="12" :stroke-width="2.2" class="text-emerald-700 dark:text-emerald-400" />
              {{ $t('home.hero.uptime') }}
            </div>
            <!-- floating chip bottom-left (deploy) -->
            <div
              class="absolute -bottom-3 -left-3 glass-cream rounded-card px-3 py-2 font-mono text-[11px] flex items-center gap-2"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {{ $t('home.hero.deploying') }}
            </div>
          </div>
        </Tile>

        <!-- TERMINAL mini (col-5, row-1) -->
        <div class="lg:col-span-5 lg:row-span-1 fade-up">
          <TerminalPanel :title="$t('home.hero.terminalTitle')">
            <TerminalLine cmd="whoami" :out="$t('home.hero.terminalWhoami')" />
            <TerminalLine cmd="stack" :out="$t('home.hero.terminalStack')" />
            <TerminalLine cmd="status">
              <span class="text-status-ok">●</span>
              <span class="ml-1 text-night-text">{{ $t('home.hero.terminalStatus') }}</span>
              <span class="ml-1 inline-block w-2 h-3.5 align-middle bg-night-text animate-pulse" />
            </TerminalLine>
          </TerminalPanel>
        </div>

        <!-- STATS row -->
        <Tile class="lg:col-span-3 lg:row-span-1 px-5 py-5 bg-card fade-up">
          <div class="font-mono-rail text-[11px] mb-1">{{ $t('home.hero.stats.years') }}</div>
          <div class="h-display text-[34px] font-bold tabular-nums">
            3<span class="text-accent">+</span>
          </div>
        </Tile>
        <Tile class="lg:col-span-3 lg:row-span-1 px-5 py-5 bg-card fade-up">
          <div class="font-mono-rail text-[11px] mb-1">{{ $t('home.hero.stats.projects') }}</div>
          <div class="h-display text-[34px] font-bold tabular-nums">12</div>
        </Tile>
        <Tile class="lg:col-span-3 lg:row-span-1 px-5 py-5 bg-card fade-up">
          <div class="font-mono-rail text-[11px] mb-1">{{ $t('home.hero.stats.response') }}</div>
          <div class="h-display text-[34px] font-bold tabular-nums">
            &lt; 24<span class="text-2xl">h</span>
          </div>
        </Tile>
        <Tile class="lg:col-span-3 lg:row-span-1 px-5 py-5 bg-card fade-up">
          <div class="font-mono-rail text-[11px] mb-1">{{ $t('home.hero.stats.languages') }}</div>
          <div class="h-display text-[34px] font-bold">
            PT<span class="text-ink-3">/</span>EN
          </div>
        </Tile>
      </div>
    </div>
  </section>
</template>
