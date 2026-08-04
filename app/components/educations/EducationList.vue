<script setup lang="ts">
/**
 * Academic education — vertical timeline rail, same visual pattern as
 * ExperienceList: date column · dot on a connecting line · content card.
 *
 * Simpler than Experience: no grouping (one entry per row), no location,
 * "current" is just !end_date.
 *
 * Backend contract unchanged: /api/educations/ with limit=10 + paginated
 * `next` walked on demand.
 */
import type { DjangoListResponse } from '~/types/api';
import type { Education } from '~/types/portfolio';
import { formatShortMonthYearOrPresent } from '~/utils/date';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';

const { locale, t } = useI18n();
const config = useRuntimeConfig();

const expandedItems = ref<Set<number>>(new Set());
const allEducations = ref<Education[]>([]);
const displayCount = ref(3);
const nextPage = ref<string | null>(null);
const isLoading = ref(false);

const apiHeaders = computed(() => ({
  'Accept-Language': unref(locale) === 'pt-br' ? 'pt-br' : 'en-us',
}));

const { data: initialData } = await useApi<DjangoListResponse<Education>>(
  '/api/educations/',
  { params: { limit: 10, ordering: '-start_date' } },
);

if (initialData.value) {
  allEducations.value = initialData.value.results || [];
  nextPage.value = initialData.value.next;
}

const seeMore = async () => {
  if (displayCount.value < allEducations.value.length) {
    displayCount.value = Math.min(displayCount.value + 3, allEducations.value.length);
    return;
  }
  if (!nextPage.value || isLoading.value) return;
  isLoading.value = true;
  try {
    const data = await $fetch<DjangoListResponse<Education>>(nextPage.value, {
      baseURL: config.public.apiBase,
      headers: apiHeaders.value,
    });
    if (data) {
      allEducations.value = [...allEducations.value, ...(data.results || [])];
      nextPage.value = data.next;
      displayCount.value = Math.min(displayCount.value + 3, allEducations.value.length);
    }
  } catch (err) {
    console.error('Error loading more educations:', err);
  } finally {
    isLoading.value = false;
  }
};

const seeLess = () => (displayCount.value = 3);
const handleToggle = () => (hasMore.value ? seeMore() : seeLess());

const displayedEducations = computed(() =>
  allEducations.value.slice(0, displayCount.value),
);
const hasMore = computed(
  () => displayCount.value < allEducations.value.length || !!nextPage.value,
);
const showButton = computed(
  () => allEducations.value.length > 3 || displayCount.value > 3,
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

const isCurrent = (edu: Education) => !edu.end_date;

const calculateDuration = (startDate: string | null, endDate: string | null) => {
  if (!startDate) return '';
  // Parse as local midnight — see ExperienceList.calculateDuration: UTC parse
  // + local getMonth() makes server and client disagree about the month.
  const start = new Date(startDate + 'T00:00:00');
  const end = endDate ? new Date(endDate + 'T00:00:00') : new Date();
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
</script>

<template>
  <div>
    <ol v-if="displayedEducations.length" class="relative fade-up">
      <li
        v-for="(edu, idx) in displayedEducations"
        :key="edu.id"
        class="group/row"
      >
        <div class="flex gap-4 sm:gap-6">
          <!-- Date column (desktop) -->
          <div class="hidden md:block shrink-0 w-[136px] text-right pt-7">
            <div class="font-mono text-[12.5px] text-ink-2 tabular-nums">
              {{
                edu.start_date
                  ? formatShortMonthYearOrPresent(
                      edu.start_date,
                      locale,
                      t('common.present'),
                    )
                  : '—'
              }}
            </div>
            <div class="font-mono text-[12.5px] mt-0.5 tabular-nums">
              <template v-if="isCurrent(edu)">
                <span class="text-accent">→ {{ t('common.present') }}</span>
              </template>
              <template v-else>
                <span class="text-ink-2"
                  >→
                  {{
                    formatShortMonthYearOrPresent(
                      edu.end_date,
                      locale,
                      t('common.present'),
                    )
                  }}</span
                >
              </template>
            </div>
            <div
              v-if="edu.start_date"
              class="font-mono text-[11px] text-ink-3 mt-2 tracking-[0.08em]"
            >
              {{ calculateDuration(edu.start_date, edu.end_date) }}
            </div>
          </div>

          <!-- Timeline rail with dot -->
          <div class="relative shrink-0 w-5 flex flex-col items-center">
            <div
              class="w-px h-7"
              :class="idx === 0 ? '' : 'bg-line'"
              aria-hidden="true"
            />
            <div class="relative w-3 h-3 z-10">
              <span
                v-if="isCurrent(edu)"
                aria-hidden="true"
                class="absolute inset-0 rounded-full bg-accent/40 animate-ping"
              />
              <span
                class="relative block w-3 h-3 rounded-full ring-4 ring-paper transition-colors"
                :class="isCurrent(edu) ? 'bg-accent' : 'bg-line-2'"
              />
            </div>
            <div
              class="w-px flex-1 min-h-[2rem]"
              :class="idx === displayedEducations.length - 1 ? '' : 'bg-line'"
              aria-hidden="true"
            />
          </div>

          <!-- Content -->
          <article
            class="flex-1 min-w-0 py-6 pl-1 sm:pl-2 pr-3 sm:pr-4 transition-colors group-hover/row:bg-card-soft/40 rounded-card"
          >
            <!-- Mobile date line -->
            <div
              class="md:hidden font-mono text-[11.5px] text-ink-3 mb-2 tabular-nums"
            >
              {{
                edu.start_date
                  ? formatShortMonthYearOrPresent(
                      edu.start_date,
                      locale,
                      t('common.present'),
                    )
                  : '—'
              }}
              <span class="text-ink-4 mx-1">—</span>
              <template v-if="isCurrent(edu)">
                <span class="text-accent">{{ t('common.present') }}</span>
              </template>
              <template v-else>
                {{
                  formatShortMonthYearOrPresent(
                    edu.end_date,
                    locale,
                    t('common.present'),
                  )
                }}
              </template>
              <template v-if="edu.start_date">
                <span class="text-ink-4 mx-1">·</span>
                {{ calculateDuration(edu.start_date, edu.end_date) }}
              </template>
            </div>

            <h3
              class="text-[17px] sm:text-[18px] font-semibold flex items-center gap-2 flex-wrap"
            >
              <span>{{ edu.degree }}</span>
              <span class="text-ink-3 font-normal" aria-hidden="true">·</span>
              <span class="text-ink-2 font-medium">{{ edu.institution }}</span>
              <Chip v-if="isCurrent(edu)" variant="blue" class="!text-[10.5px]">
                {{ t('common.current') }}
              </Chip>
            </h3>

            <div v-if="edu.description" class="mt-3">
              <p
                class="text-[14.5px] text-ink-2 leading-[1.7] whitespace-pre-wrap"
              >
                <template
                  v-if="!isExpanded(edu.id) && shouldShowReadMore(edu.description)"
                >
                  {{ getTruncatedText(edu.description) }}
                </template>
                <template v-else>
                  {{ edu.description }}
                </template>
              </p>
              <button
                v-if="shouldShowReadMore(edu.description)"
                type="button"
                class="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-2 transition-colors"
                :aria-expanded="isExpanded(edu.id)"
                @click="toggleExpanded(edu.id)"
              >
                {{
                  isExpanded(edu.id) ? t('common.readLess') : t('common.readMore')
                }}
                <component
                  :is="isExpanded(edu.id) ? ChevronUp : ChevronDown"
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
