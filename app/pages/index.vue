<script setup lang="ts">
useSeoMeta({
  title: "Home",
  description: "Página inicial",
});
</script>

<template>
  <div class="pa-4 text-center ma-4 elevation-2 rounded d-flex flex-column align-center gap-4 justify-center">
    <h1 class="text-h1">
      <v-icon icon="mdi-home"></v-icon>
      Home page
    </h1>
    <v-btn variant="tonal" class="my-3" href="/about">
      <v-icon icon="mdi-information me-1"></v-icon>
      About page
    </v-btn>

    <ContentBlocks content-key="home" />
  </div>
</template>
