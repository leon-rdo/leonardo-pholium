<script setup lang="ts">
import type { DjangoListResponse } from '~/types/api';
import type { Category } from '~/types/blog';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const localePath = useLocalePath();

const drawer = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Fetch categories with children expanded
const { data: categoriesData } = await useApi<DjangoListResponse<Category<{ children: true }>>>('/api/post-categories/', {
  params: {
    is_active: true,
    ordering: 'order',
    expand: 'children,images'
  }
});

// Organize categories - only root level (parent = null)
const rootCategories = computed(() => {
  return categoriesData.value?.results?.filter(cat => !cat.parent) || [];
});

const getCategoryIcon = (name: string) => {
  const iconMap: Record<string, string> = {
    'tecnologia': 'mdi-code-tags',
    'programação': 'mdi-laptop',
    'desenvolvimento': 'mdi-laptop',
    'design': 'mdi-palette',
    'tutorial': 'mdi-book-open-variant',
    'dicas': 'mdi-lightbulb',
    'notícias': 'mdi-newspaper',
    'carreira': 'mdi-briefcase',
    'web': 'mdi-web',
    'mobile': 'mdi-cellphone',
    'devops': 'mdi-server',
    'ia': 'mdi-robot',
    'inteligência artificial': 'mdi-robot',
    'segurança': 'mdi-shield-lock',
    'database': 'mdi-database',
    'banco de dados': 'mdi-database',
  };

  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }

  return 'mdi-folder-outline';
};

const navigateToCategory = (slug: string) => {
  navigateTo(localePath(`/blog/category/${slug}`));
  drawer.value = false;
};

const navigateToAllCategories = () => {
  navigateTo(localePath('/blog/category/'));
  drawer.value = false;
};
</script>

<template>
  <v-navigation-drawer v-model="drawer" temporary location="right" width="320" class="categories-drawer">
    <div class="drawer-header">
      <div class="header-content">
        <v-icon size="28" color="primary">mdi-folder-multiple</v-icon>
        <span class="header-title">Categorias</span>
      </div>
      <v-btn icon variant="text" size="small" @click="drawer = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <v-list nav class="categories-list">
      <!-- All Categories Link -->
      <v-list-item class="all-categories-item" @click="navigateToAllCategories" title="Ver todas as categorias">
        <template v-slot:prepend>
          <v-icon>mdi-view-grid</v-icon>
        </template>
        <v-list-item-title class="font-weight-bold">Todas as Categorias</v-list-item-title>
        <template v-slot:append>
          <v-icon size="16">mdi-open-in-new</v-icon>
        </template>
      </v-list-item>

      <v-divider class="my-2" />

      <!-- Root Categories with Children -->
      <template v-for="category in rootCategories" :key="category.id">
        <!-- Category with children - expandable -->
        <v-list-group v-if="category.children && category.children.length > 0" :value="category.id.toString()">
          <template v-slot:activator="{ props: activatorProps }">
            <v-list-item v-bind="activatorProps" class="category-item parent-category">
              <template v-slot:prepend>
                <v-icon :icon="getCategoryIcon(category.name)" />
              </template>
              <v-list-item-title>{{ category.name }}</v-list-item-title>
              <v-list-item-subtitle v-if="category.description" class="text-truncate">
                {{ category.description }}
              </v-list-item-subtitle>
            </v-list-item>
          </template>

          <!-- Subcategories -->
          <v-list-item v-for="child in category.children" :key="child.id" class="category-item subcategory-item"
            @click="navigateToCategory(child.slug)">
            <template v-slot:prepend>
              <v-icon :icon="getCategoryIcon(child.name)" size="20" />
            </template>
            <v-list-item-title>{{ child.name }}</v-list-item-title>
            <template v-slot:append>
              <v-icon size="16">mdi-chevron-right</v-icon>
            </template>
          </v-list-item>
        </v-list-group>

        <!-- Category without children - direct link -->
        <v-list-item v-else class="category-item parent-category" @click="navigateToCategory(category.slug)">
          <template v-slot:prepend>
            <v-icon :icon="getCategoryIcon(category.name)" />
          </template>
          <v-list-item-title>{{ category.name }}</v-list-item-title>
          <v-list-item-subtitle v-if="category.description" class="text-truncate">
            {{ category.description }}
          </v-list-item-subtitle>
          <template v-slot:append>
            <v-icon size="16">mdi-chevron-right</v-icon>
          </template>
        </v-list-item>
      </template>

      <!-- Empty State -->
      <v-list-item v-if="!rootCategories.length" class="text-center py-8">
        <v-list-item-title class="text-grey">
          Nenhuma categoria disponível
        </v-list-item-title>
      </v-list-item>
    </v-list>

    <!-- Footer -->
    <div class="drawer-footer">
      <v-btn block variant="outlined" color="primary" class="text-none" :to="localePath('/blog')"
        @click="drawer = false">
        <v-icon start>mdi-arrow-left</v-icon>
        Voltar para o Blog
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
.categories-drawer {
  background: #fafafa;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  background: white;
  border-bottom: 2px solid #f3f4f6;
  position: sticky;
  top: 0;
  z-index: 1;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
}

.categories-list {
  padding: 16px 8px;
  background: transparent;
}

.all-categories-item {
  margin-bottom: 8px;
  background: white;
  border-radius: 12px;
  border: 2px solid #2563eb;
  transition: all 0.2s ease;
}

.all-categories-item:hover {
  background: #eff6ff;
  transform: translateX(4px);
}

.category-item {
  margin: 4px 0;
  border-radius: 12px;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid #f3f4f6;
}

.parent-category {
  margin: 8px 0;
  padding: 12px 16px;
}

.parent-category:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
  transform: translateX(4px);
}

.subcategory-item {
  margin-left: 16px;
  margin-right: 8px;
  padding: 10px 12px;
  background: #f9fafb;
}

.subcategory-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateX(4px);
}

.category-item :deep(.v-list-item-title) {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1a1a1a;
}

.subcategory-item :deep(.v-list-item-title) {
  font-size: 0.875rem;
  font-weight: 500;
}

.category-item :deep(.v-list-item-subtitle) {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 2px;
}

.drawer-footer {
  position: sticky;
  bottom: 0;
  padding: 16px;
  background: white;
  border-top: 2px solid #f3f4f6;
}

/* Vuetify List Group Customization */
.categories-list :deep(.v-list-group__items) {
  background: transparent;
}

.categories-list :deep(.v-list-group__header) {
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  margin: 8px 0;
  padding: 12px 16px;
  transition: all 0.2s ease;
}

.categories-list :deep(.v-list-group__header:hover) {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.categories-list :deep(.v-list-group__header.v-list-item--active) {
  background: #eff6ff;
  border-color: #2563eb;
}

/* Scrollbar */
.categories-drawer :deep(.v-navigation-drawer__content) {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.categories-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar {
  width: 8px;
}

.categories-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.categories-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.categories-drawer :deep(.v-navigation-drawer__content)::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Dark Mode Support */
/* @media (prefers-color-scheme: dark) {
  .categories-drawer {
    background: #0f172a;
  }

  .drawer-header,
  .drawer-footer {
    background: #1e293b;
    border-color: #334155;
  }

  .header-title {
    color: #f1f5f9;
  }

  .all-categories-item,
  .category-item {
    background: #1e293b;
    border-color: #334155;
  }

  .all-categories-item:hover {
    background: #1e3a8a;
  }

  .parent-category:hover {
    background: #334155;
    border-color: #475569;
  }

  .subcategory-item {
    background: #1e293b;
  }

  .subcategory-item:hover {
    background: #334155;
    border-color: #475569;
  }

  .category-item :deep(.v-list-item-title) {
    color: #f1f5f9;
  }

  .category-item :deep(.v-list-item-subtitle) {
    color: #94a3b8;
  }

  .categories-list :deep(.v-list-group__header) {
    background: #1e293b;
    border-color: #334155;
  }

  .categories-list :deep(.v-list-group__header:hover) {
    background: #334155;
    border-color: #475569;
  }

  .categories-list :deep(.v-list-group__header.v-list-item--active) {
    background: #1e3a8a;
    border-color: #3b82f6;
  }
} */
</style>