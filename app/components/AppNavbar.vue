<script setup lang="ts">
import { ChevronDown, ExternalLink, Menu as MenuIcon, X } from 'lucide-vue-next';
import type { DjangoListResponse } from '~/types/api';
import type { NavigationItem } from '~/types/content';

const { locale, locales } = useI18n();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();

const drawer = ref(false);

// Navigation items come from the Django backend. The locale header is
// injected by useApi automatically.
const { data: navigationData } = await useApi<DjangoListResponse<NavigationItem>>(
  '/api/navigation-items/',
  {
    params: { menu_key: 'header', is_active: true, ordering: 'order' },
  },
);

const navItems = computed(() => {
  const items = navigationData.value?.results || [];
  const parents = items.filter((item) => !item.parent);
  return parents.map((parent) => ({
    ...parent,
    children: items.filter((item) => item.parent === parent.id),
  }));
});

const availableLocales = computed(
  () => locales.value as Array<{ code: string; name: string }>,
);

const currentLocaleLabel = computed(() => {
  if (locale.value === 'pt-br') return 'PT';
  return locale.value.split('-')[0]?.toUpperCase() ?? '';
});

const changeLocale = async (newLocale: string) => {
  const i18nCookie = useCookie('i18n_redirected');
  i18nCookie.value = newLocale;
  const newPath = switchLocalePath(newLocale as 'pt-br' | 'en-us');
  if (newPath) await navigateTo(newPath, { external: true });
};

const isExternal = (url: string) => url.startsWith('http');

const closeDrawer = () => {
  drawer.value = false;
};

// Close drawer on route change
const route = useRoute();
watch(() => route.fullPath, () => {
  drawer.value = false;
});
</script>

<template>
  <header
    class="sticky top-0 z-30 bg-paper/80 backdrop-blur-md border-b border-line color-mode-fade"
  >
    <div class="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
      <!-- Brand -->
      <NuxtLink
        :to="localePath('/')"
        class="flex items-center gap-2.5 text-[15px] font-semibold text-ink hover:text-accent transition-colors"
      >
        <span
          class="w-7 h-7 grid place-items-center rounded-md bg-ink text-paper font-mono text-[11px] font-bold"
          >LC</span
        >
        <span class="hidden sm:inline">
          leonardocosta<span class="text-ink-3">.dev</span>
        </span>
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden lg:flex items-center gap-1 text-sm">
        <template v-for="item in navItems" :key="item.id">
          <UiDropdown v-if="item.children?.length" align="left">
            <template #trigger="{ open }">
              <span
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded text-ink-2 hover:text-ink hover:bg-card transition-colors cursor-pointer"
                :class="{ 'text-ink bg-card': open }"
              >
                {{ item.label }}
                <ChevronDown :size="14" :stroke-width="1.8" />
              </span>
            </template>
            <template #menu>
              <ul class="py-1.5">
                <li v-for="child in item.children" :key="child.id">
                  <NuxtLink
                    :to="isExternal(child.url) ? undefined : localePath(child.url)"
                    :href="isExternal(child.url) ? child.url : undefined"
                    :target="isExternal(child.url) ? '_blank' : undefined"
                    :rel="isExternal(child.url) ? 'noopener noreferrer' : undefined"
                    class="flex items-center justify-between gap-3 px-4 py-2 text-[14px] text-ink-2 hover:text-ink hover:bg-card-soft transition-colors"
                    :title="child.title || child.label"
                  >
                    {{ child.label }}
                    <ExternalLink
                      v-if="isExternal(child.url)"
                      :size="13"
                      :stroke-width="1.8"
                      class="text-ink-3"
                    />
                  </NuxtLink>
                </li>
              </ul>
            </template>
          </UiDropdown>

          <NuxtLink
            v-else-if="!isExternal(item.url)"
            :to="localePath(item.url)"
            class="px-3 py-1.5 rounded text-ink-2 hover:text-ink hover:bg-card transition-colors"
            active-class="text-ink bg-card"
            :title="item.title || item.label"
          >
            {{ item.label }}
          </NuxtLink>

          <a
            v-else
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 rounded text-ink-2 hover:text-ink hover:bg-card transition-colors inline-flex items-center gap-1"
            :title="item.title || item.label"
          >
            {{ item.label }}
            <ExternalLink :size="12" :stroke-width="1.8" />
          </a>
        </template>

        <span class="mx-2 h-5 w-px bg-line" aria-hidden="true" />

        <ThemeToggle />

        <!-- Locale dropdown -->
        <UiDropdown align="right">
          <template #trigger>
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[11.5px] tracking-[0.16em] text-ink-2 hover:text-ink hover:bg-card transition-colors uppercase"
            >
              {{ currentLocaleLabel }}
              <ChevronDown :size="12" :stroke-width="1.8" />
            </span>
          </template>
          <template #menu>
            <ul class="py-1.5 min-w-[140px]">
              <li v-for="lang in availableLocales" :key="lang.code">
                <button
                  type="button"
                  class="w-full flex items-center justify-between gap-2 px-4 py-2 text-[14px] text-ink-2 hover:text-ink hover:bg-card-soft transition-colors"
                  :class="{ 'text-ink': lang.code === locale }"
                  @click="changeLocale(lang.code)"
                >
                  {{ lang.name }}
                  <span
                    v-if="lang.code === locale"
                    class="w-1.5 h-1.5 rounded-full bg-accent"
                  />
                </button>
              </li>
            </ul>
          </template>
        </UiDropdown>
      </nav>

      <!-- Mobile menu button -->
      <button
        type="button"
        class="lg:hidden p-2 rounded text-ink hover:bg-card transition-colors"
        :aria-label="$t('navbar.openMenu')"
        @click="drawer = true"
      >
        <MenuIcon :size="20" :stroke-width="1.8" />
      </button>
    </div>

    <!-- Mobile drawer -->
    <Teleport to="body">
      <transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="drawer" class="fixed inset-0 z-50 bg-ink/50" @click="closeDrawer" />
      </transition>
      <transition
        enter-active-class="transition-transform duration-200 ease-out"
        leave-active-class="transition-transform duration-150 ease-in"
        enter-from-class="translate-x-full"
        leave-to-class="translate-x-full"
      >
        <aside
          v-if="drawer"
          class="fixed inset-y-0 right-0 z-50 w-[320px] max-w-[85vw] bg-paper border-l border-line color-mode-fade flex flex-col"
        >
          <header class="flex items-center justify-between p-5 border-b border-line">
            <span class="flex items-center gap-2.5 text-[15px] font-semibold">
              <span
                class="w-7 h-7 grid place-items-center rounded-md bg-ink text-paper font-mono text-[11px] font-bold"
                >LC</span
              >
              Leonardo Costa
            </span>
            <button
              type="button"
              class="p-2 rounded text-ink hover:bg-card transition-colors"
              :aria-label="$t('navbar.closeMenu')"
              @click="closeDrawer"
            >
              <X :size="20" :stroke-width="1.8" />
            </button>
          </header>

          <nav class="flex-1 overflow-y-auto px-3 py-4">
            <ul class="space-y-0.5">
              <template v-for="item in navItems" :key="item.id">
                <li v-if="item.children?.length">
                  <details class="group">
                    <summary
                      class="flex items-center justify-between px-4 py-3 rounded-card text-[15px] font-medium text-ink-2 hover:bg-card cursor-pointer list-none"
                    >
                      {{ item.label }}
                      <ChevronDown
                        :size="16"
                        :stroke-width="1.8"
                        class="transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <ul class="pl-4 mt-0.5 space-y-0.5">
                      <li v-for="child in item.children" :key="child.id">
                        <NuxtLink
                          :to="isExternal(child.url) ? undefined : localePath(child.url)"
                          :href="isExternal(child.url) ? child.url : undefined"
                          :target="isExternal(child.url) ? '_blank' : undefined"
                          :rel="isExternal(child.url) ? 'noopener noreferrer' : undefined"
                          class="flex items-center justify-between gap-2 px-4 py-2.5 rounded-card text-[14px] text-ink-2 hover:bg-card transition-colors"
                          @click="closeDrawer"
                        >
                          {{ child.label }}
                          <ExternalLink
                            v-if="isExternal(child.url)"
                            :size="13"
                            :stroke-width="1.8"
                          />
                        </NuxtLink>
                      </li>
                    </ul>
                  </details>
                </li>
                <li v-else>
                  <NuxtLink
                    :to="isExternal(item.url) ? undefined : localePath(item.url)"
                    :href="isExternal(item.url) ? item.url : undefined"
                    :target="isExternal(item.url) ? '_blank' : undefined"
                    :rel="isExternal(item.url) ? 'noopener noreferrer' : undefined"
                    class="flex items-center justify-between px-4 py-3 rounded-card text-[15px] font-medium text-ink-2 hover:bg-card transition-colors"
                    @click="closeDrawer"
                  >
                    {{ item.label }}
                    <ExternalLink
                      v-if="isExternal(item.url)"
                      :size="14"
                      :stroke-width="1.8"
                    />
                  </NuxtLink>
                </li>
              </template>
            </ul>
          </nav>

          <footer class="border-t border-line p-5 space-y-4">
            <div>
              <div class="font-mono-rail text-[11px] mb-2">Theme</div>
              <ThemeToggle />
            </div>
            <div>
              <div class="font-mono-rail text-[11px] mb-2">Language</div>
              <div class="flex gap-1.5">
                <button
                  v-for="lang in availableLocales"
                  :key="lang.code"
                  type="button"
                  class="px-3 py-1.5 rounded-card text-[13px] font-medium ring-hair transition-colors"
                  :class="
                    lang.code === locale
                      ? 'bg-ink text-paper'
                      : 'bg-card text-ink-2 hover:text-ink'
                  "
                  @click="changeLocale(lang.code)"
                >
                  {{ lang.name }}
                </button>
              </div>
            </div>
          </footer>
        </aside>
      </transition>
    </Teleport>
  </header>
</template>
