<script setup lang="ts">
/**
 * Stack section — straight read of /api/skills/ from the Django backend.
 * The previous version layered curated `years` / `meta` / categorisation
 * on top of the API; that data isn't on the Skill model, so it was just
 * AI-mocked content. Removed in favour of the honest list.
 *
 * Skills are rendered in a single tile, sorted by `level` descending.
 * The Skill type has `level` (1-5) but no category yet — when the
 * backend grows a `category` field, this component can group again.
 */
import type { ContentBlock } from '~/types/content';
import type { DjangoListResponse } from '~/types/api';
import type { Skill } from '~/types/portfolio';

interface Props {
  contentBlocks: ContentBlock[];
}
defineProps<Props>();

const { data: skillsData } = await useApi<DjangoListResponse<Skill>>(
  '/api/skills/',
  { params: { limit: 50, ordering: '-level,name' } },
);

const skills = computed<Skill[]>(() => skillsData.value?.results ?? []);
</script>

<template>
  <section v-if="skills.length">
    <div class="max-w-[1280px] mx-auto px-6 pb-6 pt-2">
      <header class="flex items-end justify-between mb-4">
        <div>
          <SectionLabel index="03" :name="$t('home.stack.label')" />
          <h2 class="h-display text-[36px] sm:text-[40px] font-bold mt-2">
            {{ $t('home.stack.title') }}
          </h2>
        </div>
      </header>

      <Tile :aurora="true" class="px-7 py-7 fade-up">
        <ul class="flex flex-wrap gap-1.5">
          <li v-for="skill in skills" :key="skill.id">
            <Chip variant="default">{{ skill.name }}</Chip>
          </li>
        </ul>
      </Tile>
    </div>
  </section>
</template>
