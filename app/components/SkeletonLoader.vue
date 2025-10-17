<script setup lang="ts">
defineProps<{
  type?: 'card' | 'list' | 'hero' | 'text';
  count?: number;
}>();
</script>

<template>
  <div class="skeleton-container">
    <!-- Hero Skeleton -->
    <div v-if="type === 'hero'" class="skeleton-hero">
      <div class="skeleton-badge"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-title-short"></div>
      <div class="skeleton-subtitle"></div>
      <div class="skeleton-buttons">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>

    <!-- Card Skeleton -->
    <div v-else-if="type === 'card'" class="skeleton-cards">
      <div v-for="i in (count || 3)" :key="i" class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-card-content">
          <div class="skeleton-text skeleton-text-lg"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text skeleton-text-sm"></div>
          <div class="skeleton-tags">
            <div class="skeleton-tag"></div>
            <div class="skeleton-tag"></div>
            <div class="skeleton-tag"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- List Skeleton -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div v-for="i in (count || 3)" :key="i" class="skeleton-list-item">
        <div class="skeleton-circle"></div>
        <div class="skeleton-list-content">
          <div class="skeleton-text skeleton-text-md"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text skeleton-text-sm"></div>
        </div>
      </div>
    </div>

    <!-- Text Skeleton -->
    <div v-else-if="type === 'text'" class="skeleton-text-block">
      <div class="skeleton-text skeleton-text-lg"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text skeleton-text-sm"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-container {
  width: 100%;
}

/* Base Skeleton Styles */
.skeleton-badge,
.skeleton-title,
.skeleton-title-short,
.skeleton-subtitle,
.skeleton-button,
.skeleton-image,
.skeleton-text,
.skeleton-tag,
.skeleton-circle {
  background: linear-gradient(90deg,
      #f3f4f6 25%,
      #e5e7eb 50%,
      #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* Hero Skeleton */
.skeleton-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120px 24px;
  gap: 24px;
}

.skeleton-badge {
  width: 180px;
  height: 32px;
  border-radius: 100px;
}

.skeleton-title {
  width: 600px;
  height: 64px;
  max-width: 100%;
}

.skeleton-title-short {
  width: 400px;
  height: 64px;
  max-width: 100%;
}

.skeleton-subtitle {
  width: 500px;
  height: 28px;
  max-width: 100%;
}

.skeleton-buttons {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.skeleton-button {
  width: 160px;
  height: 48px;
}

/* Card Skeleton */
.skeleton-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.skeleton-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #f3f4f6;
}

.skeleton-image {
  width: 100%;
  height: 250px;
  border-radius: 0;
}

.skeleton-card-content {
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-tags {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.skeleton-tag {
  width: 60px;
  height: 28px;
  border-radius: 6px;
}

/* List Skeleton */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.skeleton-list-item {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
}

.skeleton-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Text Skeleton */
.skeleton-text-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
}

.skeleton-text {
  height: 20px;
  width: 100%;
}

.skeleton-text-sm {
  width: 60%;
}

.skeleton-text-md {
  width: 80%;
}

.skeleton-text-lg {
  height: 28px;
  width: 90%;
}

/* Responsive */
@media (max-width: 960px) {
  .skeleton-hero {
    padding: 80px 24px;
  }

  .skeleton-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .skeleton-hero {
    padding: 60px 20px;
  }

  .skeleton-card-content {
    padding: 24px;
  }

  .skeleton-buttons {
    flex-direction: column;
    width: 100%;
  }

  .skeleton-button {
    width: 100%;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {

  .skeleton-badge,
  .skeleton-title,
  .skeleton-title-short,
  .skeleton-subtitle,
  .skeleton-button,
  .skeleton-image,
  .skeleton-text,
  .skeleton-tag,
  .skeleton-circle {
    background: linear-gradient(90deg,
        #1e293b 25%,
        #334155 50%,
        #1e293b 75%);
    background-size: 200% 100%;
  }

  .skeleton-card,
  .skeleton-list-item {
    background: #0f172a;
    border-color: #1e293b;
  }
}
</style>