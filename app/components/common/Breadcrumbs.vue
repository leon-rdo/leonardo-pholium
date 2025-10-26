<script setup lang="ts">
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs';

interface Props {
    items: BreadcrumbItem[];
}

const props = defineProps<Props>();
const localePath = useLocalePath();

// Set Schema.org markup
const { setBreadcrumbsSchema } = useBreadcrumbs();
setBreadcrumbsSchema(props.items);
</script>

<template>
    <nav class="breadcrumbs" aria-label="breadcrumb">
        <ol class="breadcrumbs-list">
            <li v-for="(item, index) in items" :key="index" class="breadcrumb-item"
                :class="{ 'breadcrumb-item--active': index === items.length - 1 }">
                <NuxtLink v-if="item.to && !item.disabled" :to="localePath(item.to)" class="breadcrumb-link">
                    {{ item.title }}
                </NuxtLink>
                <span v-else class="breadcrumb-current">{{ item.title }}</span>

                <v-icon v-if="index < items.length - 1" size="16" class="breadcrumb-separator">
                    mdi-chevron-right
                </v-icon>
            </li>
        </ol>
    </nav>
</template>

<style scoped>
.breadcrumbs {
    margin-bottom: 24px;
}

.breadcrumbs-list {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.875rem;
    list-style: none;
    padding: 0;
    margin: 0;
    flex-wrap: wrap;
}

.breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.breadcrumb-link {
    color: #6b7280;
    text-decoration: none;
    transition: color 0.2s ease;
}

.breadcrumb-link:hover {
    color: #2563eb;
}

.breadcrumb-separator {
    color: #d1d5db;
}

.breadcrumb-current {
    color: #1a1a1a;
    font-weight: 600;
}

.breadcrumb-item--active .breadcrumb-current {
    color: #1a1a1a;
}
</style>
