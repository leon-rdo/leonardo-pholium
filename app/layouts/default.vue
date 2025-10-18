<script setup lang="ts">
</script>

<template>
  <div class="app-layout">
    <!-- <AppNavbar /> -->

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 72px;
}

@media (max-width: 960px) {
  .main-content {
    padding-top: 64px;
  }
}
</style>