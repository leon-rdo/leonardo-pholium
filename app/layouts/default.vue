<script setup lang="ts">
</script>

<template>
  <v-app>
    <div class="app-layout">
      <AppNavbar />
      <main class="main-content">
        <slot />
      </main>
      <!-- Footer -->
      <v-container class="footer-container">
        <v-row>
          <v-col cols="12" class="text-center">
            <p class="footer-text">
              © {{ new Date().getFullYear() }} Leonardo. Todos os direitos reservados.
            </p>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </v-app>
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

/* Footer */
.footer-container {
  padding: 40px 24px;
  border-top: 1px solid #f3f4f6;
}

.footer-text {
  font-size: 0.875rem;
  color: #9ca3af;
}
</style>