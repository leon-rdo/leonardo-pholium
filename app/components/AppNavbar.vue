<template>
    <div>
        <!-- App Bar -->
        <v-app-bar :elevation="scrolled ? 2 : 0" :color="scrolled ? 'white' : 'rgba(255, 255, 255, 0.95)'" app flat
            class="navbar">
            <v-container class="d-flex align-center px-4">
                <!-- Logo/Brand -->
                <NuxtLink to="/" class="brand-logo">
                    <span class="brand-name">Leonardo Costa</span>
                </NuxtLink>

                <v-spacer></v-spacer>

                <!-- Desktop Navigation -->
                <nav class="desktop-nav hidden-md-and-down">
                    <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
                        {{ item.label }}
                    </NuxtLink>

                    <!-- Language Selector -->
                    <v-menu offset-y>
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" variant="text" class="language-btn">
                                <v-icon start>mdi-translate</v-icon>
                                {{ currentLocale.toUpperCase() }}
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

                <!-- Mobile Menu Button -->
                <v-btn icon variant="text" class="hidden-lg-and-up" @click="drawer = !drawer">
                    <v-icon>mdi-menu</v-icon>
                </v-btn>
            </v-container>
        </v-app-bar>

        <!-- Mobile Navigation Drawer -->
        <v-navigation-drawer v-model="drawer" temporary location="right" class="mobile-drawer">
            <div class="drawer-header">
                <span class="brand-name">Leonardo Costa</span>
                <v-btn icon variant="text" @click="drawer = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </div>

            <v-list nav class="drawer-list">
                <v-list-item v-for="item in navItems" :key="item.to" :to="item.to" @click="drawer = false"
                    class="drawer-item">
                    <template v-slot:prepend>
                        <v-icon :icon="item.icon"></v-icon>
                    </template>
                    <v-list-item-title>{{ item.label }}</v-list-item-title>
                </v-list-item>

                <!-- Language Selector Mobile -->
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
const { locale, locales, setLocale } = useI18n();
const router = useRouter();
const switchLocalePath = useSwitchLocalePath();
const drawer = ref(false);
const scrolled = ref(false);

// Computed para gerar os links com o locale correto
const localePath = useLocalePath();
const navItems = computed(() => [
    { label: 'Início', to: localePath('/'), icon: 'mdi-home' },
    { label: 'Sobre', to: localePath('/about'), icon: 'mdi-information' },
    { label: 'Projetos', to: localePath('/projects'), icon: 'mdi-folder-multiple' },
    { label: 'Contato', to: localePath('/#contact'), icon: 'mdi-email' },
]);

const availableLocales = computed(() =>
    (locales.value as Array<{ code: string; name: string }>)
);

const currentLocale = computed(() => {
    return locale.value === 'pt-br' ? 'pt' : locale.value.split('-')[0];
});

const changeLocale = async (newLocale: string) => {
    // Limpar o cookie do i18n primeiro
    const i18nCookie = useCookie('i18n_redirected');
    i18nCookie.value = null;

    // Atualizar o locale
    await setLocale(newLocale);

    // Construir a URL manualmente para garantir o caminho correto
    let newPath: string;
    const currentPath = window.location.pathname;

    if (newLocale === 'pt-br') {
        // Para português (padrão), remover qualquer prefixo de locale
        newPath = currentPath.replace(/^\/[a-z]{2}-[a-z]{2}/, '') || '/';
    } else {
        // Para outros idiomas, adicionar ou substituir o prefixo
        if (currentPath.startsWith('/en-us') || currentPath.startsWith('/pt-br')) {
            newPath = currentPath.replace(/^\/[a-z]{2}-[a-z]{2}/, `/${newLocale}`);
        } else {
            newPath = `/${newLocale}${currentPath}`;
        }
    }

    // Navegar para a nova URL com reload completo
    window.location.href = newPath;
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

/* Responsive */
@media (max-width: 960px) {
    .brand-name {
        font-size: 1.125rem;
    }
}
</style>