<script setup lang="ts">
const props = defineProps<{
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    maxVisiblePages?: number;
}>();

const emit = defineEmits<{
    'page-change': [page: number];
}>();

const maxVisible = computed(() => props.maxVisiblePages || 7);

// Generate array of page numbers to show
const visiblePages = computed(() => {
    const pages: (number | string)[] = [];
    const total = props.totalPages;
    const current = props.currentPage;
    const max = maxVisible.value;

    if (total <= max) {
        // Show all pages if total is less than max
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);

        // Calculate range around current page
        let start = Math.max(2, current - Math.floor(max / 2) + 1);
        let end = Math.min(total - 1, start + max - 3);

        // Adjust start if we're near the end
        if (end === total - 1) {
            start = Math.max(2, end - max + 3);
        }

        // Add ellipsis after first page if needed
        if (start > 2) {
            pages.push('...');
        }

        // Add page numbers
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Add ellipsis before last page if needed
        if (end < total - 1) {
            pages.push('...');
        }

        // Always show last page
        pages.push(total);
    }

    return pages;
});

const goToPage = (page: number) => {
    if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
        emit('page-change', page);
    }
};
</script>

<template>
    <div v-if="totalPages > 1" class="pagination">
        <!-- Previous Button -->
        <button class="pagination-btn" :class="{ disabled: !hasPrevious }" :disabled="!hasPrevious"
            @click="goToPage(currentPage - 1)" :aria-label="$t('common.previousPage')">
            <v-icon size="20">mdi-chevron-left</v-icon>
        </button>

        <!-- Page Numbers -->
        <template v-for="(page, index) in visiblePages" :key="`page-${index}`">
            <button v-if="typeof page === 'number'" class="pagination-btn" :class="{ active: page === currentPage }"
                @click="goToPage(page)" :aria-label="`${$t('common.page')} ${page}`"
                :aria-current="page === currentPage ? 'page' : undefined">
                {{ page }}
            </button>
            <span v-else class="pagination-ellipsis">{{ page }}</span>
        </template>

        <!-- Next Button -->
        <button class="pagination-btn" :class="{ disabled: !hasNext }" :disabled="!hasNext"
            @click="goToPage(currentPage + 1)" :aria-label="$t('common.nextPage')">
            <v-icon size="20">mdi-chevron-right</v-icon>
        </button>
    </div>
</template>

<style scoped>
.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 0;
    flex-wrap: wrap;
}

.pagination-btn {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e5e7eb;
    background: white;
    color: #4b5563;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0 12px;
}

.pagination-btn:hover:not(.disabled):not(.active) {
    border-color: #2563eb;
    background: #f9fafb;
    color: #2563eb;
}

.pagination-btn.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
    cursor: default;
}

.pagination-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.pagination-ellipsis {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-weight: 600;
    user-select: none;
}

/* Responsive */
@media (max-width: 600px) {
    .pagination {
        gap: 4px;
    }

    .pagination-btn {
        min-width: 36px;
        height: 36px;
        font-size: 0.875rem;
    }

    .pagination-ellipsis {
        min-width: 36px;
        height: 36px;
    }
}
</style>