import tailwindcss from "@tailwindcss/vite";

const siteUrl =
  process.env.NUXT_PUBLIC_SITE_URL || "https://leonardocosta.dev";

// Every project cover, post cover and article image is served from the Django
// media host. @nuxt/image's IPX provider refuses to touch a remote URL unless
// its host is on this allowlist — without it the `format`/`quality`/`width`
// props were silently inert and originals were shipped as-is.
const apiMediaHost = (() => {
  const base = process.env.NUXT_PUBLIC_API_BASE;
  if (!base) return "";
  try {
    return new URL(base).host;
  } catch {
    return "";
  }
})();
const isProduction = process.env.NODE_ENV === "production";
const gtmId = process.env.NUXT_PUBLIC_GTM_ID || "";
const gtmEnabled = isProduction && !!gtmId;

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

  css: ["~/assets/styles/main.css"],

  modules: [
    "@nuxtjs/i18n",
    "@nuxtjs/color-mode",
    "@nuxt/image",
    "@nuxt/fonts",
    "@nuxtjs/sitemap",
    "@nuxtjs/robots",
    "nuxt-schema-org",
  ],

  // Auto-import primitives from app/components/ui/ without the `Ui` path
  // prefix (so <Tile>, <Chip>, <ThemeToggle> work directly). Files that
  // genuinely need the prefix (UiButton, UiDropdown) keep it via filename.
  components: [
    { path: "~/components/ui", pathPrefix: false },
    "~/components",
  ],

  // @nuxtjs/color-mode — applies `class="dark"` on <html> when dark.
  // Cookie persisted; respects prefers-color-scheme on first SSR.
  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "lc-color-mode",
  },

  vite: {
    plugins: [tailwindcss()],
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
      // Fall back to the default locale so a no-Accept-Language crawler (and
      // x-default) both resolve to /pt-br. Real visitors are still redirected
      // by their browser language.
      fallbackLocale: "pt-br",
    },
  },

  // Global site configuration — used by sitemap, robots, schema-org, og-image
  site: {
    url: siteUrl,
    name: "Leonardo Costa",
    description:
      "Desenvolvedor backend com mais de 3 anos em Django REST, PostgreSQL e integrações com I.A.",
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
      {
        name: "JetBrains Mono",
        provider: "google",
        weights: [400, 500, 600, 700],
        styles: ["normal"],
        display: "swap",
        preload: false,
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
      jobTitle: "Backend Developer",
      description:
        "Desenvolvedor backend com mais de 3 anos em Django REST, PostgreSQL e integrações com I.A.",
      sameAs: [
        "https://github.com/leon-rdo",
        "https://www.linkedin.com/in/leonrdo-costa/",
      ],
      knowsAbout: [
        "Django",
        "Django REST Framework",
        "Python",
        "PostgreSQL",
        "Vue.js",
        "Nuxt",
        "TypeScript",
        "Backend Engineering",
        "API Design",
      ],
    },
  },

  // NOTE: nuxt-og-image module was installed but disabled because pages already
  // supply explicit og:image URLs from the backend (cover image) with
  // /og-default.jpg as a fallback — we don't need runtime image generation.

  // @nuxt/image — format/quality defaults.
  // `domains` is what actually enables optimisation of the backend's media:
  // IPX only processes remote images whose host is allowlisted here. The
  // production host is pinned and the current API host is added so local dev
  // (localhost:8000) optimises too.
  image: {
    domains: [
      "api.leonardocosta.dev",
      ...(apiMediaHost && apiMediaHost !== "api.leonardocosta.dev"
        ? [apiMediaHost]
        : []),
    ],
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
      // Google Tag Manager — GA4 lives inside the container (GTM-MTTS5WZC),
      // so there is no direct gtag.js here; loading both would double-count.
      // SPA route changes are tracked by GA4 Enhanced Measurement (history
      // events). Disabled outside production / when NUXT_PUBLIC_GTM_ID is
      // unset so dev traffic never reaches analytics.
      script: gtmEnabled
        ? [
            {
              innerHTML:
                `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
                `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';` +
                `j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})` +
                `(window,document,'script','dataLayer','${gtmId}');`,
              tagPosition: "head",
            },
          ]
        : [],
      noscript: gtmEnabled
        ? [
            {
              innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
              tagPosition: "bodyOpen",
            },
          ]
        : [],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
        // iOS ignores the manifest for home-screen icons and needs its own link.
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
      meta: [
        { name: "format-detection", content: "telephone=no" },
        // theme-color tints the browser/OS chrome, so it should track the page
        // surface, not the brand accent — a blue bar above a cream page reads
        // as a rendering bug. Split per scheme so the dark theme matches too.
        {
          name: "theme-color",
          content: "#f3efe5",
          media: "(prefers-color-scheme: light)",
        },
        {
          name: "theme-color",
          content: "#0e0e12",
          media: "(prefers-color-scheme: dark)",
        },
        // The site ships a full dark theme; advertising only "light" made UA
        // form controls and scrollbars render light-on-dark.
        { name: "color-scheme", content: "light dark" },
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
