<script setup lang="ts">
useSeoMeta({
  title: "About",
  description: "Sobre nós",
});
</script>

<template>
  <div class="pa-4 text-center ma-4 elevation-2 rounded d-flex flex-column align-center gap-4 justify-center">
    <h1 class="text-h1">
      <v-icon icon="mdi-information"></v-icon>
      About page
    </h1>
    <v-btn variant="tonal" class="my-3" href="/">
      <v-icon icon="mdi-home me-1"></v-icon>
      Home page
    </v-btn>

    <ContentBlocks content-key="about" />
  </div>
</template>
