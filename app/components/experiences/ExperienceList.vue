<script setup lang="ts">
/**
 * Experience timeline — vertical rail with connecting line + per-entry dot.
 *
 *   <date col>   <rail>   <content card>
 *      jul/25      ●      Backend Engineer · Parti Digital  [current]
 *      → atual     │      BELÉM — PA
 *      6 meses     │      Description...
 *                  │
 *      jul/24      ●      Backend Engineer · FebraCIS
 *
 * The rail is composed in flex-col inside each <li>: a short top stub +
 * the dot + a flex-1 bottom stub. First entry hides the top stub, last
 * entry hides the bottom stub, which naturally clips the line to the
 * first/last dots without extra positioning math.
 *
 * Backend contract unchanged: /api/experiences/ paginated; "see more"
 * walks `next` URL on demand.
 */
import type { DjangoListResponse } from '~/types/api';
import type { Experience } from '~/types/portfolio';
import { formatShortMonthYearOrPresent } from '~/utils/date';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-vue-next';

const { locale, t } = useI18n();
const config = useRuntimeConfig();

const expandedItems = ref<Set<number>>(new Set());
const allExperiences = ref<Experience[]>([]);
const displayCount = ref(3);
const nextPage = ref<string | null>(null);
const isLoading = ref(false);

const apiHeaders = computed(() => ({
  'Accept-Language': unref(locale) === 'pt-br' ? 'pt-br' : 'en-us',
}));

const { data: initialData } = await useApi<DjangoListResponse<Experience>>(
  '/api/experiences/',
  { params: { limit: 10, ordering: '-start_date' } },
);

if (initialData.value) {
  allExperiences.value = initialData.value.results || [];
  nextPage.value = initialData.value.next;
}

const seeMore = async () => {
  if (displayCount.value < allExperiences.value.length) {
    displayCount.value = Math.min(displayCount.value + 3, allExperiences.value.length);
    return;
  }
  if (!nextPage.value || isLoading.value) return;
  isLoading.value = true;
  try {
    const data = await $fetch<DjangoListResponse<Experience>>(nextPage.value, {
      baseURL: config.public.apiBase,
      headers: apiHeaders.value,
    });
    if (data) {
      allExperiences.value = [...allExperiences.value, ...(data.results || [])];
      nextPage.value = data.next;
      displayCount.value = Math.min(displayCount.value + 3, allExperiences.value.length);
    }
  } catch (err) {
    console.error('Error loading more experiences:', err);
  } finally {
    isLoading.value = false;
  }
};

const seeLess = () => {
  displayCount.value = 3;
};

const handleToggle = () => (hasMore.value ? seeMore() : seeLess());

const displayedExperiences = computed(() =>
  allExperiences.value.slice(0, displayCount.value),
);
const hasMore = computed(
  () => displayCount.value < allExperiences.value.length || !!nextPage.value,
);
const showButton = computed(
  () => allExperiences.value.length > 3 || displayCount.value > 3,
);

const toggleExpanded = (id: number) => {
  if (expandedItems.value.has(id)) expandedItems.value.delete(id);
  else expandedItems.value.add(id);
};
const isExpanded = (id: number) => expandedItems.value.has(id);
const shouldShowReadMore = (description: string) =>
  !!description && description.length > 200;
const getTruncatedText = (text: string, maxLength = 200) =>
  !text || text.length <= maxLength ? text : text.substring(0, maxLength).trim() + '…';

const calculateDuration = (
  startDate: string,
  endDate: string | null,
  isCurrent: boolean,
) => {
  const start = new Date(startDate);
  const end = isCurrent ? new Date() : new Date(endDate || new Date());
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (years === 0) {
    return remaining === 1 ? `1 ${t('common.month')}` : `${remaining} ${t('common.months')}`;
  } else if (remaining === 0) {
    return years === 1 ? `1 ${t('common.year')}` : `${years} ${t('common.years')}`;
  }
  const yearText = years === 1 ? `1 ${t('common.year')}` : `${years} ${t('common.years')}`;
  const monthText =
    remaining === 1 ? `1 ${t('common.month')}` : `${remaining} ${t('common.months')}`;
  return `${yearText} ${t('common.and')} ${monthText}`;
};

interface GroupedExperience {
  company: string;
  location: string | null;
  positions: Experience[];
  totalDuration: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

const groupedExperiences = computed<GroupedExperience[]>(() => {
  const groups = new Map<string, GroupedExperience>();
  displayedExperiences.value.forEach((exp) => {
    if (!groups.has(exp.company)) {
      groups.set(exp.company, {
        company: exp.company,
        location: exp.location,
        positions: [exp],
        totalDuration: '',
        startDate: exp.start_date,
        endDate: exp.end_date,
        isCurrent: exp.current,
      });
    } else {
      const g = groups.get(exp.company)!;
      g.positions.push(exp);
      if (new Date(exp.start_date) < new Date(g.startDate)) g.startDate = exp.start_date;
      if (exp.current) {
        g.isCurrent = true;
        g.endDate = null;
      } else if (!g.isCurrent) {
        if (!g.endDate || new Date(exp.end_date!) > new Date(g.endDate))
          g.endDate = exp.end_date;
      }
    }
  });
  groups.forEach((g) => {
    g.positions.sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    );
    g.totalDuration = calculateDuration(g.startDate, g.endDate, g.isCurrent);
  });
  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
});

// OrganizationRole (not a nameless Person) is the schema.org shape for
// "held role X at org Y from date A to B".
const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: allExperiences.value.map((exp, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'OrganizationRole',
      roleName: exp.role,
      startDate: exp.start_date,
      ...(exp.current ? {} : { endDate: exp.end_date }),
      worksFor: { '@type': 'Organization', name: exp.company },
      member: { '@id': `${config.public.siteUrl}/#identity` },
    },
  })),
}));

useHead({
  script: [
    {
      key: 'ld-experiences',
      type: 'application/ld+json',
      // Function form keeps it reactive — a plain JSON.stringify here froze
      // the first (empty) render into the head.
      innerHTML: () => JSON.stringify(structuredData.value),
    },
  ],
});
</script>

<template>
  <div>
    <ol v-if="groupedExperiences.length" class="relative fade-up">
      <li
        v-for="(group, idx) in groupedExperiences"
        :key="group.company"
        class="group/row"
      >
        <div class="flex gap-4 sm:gap-6">
          <!-- Date column (desktop) -->
          <div class="hidden md:block shrink-0 w-[136px] text-right pt-7">
            <div class="font-mono text-[12.5px] text-ink-2 tabular-nums">
              {{ formatShortMonthYearOrPresent(group.startDate, locale, t('common.present')) }}
            </div>
            <div class="font-mono text-[12.5px] mt-0.5 tabular-nums">
              <template v-if="group.isCurrent">
                <span class="text-accent">→ {{ t('common.present') }}</span>
              </template>
              <template v-else>
                <span class="text-ink-2"
                  >→
                  {{
                    formatShortMonthYearOrPresent(
                      group.endDate,
                      locale,
                      t('common.present'),
                    )
                  }}</span
                >
              </template>
            </div>
            <div class="font-mono text-[11px] text-ink-3 mt-2 tracking-[0.08em]">
              {{ group.totalDuration }}
            </div>
          </div>

          <!-- Timeline rail with dot -->
          <div class="relative shrink-0 w-5 flex flex-col items-center">
            <!-- top stub (hidden on first item — clips the line at the topmost dot) -->
            <div
              class="w-px h-7"
              :class="idx === 0 ? '' : 'bg-line'"
              aria-hidden="true"
            />
            <!-- the dot itself -->
            <div class="relative w-3 h-3 z-10">
              <span
                v-if="group.isCurrent"
                aria-hidden="true"
                class="absolute inset-0 rounded-full bg-accent/40 animate-ping"
              />
              <span
                class="relative block w-3 h-3 rounded-full ring-4 ring-paper transition-colors"
                :class="group.isCurrent ? 'bg-accent' : 'bg-line-2'"
              />
            </div>
            <!-- bottom stub (flex-1; hidden on last item) -->
            <div
              class="w-px flex-1 min-h-[2rem]"
              :class="idx === groupedExperiences.length - 1 ? '' : 'bg-line'"
              aria-hidden="true"
            />
          </div>

          <!-- Content -->
          <article
            class="flex-1 min-w-0 py-6 pl-1 sm:pl-2 pr-3 sm:pr-4 transition-colors group-hover/row:bg-card-soft/40 rounded-card"
          >
            <!-- Mobile date line (only visible <md) -->
            <div
              class="md:hidden font-mono text-[11.5px] text-ink-3 mb-2 tabular-nums"
            >
              {{
                formatShortMonthYearOrPresent(
                  group.startDate,
                  locale,
                  t('common.present'),
                )
              }}
              <span class="text-ink-4 mx-1">—</span>
              <template v-if="group.isCurrent">
                <span class="text-accent">{{ t('common.present') }}</span>
              </template>
              <template v-else>
                {{
                  formatShortMonthYearOrPresent(
                    group.endDate,
                    locale,
                    t('common.present'),
                  )
                }}
              </template>
              <span class="text-ink-4 mx-1">·</span>
              {{ group.totalDuration }}
            </div>

            <!-- Title -->
            <h3
              class="text-[17px] sm:text-[18px] font-semibold flex items-center gap-2 flex-wrap"
            >
              <span>{{ group.positions[0].role }}</span>
              <span class="text-ink-3 font-normal" aria-hidden="true">·</span>
              <span class="text-ink-2 font-medium">{{ group.company }}</span>
              <Chip
                v-if="group.isCurrent"
                variant="blue"
                class="!text-[10.5px]"
              >
                {{ t('common.current') }}
              </Chip>
            </h3>

            <p
              v-if="group.location"
              class="mt-1.5 inline-flex items-center gap-1 font-mono text-[11.5px] text-ink-3 uppercase tracking-[0.12em]"
            >
              <MapPin :size="11" :stroke-width="1.8" />
              {{ group.location }}
            </p>

            <!-- Sub-positions (when more than one at the same company) -->
            <ul
              v-if="group.positions.length > 1"
              class="mt-3 pl-3.5 border-l-2 border-line space-y-2"
            >
              <li
                v-for="position in group.positions.slice(1)"
                :key="position.id"
                class="text-[14px] text-ink-2 leading-snug"
              >
                <span class="font-medium">{{ position.role }}</span>
                <span class="font-mono text-[11.5px] text-ink-3 ml-2 tabular-nums">
                  {{
                    formatShortMonthYearOrPresent(
                      position.start_date,
                      locale,
                      t('common.present'),
                    )
                  }}
                  —
                  {{
                    position.current
                      ? t('common.present')
                      : formatShortMonthYearOrPresent(
                          position.end_date,
                          locale,
                          t('common.present'),
                        )
                  }}
                </span>
              </li>
            </ul>

            <!-- Description (most recent position) -->
            <div v-if="group.positions[0].description" class="mt-3">
              <p
                class="text-[14.5px] text-ink-2 leading-[1.7] whitespace-pre-wrap"
              >
                <template
                  v-if="
                    !isExpanded(group.positions[0].id) &&
                    shouldShowReadMore(group.positions[0].description)
                  "
                >
                  {{ getTruncatedText(group.positions[0].description) }}
                </template>
                <template v-else>
                  {{ group.positions[0].description }}
                </template>
              </p>
              <button
                v-if="shouldShowReadMore(group.positions[0].description)"
                type="button"
                class="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-2 transition-colors"
                :aria-expanded="isExpanded(group.positions[0].id)"
                @click="toggleExpanded(group.positions[0].id)"
              >
                {{
                  isExpanded(group.positions[0].id)
                    ? t('common.readLess')
                    : t('common.readMore')
                }}
                <component
                  :is="isExpanded(group.positions[0].id) ? ChevronUp : ChevronDown"
                  :size="14"
                  :stroke-width="2"
                />
              </button>
            </div>
          </article>
        </div>
      </li>
    </ol>

    <div v-if="showButton" class="mt-8 flex justify-center fade-up">
      <UiButton variant="secondary" size="md" @click="handleToggle">
        {{ hasMore ? t('common.seeMore') : t('common.seeLess') }}
        <component
          :is="hasMore ? ChevronDown : ChevronUp"
          :size="16"
          :stroke-width="2"
        />
      </UiButton>
    </div>
  </div>
</template>
