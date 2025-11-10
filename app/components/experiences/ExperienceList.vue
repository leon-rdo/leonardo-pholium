<script setup lang="ts">
import type { DjangoListResponse } from "~/types/api";
import type { Experience } from "~/types/portfolio";
import { formatShortMonthYearOrPresent } from "~/utils/date";

const { locale, t } = useI18n();
const config = useRuntimeConfig();

const expandedItems = ref<Set<number>>(new Set());
const allExperiences = ref<Experience[]>([]);
const displayCount = ref(3);
const nextPage = ref<string | null>(null);
const isLoading = ref(false);

const getApiHeaders = () => {
  const localeMap: Record<string, string> = {
    "pt-br": "pt-br",
    "en-us": "en-us",
  };
  const apiLocale = localeMap[unref(locale)] || "en-us";

  return {
    "Accept-Language": apiLocale,
  };
};

const { data: initialData } = await useApi<DjangoListResponse<Experience>>(
  "/api/experiences/",
  {
    params: { limit: 10, ordering: "-start_date" },
  }
);

if (initialData.value) {
  allExperiences.value = initialData.value.results || [];
  nextPage.value = initialData.value.next;
}

const seeMore = async () => {
  if (displayCount.value < allExperiences.value.length) {
    displayCount.value = Math.min(
      displayCount.value + 3,
      allExperiences.value.length
    );
    return;
  }

  if (!nextPage.value || isLoading.value) return;

  isLoading.value = true;
  try {
    const data = await $fetch<DjangoListResponse<Experience>>(nextPage.value, {
      baseURL: config.public.apiBase,
      headers: getApiHeaders(),
    });

    if (data) {
      allExperiences.value = [...allExperiences.value, ...(data.results || [])];
      nextPage.value = data.next;
      displayCount.value = Math.min(
        displayCount.value + 3,
        allExperiences.value.length
      );
    }
  } catch (error) {
    console.error("Error loading more experiences:", error);
  } finally {
    isLoading.value = false;
  }
};

const seeLess = async () => {
  displayCount.value = 3;

  if (allExperiences.value.length <= 10) {
    return;
  }

  try {
    const data = await $fetch<DjangoListResponse<Experience>>(
      "/api/experiences/",
      {
        baseURL: config.public.apiBase,
        headers: getApiHeaders(),
        params: { limit: 10, ordering: "-start_date" },
      }
    );

    if (data) {
      allExperiences.value = data.results || [];
      nextPage.value = data.next;
    }
  } catch (error) {
    console.error("Error reloading experiences:", error);
  }
};

const handleToggle = async () => {
  if (hasMore.value) {
    await seeMore();
  } else {
    await seeLess();
  }
};

const displayedExperiences = computed(() =>
  allExperiences.value.slice(0, displayCount.value)
);

const hasMore = computed(() => {
  return displayCount.value < allExperiences.value.length || !!nextPage.value;
});

const showButton = computed(() => {
  return allExperiences.value.length > 3 || displayCount.value > 3;
});
const hasExperiences = computed(() => allExperiences.value.length > 0);

const toggleExpanded = (id: number) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
};

const isExpanded = (id: number) => expandedItems.value.has(id);

const shouldShowReadMore = (description: string) => {
  return description && description.length > 200;
};

const getTruncatedText = (text: string, maxLength: number = 200) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

const calculateDuration = (
  startDate: string,
  endDate: string | null,
  isCurrent: boolean
) => {
  const start = new Date(startDate);
  const end = isCurrent ? new Date() : new Date(endDate || new Date());

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return remainingMonths === 1
      ? `1 ${t("common.month")}`
      : `${remainingMonths} ${t("common.months")}`;
  } else if (remainingMonths === 0) {
    return years === 1
      ? `1 ${t("common.year")}`
      : `${years} ${t("common.years")}`;
  } else {
    const yearText =
      years === 1 ? `1 ${t("common.year")}` : `${years} ${t("common.years")}`;
    const monthText =
      remainingMonths === 1
        ? `1 ${t("common.month")}`
        : `${remainingMonths} ${t("common.months")}`;
    return `${yearText} ${t("common.and")} ${monthText}`;
  }
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

const groupedExperiences = computed(() => {
  const groups = new Map<string, GroupedExperience>();

  displayedExperiences.value.forEach((exp) => {
    if (!groups.has(exp.company)) {
      groups.set(exp.company, {
        company: exp.company,
        location: exp.location,
        positions: [exp],
        totalDuration: "",
        startDate: exp.start_date,
        endDate: exp.end_date,
        isCurrent: exp.current,
      });
    } else {
      const group = groups.get(exp.company)!;
      group.positions.push(exp);

      if (new Date(exp.start_date) < new Date(group.startDate)) {
        group.startDate = exp.start_date;
      }

      if (exp.current) {
        group.isCurrent = true;
        group.endDate = null;
      } else if (!group.isCurrent) {
        if (
          !group.endDate ||
          new Date(exp.end_date!) > new Date(group.endDate)
        ) {
          group.endDate = exp.end_date;
        }
      }
    }
  });

  groups.forEach((group) => {
    group.positions.sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    group.totalDuration = calculateDuration(
      group.startDate,
      group.endDate,
      group.isCurrent
    );
  });

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
});

const structuredData = computed(() => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: allExperiences.value.map((exp, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Organization",
      name: exp.company,
      employee: {
        "@type": "Person",
        jobTitle: exp.role,
        startDate: exp.start_date,
        endDate: exp.current ? undefined : exp.end_date,
      },
    },
  })),
}));

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(structuredData.value),
    },
  ],
});
</script>

<template>
  <section class="experience-section" aria-labelledby="experience-heading">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <div v-if="!hasExperiences && !isLoading" class="empty-state">
          <v-icon size="64" color="grey-lighten-1"
            >mdi-briefcase-outline</v-icon
          >
          <h3 class="empty-state-title">{{ t("experience.noExperiences") }}</h3>
          <p class="empty-state-text">
            {{ t("experience.noExperiencesDescription") }}
          </p>
        </div>

        <ol
          v-else
          class="timeline"
          role="list"
          aria-label="Professional Experience Timeline"
        >
          <li
            v-for="(group, groupIndex) in groupedExperiences"
            :key="group.company"
            class="timeline-item"
            :class="{ 'fade-up': true, 'is-visible': true }"
            :style="{ animationDelay: `${groupIndex * 0.1}s` }"
          >
            <div class="timeline-marker" aria-hidden="true">
              <div class="timeline-dot"></div>
              <div
                v-if="groupIndex < groupedExperiences.length - 1"
                class="timeline-line"
              ></div>
            </div>

            <article
              class="timeline-content"
              :class="{ 'has-multiple-positions': group.positions.length > 1 }"
              :aria-labelledby="`company-${groupIndex}`"
            >
              <header class="timeline-header">
                <div class="timeline-date-wrapper">
                  <time :datetime="group.startDate" class="timeline-date">
                    {{
                      formatShortMonthYearOrPresent(
                        group.startDate,
                        locale,
                        t("common.present")
                      )
                    }}
                  </time>
                  <span class="timeline-date-separator" aria-hidden="true"
                    >—</span
                  >
                  <time
                    v-if="!group.isCurrent"
                    :datetime="group.endDate || undefined"
                    class="timeline-date"
                  >
                    {{
                      formatShortMonthYearOrPresent(
                        group.endDate,
                        locale,
                        t("common.present")
                      )
                    }}
                  </time>
                  <span v-else class="timeline-date current">
                    {{ t("common.present") }}
                  </span>

                  <span class="timeline-duration">
                    ({{ group.totalDuration }})
                  </span>
                </div>

                <v-chip
                  v-if="group.isCurrent"
                  size="small"
                  color="success"
                  variant="flat"
                  class="current-badge"
                >
                  <v-icon start size="12">mdi-circle</v-icon>
                  {{ t("common.current") }}
                </v-chip>
              </header>

              <div class="timeline-company-info">
                <h3 :id="`company-${groupIndex}`" class="timeline-company">
                  <v-icon size="18" class="company-icon">mdi-domain</v-icon>
                  {{ group.company }}
                </h3>
                <p v-if="group.location" class="timeline-location">
                  <v-icon size="16">mdi-map-marker</v-icon>
                  {{ group.location }}
                </p>

                <v-chip
                  v-if="group.positions.length > 1"
                  size="x-small"
                  variant="outlined"
                  color="primary"
                  class="positions-badge"
                >
                  {{ group.positions.length }} {{ t("experience.positions") }}
                </v-chip>
              </div>

              <div class="positions-list">
                <div
                  v-for="(position, posIndex) in group.positions"
                  :key="position.id"
                  class="position-item"
                  :class="{
                    'has-divider': posIndex < group.positions.length - 1,
                    'is-single': group.positions.length === 1,
                  }"
                >
                  <div class="position-header">
                    <div class="position-info">
                      <h4 class="position-title">{{ position.role }}</h4>
                      <div class="position-dates">
                        <time
                          :datetime="position.start_date"
                          class="position-date"
                        >
                          {{
                            formatShortMonthYearOrPresent(
                              position.start_date,
                              locale,
                              t("common.present")
                            )
                          }}
                        </time>
                        <span class="position-date-separator">—</span>
                        <time
                          v-if="!position.current"
                          :datetime="position.end_date || undefined"
                          class="position-date"
                        >
                          {{
                            formatShortMonthYearOrPresent(
                              position.end_date,
                              locale,
                              t("common.present")
                            )
                          }}
                        </time>
                        <span v-else class="position-date">
                          {{ t("common.present") }}
                        </span>
                        <span class="position-duration">
                          ·
                          {{
                            calculateDuration(
                              position.start_date,
                              position.end_date,
                              position.current
                            )
                          }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="position.description"
                    class="position-description-wrapper"
                  >
                    <div
                      class="position-description"
                      :class="{ 'is-expanded': isExpanded(position.id) }"
                    >
                      <p>
                        <template
                          v-if="
                            !isExpanded(position.id) &&
                            shouldShowReadMore(position.description)
                          "
                        >
                          {{ getTruncatedText(position.description) }}
                        </template>
                        <template v-else>
                          {{ position.description }}
                        </template>
                      </p>
                    </div>

                    <button
                      v-if="shouldShowReadMore(position.description)"
                      @click="toggleExpanded(position.id)"
                      class="read-more-btn"
                      :aria-expanded="isExpanded(position.id)"
                      :aria-label="
                        isExpanded(position.id)
                          ? t('common.readLess')
                          : t('common.readMore')
                      "
                    >
                      {{
                        isExpanded(position.id)
                          ? t("common.readLess")
                          : t("common.readMore")
                      }}
                      <v-icon size="16" class="read-more-icon">
                        {{
                          isExpanded(position.id)
                            ? "mdi-chevron-up"
                            : "mdi-chevron-down"
                        }}
                      </v-icon>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </li>
        </ol>

        <div v-if="showButton" class="text-center mt-10">
          <v-btn
            variant="tonal"
            color="primary"
            size="large"
            class="toggle-btn"
            :loading="isLoading"
            :disabled="isLoading"
            @click="handleToggle"
            :aria-label="hasMore ? t('common.seeMore') : t('common.seeLess')"
          >
            {{ hasMore ? t("common.seeMore") : t("common.seeLess") }}
            <v-icon end size="20" class="toggle-icon">
              {{ hasMore ? "mdi-chevron-down" : "mdi-chevron-up" }}
            </v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </section>
</template>

<style scoped>
.experience-section {
  padding: 24px 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 24px;
  animation: fadeIn 0.5s ease-out;
}

.empty-state-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-top: 24px;
  margin-bottom: 8px;
}

.empty-state-text {
  font-size: 1rem;
  color: #6b7280;
}

/* Timeline Container */
.timeline {
  position: relative;
  padding: 0;
  margin: 0;
  list-style: none;
}

/* Timeline Item */
.timeline-item {
  position: relative;
  display: flex;
  gap: 32px;
  padding-bottom: 48px;
  opacity: 0;
  transform: translateY(20px);
}

.timeline-item.is-visible {
  animation: fadeUp 0.6s ease-out forwards;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

/* Timeline Marker */
.timeline-marker {
  position: relative;
  flex-shrink: 0;
  width: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-dot {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 50%;
  border: 4px solid #eff6ff;
  box-shadow: 0 0 0 2px #2563eb20;
  z-index: 2;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.timeline-item:hover .timeline-dot {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px #2563eb30;
}

.timeline-line {
  flex: 1;
  width: 2px;
  margin-top: 8px;
  background: linear-gradient(180deg, #e5e7eb 0%, #f3f4f6 100%);
}

/* Timeline Content Card */
.timeline-content {
  flex: 1;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  padding: 28px;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.timeline-content::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.timeline-content:hover {
  border-color: #e5e7eb;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);
  transform: translateY(-2px);
}

.timeline-content:hover::before {
  transform: scaleX(1);
}

.timeline-content.has-multiple-positions {
  background: linear-gradient(135deg, #fefefe 0%, #f8f9fa 100%);
}

/* Header */
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.timeline-date-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.timeline-date {
  font-size: 0.9375rem;
  color: #2563eb;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.timeline-date.current {
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.timeline-date-separator {
  color: #d1d5db;
  font-weight: 400;
}

.timeline-duration {
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 500;
}

.current-badge {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
}

/* Company Info */
.timeline-company-info {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-company {
  font-size: 1.375rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.company-icon {
  color: #2563eb;
  flex-shrink: 0;
}

.timeline-location {
  font-size: 0.9375rem;
  color: #9ca3af;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.positions-badge {
  align-self: flex-start;
  font-weight: 600;
  margin-top: 4px;
}

/* Positions List */
.positions-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.position-item {
  padding: 20px 0;
}

.position-item.is-single {
  padding: 0;
}

.position-item.has-divider {
  border-bottom: 1px solid #f3f4f6;
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.position-info {
  flex: 1;
}

.position-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.position-dates {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 0.875rem;
}

.position-date {
  color: #6b7280;
  font-weight: 500;
}

.position-date-separator {
  color: #d1d5db;
}

.position-duration {
  color: #9ca3af;
  font-weight: 500;
}

/* Position Description */
.position-description-wrapper {
  position: relative;
}

.position-description {
  font-size: 0.9375rem;
  color: #4b5563;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 12px;
  max-height: 500px;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.position-description.is-expanded {
  max-height: none;
}

.position-description p {
  margin: 0;
}

/* Read More Button */
.read-more-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  margin-left: -12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.read-more-btn:hover {
  color: #1d4ed8;
  background: #eff6ff;
}

.read-more-btn:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

.read-more-icon {
  transition: transform 0.2s ease;
}

.read-more-btn:hover .read-more-icon {
  transform: translateY(2px);
}

/* Toggle Button */
.toggle-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-btn:hover .toggle-icon {
  transform: translateY(3px);
}

/* Animations */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 960px) {
  .timeline-item {
    gap: 24px;
  }

  .timeline-content {
    padding: 24px;
  }

  .timeline-company {
    font-size: 1.25rem;
  }

  .position-title {
    font-size: 1.0625rem;
  }
}

@media (max-width: 600px) {
  .timeline-item {
    gap: 20px;
    padding-bottom: 40px;
  }

  .timeline-marker {
    width: 16px;
  }

  .timeline-dot {
    width: 16px;
    height: 16px;
    border-width: 3px;
  }

  .timeline-content {
    padding: 20px;
    border-radius: 12px;
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .timeline-date-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .timeline-company {
    font-size: 1.125rem;
  }

  .position-title {
    font-size: 1rem;
  }

  .position-item {
    padding: 16px 0;
  }

  .empty-state {
    padding: 60px 20px;
  }
}

/* Modo escuro */
/* @media (prefers-color-scheme: dark) {
  .timeline-content {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-color: #374151;
  }

  .timeline-content.has-multiple-positions {
    background: linear-gradient(135deg, #1f2937 0%, #18212f 100%);
  }

  .timeline-dot {
    border-color: #1f2937;
  }

  .timeline-line {
    background: linear-gradient(180deg, #374151 0%, #1f2937 100%);
  }

  .timeline-company {
    color: #f9fafb;
  }

  .position-title {
    color: #e5e7eb;
  }

  .position-date,
  .position-duration {
    color: #9ca3af;
  }

  .timeline-location {
    color: #9ca3af;
  }

  .position-description {
    color: #d1d5db;
  }

  .position-item.has-divider {
    border-bottom-color: #374151;
  }

  .read-more-btn:hover {
    background: #1f2937;
  }

  .empty-state-title {
    color: #f9fafb;
  }

  .empty-state-text {
    color: #9ca3af;
  }
} */
</style>
