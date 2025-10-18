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
            </v-list>
        </v-navigation-drawer>
    </div>
</template>

<script setup lang="ts">
const drawer = ref(false);
const scrolled = ref(false);

const navItems = [
    { label: 'Início', to: '/', icon: 'mdi-home' },
    { label: 'Sobre', to: '/about', icon: 'mdi-information' },
    { label: 'Projetos', to: '/projects', icon: 'mdi-folder-multiple' },
    { label: 'Contato', to: '/#contact', icon: 'mdi-email' },
];

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

/* Dark Mode Support */
/* @media (prefers-color-scheme: dark) {
    .navbar {
        border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    .brand-name {
        color: #f1f5f9;
    }

    .brand-logo:hover .brand-name {
        color: #3b82f6;
    }

    .nav-link {
        color: #94a3b8;
    }

    .nav-link:hover {
        color: #f1f5f9;
    }

    .nav-link.router-link-active {
        color: #3b82f6;
    }

    .mobile-drawer {
        background: #0f172a;
    }

    .drawer-header {
        border-bottom-color: #1e293b;
    }

    .drawer-item:hover {
        background: #1e293b;
    }

    .drawer-item.router-link-active {
        background: #1e3a8a;
        color: #3b82f6;
    }
} */

/* Responsive */
@media (max-width: 960px) {
    .brand-name {
        font-size: 1.125rem;
    }
}
</style>