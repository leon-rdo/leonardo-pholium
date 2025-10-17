import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBase: "",
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
        code: "en-us",
        iso: "en-US",
        name: "English",
        file: "en-us.json",
      },
      {
        code: "pt-br",
        iso: "pt-BR",
        name: "Português",
        file: "pt-br.json",
      },
    ],
    langDir: "locales",
    defaultLocale: "pt-br",
    strategy: "prefix_except_default",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
  },
});
