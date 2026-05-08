<script setup lang="ts">
/**
 * Academic education — same dense Tile pattern as ExperienceList, but
 * simpler (no grouping by company; one entry per row).
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
</script>

<template>
  <div>
    <Tile v-if="displayedEducations.length" class="px-1 sm:px-2 py-1 sm:py-2 fade-up">
      <ol class="divide-y divide-line">
        <li
          v-for="edu in displayedEducations"
          :key="edu.id"
          class="px-4 sm:px-6 py-6 hover:bg-paper/50 transition-colors rounded-card"
        >
          <header class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6">
            <div class="md:col-span-3">
              <div class="font-mono text-[12.5px] text-ink-2">
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
                    formatShortMonthYearOrPresent(edu.end_date, locale, t('common.present'))
                  }}
                </template>
              </div>
            </div>

            <div class="md:col-span-9">
              <h3 class="text-[17px] sm:text-[18px] font-semibold flex items-center gap-2 flex-wrap">
                <span>{{ edu.degree }}</span>
                <span class="text-ink-3 font-normal">·</span>
                <span class="text-ink-2 font-medium">{{ edu.institution }}</span>
                <Chip v-if="isCurrent(edu)" variant="blue" class="!text-[10.5px]">
                  {{ t('common.current') }}
                </Chip>
              </h3>

              <div v-if="edu.description" class="mt-3">
                <p class="text-[14.5px] text-ink-2 leading-[1.7] whitespace-pre-wrap">
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
                  {{ isExpanded(edu.id) ? t('common.readLess') : t('common.readMore') }}
                  <component
                    :is="isExpanded(edu.id) ? ChevronUp : ChevronDown"
                    :size="14"
                    :stroke-width="2"
                  />
                </button>
              </div>
            </div>
          </header>
        </li>
      </ol>
    </Tile>

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
