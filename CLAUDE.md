# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Nuxt 4 (Vue 3, SSR) + TypeScript, run on Bun (Nitro `bun` preset). Source lives under [app/](app/) using the Nuxt 4 layout (`app/pages`, `app/components`, `app/composables`, `app/plugins`, `app/layouts`, `app/types`, `app/utils`). Server routes are in [server/api/](server/api/). i18n locale JSON lives in [i18n/locales/](i18n/locales/).

**Styling — mid-migration on the `redesign-v2` branch:** the codebase is moving from Vuetify 3 to Tailwind v4 + custom UI primitives. Both stacks coexist while components are rewritten one section at a time:

- **Tailwind v4** is the target. CSS tokens live in [app/assets/styles/tokens.css](app/assets/styles/tokens.css) (light + `.dark` overrides), exposed as utility classes via the `@theme` block in [app/assets/styles/main.css](app/assets/styles/main.css). Primitives are in [app/components/ui/](app/components/ui/) (`Tile`, `Chip`, `UiButton`, `SectionLabel`, `AuroraBg`, `TerminalPanel`, `TerminalLine`, `ThemeToggle`). New components must use Tailwind, not Vuetify.
- **Vuetify 3** still ships and renders existing legacy components. It will be uninstalled in PR 8 once every `v-*` reference is migrated. Do not introduce new Vuetify components.
- Dark mode is class-based via [`@nuxtjs/color-mode`](https://color-mode.nuxtjs.org) with `classSuffix: ""` and `storageKey: "lc-color-mode"`. The toggle UI is [`ThemeToggle.vue`](app/components/ui/ThemeToggle.vue).

This is a frontend only — it consumes a Django REST API backend (via `NUXT_PUBLIC_API_BASE`, e.g. `http://localhost:8000`). There is no local DB, no auth server, no test suite.

## Commands

Bun is the package manager and runtime (`bun.lock` is committed; Nitro builds with `preset: "bun"`).

```bash
bun install          # install deps (postinstall runs `nuxt prepare`)
bun run dev          # dev server on http://localhost:3000
bun run build        # production build (.output/)
bun run preview      # preview built output
bun run generate     # static generation (rarely used — site is SSR)
```

There are no lint/test scripts. Type checking happens through Nuxt's generated `.nuxt/tsconfig.*.json` references.

## Required environment

`.env` (loaded by Nuxt automatically):

- `NUXT_PUBLIC_API_BASE` — Django backend URL (required for any data; sitemap and RSS gracefully degrade if unset)
- `NUXT_PUBLIC_SITE_URL` — public origin used for canonical/OG/sitemap (defaults to `https://leonardocosta.dev`)
- `NUXT_PUBLIC_GTAG_ID` — GA4 measurement ID; gtag is **disabled unless this is set AND `NODE_ENV=production`**
- `NUXT_PUBLIC_TWITTER_HANDLE` — optional, drives Twitter Card meta

## Architecture notes that span files

### Backend contract: Django REST + i18n header

Every API call goes through the Django backend and follows two conventions:

1. **List responses are paginated** with shape [`DjangoListResponse<T>`](app/types/api.ts) — `{ count, next, previous, results }`. Use [`useApiPaginated`](app/composables/useApiPaginated.ts) when you need to walk all pages, [`useApi`/`useApiData`](app/composables/useApi.ts) for single-page reads.
2. **Locale is sent as `Accept-Language: pt-br | en-us`** — the backend returns translated content based on this header. All composables in [app/composables/](app/composables/) inject this header from `useI18n().locale` automatically. If you call `$fetch` directly (e.g. inside `server/api/`), set the header yourself.

The `expand` query param is a Django REST convention used heavily here (e.g. `expand: "category,images,tags"`) and is reflected in the generic `Post<TExpand>` / `Project<TExpand>` / `Category<TExpand>` types in [app/types/](app/types/) — the `TExpand` parameter narrows fields from `number | null` (FK id) to the full nested object.

### i18n

`@nuxtjs/i18n` with `strategy: "prefix"` and locales `pt-br` (default) and `en-us`. **All URLs are prefixed** (`/pt-br/...`, `/en-us/...`); there is no unprefixed root. Translations: [i18n/locales/pt-br.json](i18n/locales/pt-br.json) and [i18n/locales/en-us.json](i18n/locales/en-us.json). Use `useLocalePath()` / `useSwitchLocalePath()` for internal links — never hard-code the prefix.

### SEO pipeline (multiple files, single mental model)

Every page should call [`useSeo()`](app/composables/useSeo.ts) — it wraps `useSeoMeta` + `useHead` and adds:

- canonical URL with volatile params (page, search, sort) stripped
- `hreflang` alternates for every locale plus `x-default`
- Open Graph / Twitter Card defaults sourced from the global `site-settings` payload (loaded once by [app/plugins/site-settings.ts](app/plugins/site-settings.ts) and stashed in `useNuxtData('site-settings')`)
- per-locale RSS `<link rel="alternate">` (also called from [app/layouts/default.vue](app/layouts/default.vue))

JSON-LD is set per page via `setStructuredData()`; site-wide identity (Person schema) is configured in [nuxt.config.ts](nuxt.config.ts) under `schemaOrg`.

The sitemap is **dynamic** — [`@nuxtjs/sitemap`](nuxt.config.ts) reads from [server/api/__sitemap__/urls.ts](server/api/__sitemap__/urls.ts), which fetches posts/categories/projects from the backend and emits per-locale URLs with image entries and hreflang alternates. **`autoI18n` is intentionally off** because the source supplies alternates directly. If the backend is unreachable the source falls back to static pages only — sitemap requests should never 500.

`@nuxtjs/robots` is configured (not a static `public/robots.txt`); editing `robots.txt` directly will be ignored.

### RSS feed reliability

[server/api/rss/[locale].xml.ts](server/api/rss/[locale].xml.ts) always returns 200 + valid XML even when the backend post fetch fails (returns an empty channel instead). This is deliberate — feed readers unsubscribe on repeated 5xx, so don't change this to throw.

### Nitro / unhead inline workaround

[nuxt.config.ts](nuxt.config.ts) sets:
```ts
nitro: {
  preset: "bun",
  inlineDynamicImports: false,
  externals: { inline: ["unhead", "@unhead/vue", "@unhead/schema-org"] },
}
```
The bun preset's static tracer misses `unhead/server` (used by the SSR renderer) and produces a 500 on every page in production unless these are force-inlined. Don't remove or "simplify" this block without verifying SSR still works against the production build — there is a documented history of this breaking.

### Vuetify integration (legacy, being phased out)

Two-piece setup: a function module in [nuxt.config.ts](nuxt.config.ts) injects `vite-plugin-vuetify` for component auto-import + `transformAssetUrls`, and [app/plugins/vuetify.js](app/plugins/vuetify.js) creates the Vuetify instance with the theme palette. Both must change together if you swap themes/components. `vuetify` is in `build.transpile`.

The Vuetify body background is suppressed in [main.css](app/assets/styles/main.css) so the cream paper token (`--color-paper`) takes during the parallel migration period. Remove that suppression block when Vuetify is uninstalled.

### Tailwind v4 setup

[`@tailwindcss/vite`](https://tailwindcss.com) is wired into [nuxt.config.ts](nuxt.config.ts) under `vite.plugins`. There is intentionally **no `tailwind.config.ts`** — v4 reads everything from CSS via `@theme {}` in [main.css](app/assets/styles/main.css), which mirrors the tokens declared in [tokens.css](app/assets/styles/tokens.css). When adding a token, declare it in `tokens.css` first, then expose it in the `@theme` block.

`@tailwindcss/typography` is installed for the blog post body (markdown rendered through `marked`).

Tokens worth knowing:
- `bg-paper`, `bg-card`, `bg-card-soft` — surfaces (warm cream in light, near-black in dark).
- `text-ink`, `text-ink-2`, `text-ink-3`, `text-ink-4` — type hierarchy.
- `border-line`, `border-line-2` — hairlines (no soft shadows by default).
- `text-accent`, `bg-accent`, `bg-accent-soft` — single brand blue (`#2C67E8`).
- `bg-blob-1/2/3` — aurora gradient stops (used by [`AuroraBg.vue`](app/components/ui/AuroraBg.vue)).
- `rounded-tile`, `rounded-card`, `rounded-input`, `rounded-chip` — radius scale.

Reusable utilities defined in CSS (not @theme): `.h-display` (display tracking), `.ring-hair` (hairline ring), `.aurora-soft`, `.glass-cream`, `.glow-blue`, `.font-mono-rail`.

### Content blocks (CMS-lite)

A lot of homepage/about copy is editable from the backend as `ContentBlock` rows ([app/types/content.ts](app/types/content.ts)) — pages call `useApiPaginated('...content-blocks...')` and look up by `key` (e.g. `'hero_name'`, `'seo_image'`, `'contact_linkedin'`). When editing pages, prefer adding a content block lookup over hardcoding strings, falling back to an i18n key.

### View tracking

[`usePostViews`](app/composables/usePostViews.ts) increments view counts by issuing a plain `GET /api/posts/:id/` after a 3s dwell (the backend counts the read on its side). Session storage prevents double-counting per session. This is client-only.
