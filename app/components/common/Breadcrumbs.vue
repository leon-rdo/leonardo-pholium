<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import type { BreadcrumbItem } from '~/composables/useBreadcrumbs';

interface Props {
  items: BreadcrumbItem[];
}
const props = defineProps<Props>();
const localePath = useLocalePath();

// Schema.org markup is registered through the composable; the Vue render
// below carries the visible UI only.
const { setBreadcrumbsSchema } = useBreadcrumbs();
setBreadcrumbsSchema(props.items);
</script>

<template>
  <nav aria-label="breadcrumb" class="font-mono text-[12px] text-ink-3">
    <ol class="flex flex-wrap items-center gap-1.5">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="inline-flex items-center gap-1.5"
      >
        <NuxtLink
          v-if="item.to && !item.disabled"
          :to="localePath(item.to)"
          class="hover:text-accent transition-colors"
        >
          {{ item.title }}
        </NuxtLink>
        <span v-else class="text-ink font-medium">{{ item.title }}</span>
        <ChevronRight
          v-if="index < items.length - 1"
          :size="13"
          :stroke-width="1.6"
          class="text-ink-4"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>
