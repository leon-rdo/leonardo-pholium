<template>
  <div>
    <div v-if="pending">
      <SkeletonLoader v-for="i in 3" :key="i" :lines="3" />
    </div>

    <div v-else-if="error">
      <p class="error">Erro ao carregar conteúdo: {{ error.message }}</p>
    </div>

    <div v-else-if="!data?.results?.length">
      <p class="empty">Nenhum conteúdo encontrado</p>
    </div>

    <div v-else>
      <div v-for="block in data.results" :key="block.id" class="content-block">
        <p>{{ block.text }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  contentKey: string;
}>();

const { data, pending, error } = useContentBlocks(props.contentKey);
</script>

<style scoped>
.content-block {
  margin-bottom: 1rem;
}

.error {
  color: #e74c3c;
  padding: 1rem;
  background: #fadbd8;
  border-radius: 4px;
}

.empty {
  color: #7f8c8d;
  font-style: italic;
}
</style>
