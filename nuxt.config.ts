import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  nitro: {
    preset: "bun",
  },

  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBase: "",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "https://localhost:3000",
    },
  },

  build: {
    transpile: ["vuetify"],
  },

  css: ["~/assets/styles/main.css"],

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
    "@nuxtjs/i18n",
    "@nuxtjs/sitemap",
    "@nuxt/image",
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  i18n: {
    locales: [
      {
        code: "pt-br",
        iso: "pt-BR",
        name: "Português",
        file: "pt-br.json",
      },
      {
        code: "en-us",
        iso: "en-US",
        name: "English",
        file: "en-us.json",
      },
    ],
    langDir: "locales",
    defaultLocale: "pt-br",
    strategy: "prefix",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
      alwaysRedirect: false,
      fallbackLocale: "en-us",
    },
  },

  // Site configuration (required for sitemap)
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
    name: "Leonardo Costa",
    description: "Full Stack Developer & Creative Problem Solver",
    defaultLocale: "pt-br",
  },

  // Sitemap configuration
  sitemap: {
    strictNuxtContentPaths: true,
    exclude: ["/admin/**", "/api/**"],
    defaults: {
      changefreq: "daily",
      priority: 0.7,
    },
  },

  // App head defaults
  app: {
    head: {
      htmlAttrs: {
        lang: "pt-BR",
      },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        // Preconnect to external domains for performance
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "anonymous",
        },
      ],
      meta: [
        { name: "format-detection", content: "telephone=no" },
        { name: "theme-color", content: "#2563eb" },
      ],
    },
  },
});
