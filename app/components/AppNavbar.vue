<template>
    <div>
        <v-app-bar :elevation="scrolled ? 2 : 0" :color="scrolled ? 'white' : 'rgba(255, 255, 255, 0.95)'" app flat
            class="navbar">
            <v-container class="d-flex align-center px-4">
                <NuxtLink to="/" class="brand-logo">
                    <span class="brand-name">Leonardo Costa</span>
                </NuxtLink>

                <v-spacer></v-spacer>

                <nav class="desktop-nav hidden-md-and-down">
                    <template v-if="navItems?.length">
                        <template v-for="item in navItems" :key="item.id">
                            <!-- Item with children - show as dropdown -->
                            <v-menu v-if="item.children && item.children.length > 0" offset-y>
                                <template v-slot:activator="{ props }">
                                    <v-btn v-bind="props" variant="text" class="nav-link-btn" :title="item.title">
                                        {{ item.label }}
                                        <v-icon end size="18">mdi-chevron-down</v-icon>
                                    </v-btn>
                                </template>
                                <v-list class="nav-dropdown">
                                    <v-list-item v-for="child in item.children" :key="child.id"
                                        :href="child.url.startsWith('http') ? child.url : undefined"
                                        :to="child.url.startsWith('http') ? undefined : localePath(child.url)"
                                        :target="child.url.startsWith('http') ? '_blank' : undefined"
                                        :title="child.label" class="dropdown-item">
                                        <template v-slot:append v-if="child.url.startsWith('http')">
                                            <v-icon size="16">mdi-open-in-new</v-icon>
                                        </template>
                                    </v-list-item>
                                </v-list>
                            </v-menu>

                            <!-- Item without children - show as regular link -->
                            <NuxtLink v-else :to="item.url.startsWith('http') ? undefined : localePath(item.url)"
                                :href="item.url.startsWith('http') ? item.url : undefined"
                                :target="item.url.startsWith('http') ? '_blank' : undefined" class="nav-link"
                                :title="item.title">
                                {{ item.label }}
                            </NuxtLink>
                        </template>
                    </template>

                    <v-menu offset-y>
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" variant="text" class="language-btn">
                                <v-icon start>mdi-translate</v-icon>
                                {{ currentLocale?.toUpperCase() ?? '' }}
                            </v-btn>
                        </template>
                        <v-list>
                            <v-list-item v-for="lang in availableLocales" :key="lang.code"
                                @click="changeLocale(lang.code)" :active="locale === lang.code">
                                <v-list-item-title>{{ lang.name }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </nav>

                <v-btn icon variant="text" class="hidden-lg-and-up" @click="drawer = !drawer">
                    <v-icon>mdi-menu</v-icon>
                </v-btn>
            </v-container>
        </v-app-bar>

        <v-navigation-drawer v-model="drawer" temporary location="right" class="mobile-drawer">
            <div class="drawer-header">
                <span class="brand-name">Leonardo Costa</span>
                <v-btn icon variant="text" @click="drawer = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <v-list nav class="drawer-list">
                <template v-if="navItems?.length">
                    <template v-for="item in navItems" :key="item.id">
                        <!-- Item with children - show as expandable group -->
                        <v-list-group v-if="item.children && item.children.length > 0" :value="item.id">
                            <template v-slot:activator="{ props }">
                                <v-list-item v-bind="props" class="drawer-item" :title="item.label">
                                    <template v-slot:prepend v-if="getIconForUrl(item.url)">
                                        <v-icon :icon="getIconForUrl(item.url)"></v-icon>
                                    </template>
                                </v-list-item>
                            </template>

                            <v-list-item v-for="child in item.children" :key="child.id"
                                :href="child.url.startsWith('http') ? child.url : undefined"
                                :to="child.url.startsWith('http') ? undefined : localePath(child.url)"
                                :target="child.url.startsWith('http') ? '_blank' : undefined"
                                @click="child.url.startsWith('http') ? null : drawer = false"
                                class="drawer-item drawer-subitem" :title="child.label">
                                <template v-slot:append v-if="child.url.startsWith('http')">
                                    <v-icon size="16">mdi-open-in-new</v-icon>
                                </template>
                            </v-list-item>
                        </v-list-group>

                        <!-- Item without children - show as regular link -->
                        <v-list-item v-else :href="item.url.startsWith('http') ? item.url : undefined"
                            :to="item.url.startsWith('http') ? undefined : localePath(item.url)"
                            :target="item.url.startsWith('http') ? '_blank' : undefined"
                            @click="item.url.startsWith('http') ? null : drawer = false" class="drawer-item"
                            :title="item.label">
                            <template v-slot:prepend v-if="getIconForUrl(item.url)">
                                <v-icon :icon="getIconForUrl(item.url)"></v-icon>
                            </template>
                            <template v-slot:append v-if="item.url.startsWith('http')">
                                <v-icon size="16">mdi-open-in-new</v-icon>
                            </template>
                        </v-list-item>
                    </template>
                </template>

                <v-list-item class="drawer-item mt-4">
                    <template v-slot:prepend>
                        <v-icon>mdi-translate</v-icon>
                    </template>
                    <v-select v-model="locale" :items="availableLocales" item-title="name" item-value="code"
                        variant="outlined" density="compact" hide-details @update:model-value="changeLocale">
                    </v-select>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>
    </div>
</template>

<script setup lang="ts">
import type { DjangoListResponse } from '~/types/api';
import type { NavigationItem } from '~/types/content';

const { locale, locales, setLocale } = useI18n();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();

const drawer = ref(false);
const scrolled = ref(false);

// Fetch navigation items from API
const { data: navigationData } = await useApi<DjangoListResponse<NavigationItem>>('/api/navigation-items/', {
    params: {
        menu_key: 'header',
        is_active: true,
        ordering: 'order'
    }
});

// Organize items by parent/children structure
const navItems = computed(() => {
    const items = navigationData.value?.results || [];
    const parents = items.filter(item => !item.parent);

    return parents.map(parent => ({
        ...parent,
        children: items.filter(item => item.parent === parent.id)
    }));
});

const availableLocales = computed(() =>
    (locales.value as Array<{ code: string; name: string }>)
);

const currentLocale = computed(() => {
    return locale.value === 'pt-br' ? 'pt' : locale.value.split('-')[0];
});

// Helper function to get icons based on URL patterns
const getIconForUrl = (url: string): string => {
    if (!url) return 'mdi-link';
    if (url === '/' || url.includes('home')) return 'mdi-home';
    if (url.includes('about')) return 'mdi-information';
    if (url.includes('project')) return 'mdi-folder-multiple';
    if (url.includes('contact')) return 'mdi-email';
    return 'mdi-link';
};

const changeLocale = async (newLocale: string) => {
    const i18nCookie = useCookie('i18n_redirected');
    i18nCookie.value = newLocale;

    const newPath = switchLocalePath(newLocale as 'pt-br' | 'en-us');

    if (newPath) {
        await navigateTo(newPath, { external: true });
    }
};

onMounted(() => {
    window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

const handleScroll = () => {
    scrolled.value = window.scrollY > 50;
};
</script>

<style scoped>
.navbar {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.brand-logo {
    text-decoration: none;
    display: flex;
    align-items: center;
}

.brand-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.02em;
    transition: color 0.2s ease;
}

.brand-logo:hover .brand-name {
    color: #2563eb;
}

/* Desktop Navigation */
.desktop-nav {
    display: flex;
    gap: 2rem;
    align-items: center;
}

.nav-link {
    font-size: 0.9375rem;
    font-weight: 500;
    color: #4b5563;
    text-decoration: none;
    position: relative;
    padding: 0.5rem 0;
    transition: color 0.2s ease;
}

.nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #2563eb;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover {
    color: #1a1a1a;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
    width: 100%;
}

.nav-link.router-link-active {
    color: #2563eb;
    font-weight: 600;
}

/* Navigation Button (for dropdowns) */
.nav-link-btn {
    font-size: 0.9375rem;
    font-weight: 500;
    color: #4b5563;
    text-transform: none;
    letter-spacing: 0;
    height: auto;
    padding: 0.5rem 0.75rem;
    min-width: auto;
}

.nav-link-btn:hover {
    background: transparent;
    color: #1a1a1a;
}

/* Dropdown Menu */
.nav-dropdown {
    min-width: 200px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.dropdown-item {
    padding: 12px 16px;
    transition: background 0.2s ease;
}

.dropdown-item:hover {
    background: #f9fafb;
}

/* Language Button */
.language-btn {
    font-size: 0.875rem;
    font-weight: 600;
    color: #4b5563;
    text-transform: none;
    letter-spacing: 0;
}

.language-btn:hover {
    background: #f9fafb;
}

/* Mobile Drawer */
.mobile-drawer {
    background: #ffffff;
}

.drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1rem;
    border-bottom: 1px solid #f3f4f6;
}

.drawer-list {
    padding: 1rem 0;
}

.drawer-item {
    margin: 0.25rem 1rem;
    border-radius: 8px;
    transition: background 0.2s ease;
}

.drawer-item:hover {
    background: #f9fafb;
}

.drawer-item.router-link-active {
    background: #eff6ff;
    color: #2563eb;
}

.drawer-subitem {
    padding-left: 48px;
}

/* Responsive */
@media (max-width: 960px) {
    .brand-name {
        font-size: 1.125rem;
    }
}
</style>