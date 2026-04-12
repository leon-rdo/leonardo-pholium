import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

const siteUrl =
  process.env.NUXT_PUBLIC_SITE_URL || "https://leonardocosta.dev";
const isProduction = process.env.NODE_ENV === "production";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  nitro: {
    preset: "bun",
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
    // Force inline of unhead — the bun preset otherwise copies only the
    // subpaths its static tracer sees, missing `unhead/server` used by the
    // SSR renderer chunk and producing a 500 on every page.
    inlineDynamicImports: false,
    externals: {
      inline: ["unhead", "@unhead/vue", "@unhead/schema-org"],
    },
  },

  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiBase: "",
      siteUrl,
      twitterHandle: process.env.NUXT_PUBLIC_TWITTER_HANDLE || "",
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
    "@nuxt/image",
    "@nuxt/fonts",
    "@nuxtjs/sitemap",
    "@nuxtjs/robots",
    "nuxt-schema-org",
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
        language: "pt-BR",
        name: "Português",
        file: "pt-br.json",
      },
      {
        code: "en-us",
        language: "en-US",
        name: "English",
        file: "en-us.json",
      },
    ],
    langDir: "locales",
    defaultLocale: "pt-br",
    strategy: "prefix",
    baseUrl: siteUrl,
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
      alwaysRedirect: false,
      fallbackLocale: "en-us",
    },
  },

  // Global site configuration — used by sitemap, robots, schema-org, og-image
  site: {
    url: siteUrl,
    name: "Leonardo Costa",
    description: "Full Stack Developer & Creative Problem Solver",
    defaultLocale: "pt-br",
    indexable: isProduction,
  },

  // @nuxt/fonts — self-hosts Inter with preload + font-display:swap
  fonts: {
    families: [
      {
        name: "Inter",
        provider: "google",
        weights: [300, 400, 500, 600, 700, 800, 900],
        styles: ["normal"],
        display: "swap",
        preload: true,
      },
    ],
    defaults: {
      weights: [400, 600, 700],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
    },
  },

  // @nuxtjs/sitemap — single sitemap populated by the dynamic source.
  // i18n alternates are supplied directly by the source (see server/api/__sitemap__/urls.ts).
  sitemap: {
    strictNuxtContentPaths: true,
    autoI18n: false,
    discoverImages: true,
    discoverVideos: false,
    exclude: ["/admin/**", "/api/**"],
    sources: ["/api/__sitemap__/urls"],
    defaults: {
      changefreq: "weekly",
      priority: 0.7,
    },
  },

  // @nuxtjs/robots — dynamic, environment-aware
  // Note: we don't block /_nuxt/ (Google needs JS/CSS to render) or /api/ (RSS lives there)
  robots: {
    sitemap: [`${siteUrl}/sitemap.xml`],
    disallow: ["/admin/", "/api/auth/", "/api/contact-messages/"],
    allow: ["/api/rss/"],
    groups: [
      {
        userAgent: ["Googlebot", "Googlebot-Image", "bingbot"],
        allow: ["/"],
        disallow: ["/admin/"],
      },
    ],
    blockNonSeoBots: true,
  },

  // nuxt-schema-org — site-wide identity graph used by all pages
  schemaOrg: {
    identity: {
      type: "Person",
      name: "Leonardo Costa",
      url: siteUrl,
      image: `${siteUrl}/og-default.jpg`,
      jobTitle: "Full Stack Developer",
      description: "Full Stack Developer & Creative Problem Solver",
      sameAs: [
        "https://github.com/leonardo-costa",
        "https://www.linkedin.com/in/leonardo-costa",
      ],
    },
  },

  // NOTE: nuxt-og-image module was installed but disabled because pages already
  // supply explicit og:image URLs from the backend (cover image) with
  // /og-default.jpg as a fallback — we don't need runtime image generation.

  // @nuxt/image — format/quality defaults
  image: {
    format: ["avif", "webp"],
    quality: 80,
    densities: [1, 2],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  // App head defaults — lang set dynamically by pages via useSeo
  app: {
    head: {
      htmlAttrs: {
        lang: "pt-BR",
        dir: "ltr",
      },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
      meta: [
        { name: "format-detection", content: "telephone=no" },
        { name: "theme-color", content: "#2563eb" },
        { name: "color-scheme", content: "light" },
        {
          name: "robots",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        {
          name: "googlebot",
          content:
            "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
      ],
    },
  },
});
