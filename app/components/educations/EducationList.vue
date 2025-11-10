<script setup lang="ts">
import type { DjangoListResponse } from "~/types/api";
import type { Education } from "~/types/portfolio";
import { formatShortMonthYearOrPresent } from "~/utils/date";

const { locale, t } = useI18n();
const config = useRuntimeConfig();

/**
 * Estratégia de carregamento otimizada:
 * 1. Busca 10 formações inicialmente
 * 2. Exibe apenas 3
 * 3. "Ver mais" mostra +3 sem requisição (até 10)
 * 4. Após 10, faz requisição para próxima página
 * 5. "Ver menos" volta para 3
 */
const expandedItems = ref<Set<number>>(new Set());
const allEducations = ref<Education[]>([]);
const displayCount = ref(3);
const nextPage = ref<string | null>(null);
const isLoading = ref(false);

// Função auxiliar para obter headers com locale
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

// Buscar 10 formações inicialmente, mas exibir apenas 3
const { data: initialData } = await useApi<DjangoListResponse<Education>>(
  "/api/educations/",
  {
    params: { limit: 10, ordering: "-start_date" },
  }
);

if (initialData.value) {
  allEducations.value = initialData.value.results || [];
  nextPage.value = initialData.value.next;
}

const seeMore = async () => {
  // Se ainda tem formações carregadas para mostrar, apenas incrementa o display
  if (displayCount.value < allEducations.value.length) {
    displayCount.value = Math.min(
      displayCount.value + 3,
      allEducations.value.length
    );
    return;
  }

  // Se não tem mais formações carregadas E tem próxima página, faz requisição
  if (!nextPage.value || isLoading.value) return;

  isLoading.value = true;
  try {
    const data = await $fetch<DjangoListResponse<Education>>(nextPage.value, {
      baseURL: config.public.apiBase,
      headers: getApiHeaders(),
    });

    if (data) {
      allEducations.value = [...allEducations.value, ...(data.results || [])];
      nextPage.value = data.next;
      displayCount.value = Math.min(
        displayCount.value + 3,
        allEducations.value.length
      );
    }
  } catch (error) {
    console.error("Error loading more educations:", error);
  } finally {
    isLoading.value = false;
  }
};

const seeLess = async () => {
  // Volta para exibir apenas 3
  displayCount.value = 3;

  // Se já temos as formações iniciais, não precisa fazer requisição
  if (allEducations.value.length <= 10) {
    return;
  }

  // Se tiver mais de 10, recarrega apenas as 10 primeiras
  try {
    const data = await $fetch<DjangoListResponse<Education>>(
      "/api/educations/",
      {
        baseURL: config.public.apiBase,
        headers: getApiHeaders(),
        params: { limit: 10, ordering: "-start_date" },
      }
    );

    if (data) {
      allEducations.value = data.results || [];
      nextPage.value = data.next;
    }
  } catch (error) {
    console.error("Error reloading educations:", error);
  }
};

const handleToggle = async () => {
  if (hasMore.value) {
    await seeMore();
  } else {
    await seeLess();
  }
};

// Formações que serão exibidas (limitadas pelo displayCount)
const displayedEducations = computed(() =>
  allEducations.value.slice(0, displayCount.value)
);

const hasMore = computed(() => {
  return displayCount.value < allEducations.value.length || !!nextPage.value;
});

const showButton = computed(() => {
  return allEducations.value.length > 3 || displayCount.value > 3;
});

const hasEducations = computed(() => allEducations.value.length > 0);

const toggleExpanded = (id: number) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
};

const isExpanded = (id: number) => expandedItems.value.has(id);

const shouldShowReadMore = (description: string) => {
  return description && description.length > 150;
};

const getTruncatedText = (text: string, maxLength: number = 150) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

// Calcular duração
const calculateDuration = (startDate: string, endDate: string | null) => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

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

// Schema.org structured data para SEO
const structuredData = computed(() => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: allEducations.value.map((edu, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: edu.degree,
      recognizedBy: {
        "@type": "Organization",
        name: edu.institution,
      },
      startDate: edu.start_date,
      endDate: edu.end_date,
    },
  })),
}));

// Injetar structured data no head
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
  <section class="education-section" aria-labelledby="education-heading">
    <!-- Estado vazio -->
    <div v-if="!hasEducations && !isLoading" class="empty-state">
      <v-icon size="64" color="grey-lighten-1">mdi-school-outline</v-icon>
      <h3 class="empty-state-title">{{ t("education.noEducations") }}</h3>
      <p class="empty-state-text">
        {{ t("education.noEducationsDescription") }}
      </p>
    </div>

    <!-- Grid de formações -->
    <div v-else>
      <v-row>
        <v-col
          v-for="(edu, index) in displayedEducations"
          :key="edu.id"
          cols="12"
          md="6"
          lg="4"
          class="education-col"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <article
            class="education-card"
            :aria-labelledby="`edu-title-${edu.id}`"
          >
            <!-- Ícone e badge de status -->
            <div class="education-header">
              <div class="education-icon-wrapper">
                <v-icon size="36" class="education-icon">mdi-school</v-icon>
              </div>
              <v-chip
                v-if="!edu.end_date"
                size="small"
                color="success"
                variant="flat"
                class="current-badge"
              >
                <v-icon start size="12">mdi-circle</v-icon>
                {{ t("common.current") }}
              </v-chip>
            </div>

            <!-- Informações principais -->
            <div class="education-content">
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <h3
                    :id="`edu-title-${edu.id}`"
                    class="education-degree"
                    v-bind="props"
                  >
                    {{ edu.degree }}
                  </h3>
                </template>
                <span>{{ edu.degree }}</span>
              </v-tooltip>

              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <p class="education-institution" v-bind="props">
                    <v-icon size="16" class="institution-icon"
                      >mdi-domain</v-icon
                    >
                    <span class="institution-name">{{ edu.institution }}</span>
                  </p>
                </template>
                <span>{{ edu.institution }}</span>
              </v-tooltip>

              <!-- Datas -->
              <div class="education-dates">
                <time
                  :datetime="edu.start_date || undefined"
                  class="education-date"
                >
                  {{
                    formatShortMonthYearOrPresent(
                      edu.start_date,
                      locale,
                      t("common.present")
                    )
                  }}
                </time>
                <span class="date-separator">—</span>
                <time
                  v-if="edu.end_date"
                  :datetime="edu.end_date"
                  class="education-date"
                >
                  {{
                    formatShortMonthYearOrPresent(
                      edu.end_date,
                      locale,
                      t("common.present")
                    )
                  }}
                </time>
                <span v-else class="education-date current">
                  {{ t("common.present") }}
                </span>
              </div>

              <!-- Duração -->
              <p class="education-duration">
                {{ calculateDuration(edu.start_date || "", edu.end_date) }}
              </p>

              <!-- Descrição com expand/collapse -->
              <div v-if="edu.description" class="education-description-wrapper">
                <div
                  class="education-description"
                  :class="{ 'is-expanded': isExpanded(edu.id) }"
                >
                  <p>
                    <template
                      v-if="
                        !isExpanded(edu.id) &&
                        shouldShowReadMore(edu.description)
                      "
                    >
                      {{ getTruncatedText(edu.description) }}
                    </template>
                    <template v-else>
                      {{ edu.description }}
                    </template>
                  </p>
                </div>

                <button
                  v-if="shouldShowReadMore(edu.description)"
                  @click="toggleExpanded(edu.id)"
                  class="read-more-btn"
                  :aria-expanded="isExpanded(edu.id)"
                  :aria-label="
                    isExpanded(edu.id)
                      ? t('common.readLess')
                      : t('common.readMore')
                  "
                >
                  {{
                    isExpanded(edu.id)
                      ? t("common.readLess")
                      : t("common.readMore")
                  }}
                  <v-icon size="14" class="read-more-icon">
                    {{
                      isExpanded(edu.id) ? "mdi-chevron-up" : "mdi-chevron-down"
                    }}
                  </v-icon>
                </button>
              </div>
            </div>
          </article>
        </v-col>
      </v-row>

      <!-- Botão Ver mais/menos -->
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
    </div>
  </section>
</template>

<style scoped>
.education-section {
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

/* Grid Column */
.education-col {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s ease-out forwards;
}

/* Education Card */
.education-card {
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.education-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2563eb, #3b82f6, #8b5cf6);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.education-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.12);
  border-color: #e5e7eb;
}

.education-card:hover::before {
  transform: scaleX(1);
}

/* Header */
.education-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.education-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.education-card:hover .education-icon-wrapper {
  transform: scale(1.05);
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.education-icon {
  color: #2563eb;
}

.current-badge {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
}

/* Content */
.education-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.education-degree {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
  line-height: 1.4;
  letter-spacing: -0.02em;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.education-institution {
  font-size: 1.0625rem;
  color: #2563eb;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  cursor: help;
}

.institution-icon {
  color: #3b82f6;
  flex-shrink: 0;
  margin-top: 2px;
}

.institution-name {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

/* Dates */
.education-dates {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.education-date {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.education-date.current {
  color: #2563eb;
  font-weight: 600;
}

.date-separator {
  color: #d1d5db;
  font-size: 0.875rem;
}

.education-duration {
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 500;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

/* Description */
.education-description-wrapper {
  margin-top: 16px;
}

.education-description {
  font-size: 0.9375rem;
  color: #4b5563;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 12px;
  max-height: 300px;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.education-description.is-expanded {
  max-height: none;
}

.education-description p {
  margin: 0;
}

/* Read More Button */
.read-more-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 10px;
  margin-left: -10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 6px;
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
  .education-card {
    padding: 28px;
  }

  .education-degree {
    font-size: 1.125rem;
  }

  .education-institution {
    font-size: 1rem;
  }
}

@media (max-width: 600px) {
  .education-card {
    padding: 24px;
  }

  .education-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .education-icon {
    font-size: 32px !important;
  }

  .education-degree {
    font-size: 1.0625rem;
  }

  .empty-state {
    padding: 60px 20px;
  }
}

/* Modo escuro */
/* @media (prefers-color-scheme: dark) {
  .education-card {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-color: #374151;
  }

  .education-icon-wrapper {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }

  .education-degree {
    color: #f9fafb;
  }

  .education-date {
    color: #9ca3af;
  }

  .education-duration {
    color: #9ca3af;
    border-bottom-color: #374151;
  }

  .education-description {
    color: #d1d5db;
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
