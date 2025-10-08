<template>
  <div class="skeleton-wrapper">
    <div
      v-for="i in lines"
      :key="i"
      class="skeleton-line"
      :class="{ short: i === lines }"
    ></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  lines?: number;
}>();
</script>

<style scoped>
.skeleton-wrapper {
  margin-bottom: 1rem;
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.skeleton-line.short {
  width: 60%;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
