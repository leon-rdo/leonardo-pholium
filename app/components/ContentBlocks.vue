<script setup lang="ts">
import { marked } from 'marked';

interface Props {
  contentKey: string;
  pageKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  pageKey: 'home'
});

const { locale } = useI18n();
const config = useRuntimeConfig();

// Buscar blocos de conteúdo do backend
const { data: contentBlocks, pending } = await useFetch('/api/content-blocks/', {
  baseURL: config.public.apiBase,
  params: {
    page_name: props.pageKey,
    key: props.contentKey
  },
  headers: {
    'Accept-Language': locale.value,
  },
  watch: [locale]
});

// Renderizar conteúdo baseado no tipo
const renderContent = (block: any) => {
  if (!block?.text) return '';

  switch (block.kind) {
    case 'markdown':
      return marked(block.translations.text);
    case 'html':
      return block.translations.text;
    default:
      return block.translations.text;
  }
};
</script>

<template>
  <div class="content-blocks">
    <v-skeleton-loader v-if="pending" type="text" class="mb-4" />

    <template v-else>
      <div v-for="block in contentBlocks?.results" :key="block.id" class="content-block">
        <!-- Texto simples -->
        <div v-if="block.kind === 'text'" class="text-content">
          {{ block.text }}
        </div>

        <!-- Markdown -->
        <div v-else-if="block.kind === 'markdown'" class="markdown-content" v-html="renderContent(block)" />

        <!-- HTML -->
        <div v-else-if="block.kind === 'html'" class="html-content" v-html="renderContent(block)" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.content-blocks {
  width: 100%;
}

.content-block {
  margin-bottom: 1.5rem;
}

.text-content {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.87);
}

:deep(.markdown-content) {
  font-size: 1rem;
  line-height: 1.6;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  p {
    margin-bottom: 1em;
  }

  ul,
  ol {
    padding-left: 1.5em;
    margin-bottom: 1em;
  }

  blockquote {
    border-left: 4px solid #667eea;
    padding-left: 1em;
    margin: 1em 0;
    color: rgba(0, 0, 0, 0.6);
  }

  code {
    background: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  pre {
    background: rgba(0, 0, 0, 0.05);
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
    margin-bottom: 1em;
  }
}

.html-content {
  line-height: 1.6;
}
</style>