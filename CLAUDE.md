# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Nuxt 4 (Vue 3, SSR) + Tailwind v4 + TypeScript, run on Bun (Nitro `bun` preset). Source lives under [app/](app/) using the Nuxt 4 layout (`app/pages`, `app/components`, `app/composables`, `app/plugins`, `app/layouts`, `app/types`, `app/utils`). Server routes are in [server/api/](server/api/). i18n locale JSON lives in [i18n/locales/](i18n/locales/).

**Styling**: Tailwind v4 with CSS tokens in [app/assets/styles/tokens.css](app/assets/styles/tokens.css) (light + `.dark` overrides), exposed as utility classes via the `@theme` block in [app/assets/styles/main.css](app/assets/styles/main.css). UI primitives live in [app/components/ui/](app/components/ui/) (`Tile`, `Chip`, `UiButton`, `UiDropdown`, `SectionLabel`, `ThemeToggle`). `Tile` slots its content directly — layout classes passed to it (`flex`, `grid`, `justify-between`) apply to the children, so don't reintroduce an inner wrapper. Domain components are colocated with their list page (e.g. [app/components/projects/](app/components/projects/), [app/components/home/](app/components/home/)).

Dark mode is class-based via [`@nuxtjs/color-mode`](https://color-mode.nuxtjs.org) with `classSuffix: ""` and `storageKey: "lc-color-mode"`. The toggle UI is [`ThemeToggle.vue`](app/components/ui/ThemeToggle.vue).

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
- `NUXT_PUBLIC_GTM_ID` — Google Tag Manager container ID (e.g. `GTM-MTTS5WZC`); the GTM snippet is **injected only when this is set AND `NODE_ENV=production`**. GA4 (`G-Q4GRSTKYEF`) lives inside the GTM container — do not add gtag.js directly or page views double-count.
- `NUXT_PUBLIC_TWITTER_HANDLE` — optional, drives Twitter Card meta

## Architecture notes that span files

### Backend contract: Django REST + i18n header

Every API call goes through the Django backend and follows two conventions:

1. **List responses are paginated** with shape [`DjangoListResponse<T>`](app/types/api.ts) — `{ count, next, previous, results }`. Use [`useApiPaginated`](app/composables/useApiPaginated.ts) when you need to walk all pages, [`useApi`/`useApiData`](app/composables/useApi.ts) for single-page reads.
2. **Locale is sent as `Accept-Language: pt-br | en-us`** — the backend returns translated content based on this header. All composables in [app/composables/](app/composables/) inject this header from `useI18n().locale` automatically. If you call `$fetch` directly (e.g. inside `server/api/`), set the header yourself.

**Backend outages answer 503, not an empty page.** Pages pass the `error` of the fetch they can't render without to [`throwIfBackendDown()`](app/utils/backend-error.ts), which raises a fatal 503 ([error.vue](app/error.vue) adds `Retry-After`). Rendering the empty state with 200 is how `/en-us/projects` became a soft 404 in Search Console, and a post that couldn't be fetched used to answer 404. New content pages should do the same.

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

**Nitro suffix-param gotcha:** a file named `[locale].xml.ts` registers the route `/api/rss/:locale.xml`, whose param is literally called `locale.xml` and holds `en-us.xml`. `getRouterParam(event, "locale")` is therefore always `undefined`, which used to make every feed (including `en-us`) come out as pt-br. The handler reads `locale.xml` and strips `.xml`. Don't add new `[param].ext.ts` routes expecting a clean param — see the Markdown middleware below for the alternative.

### LLM / AI-assistant discoverability

Goal: ChatGPT, Gemini, Claude, Perplexity & co. can find, read and answer about the site owner, articles and projects. Four layers, all fed by the same Django data as the HTML (never hardcoded copy):

1. **robots.txt** ([nuxt.config.ts](nuxt.config.ts), `robots.groups`) — an explicit group for AI crawlers/agents (`aiAssistantBots`) with `Content-Signal: search=yes, ai-input=yes, ai-train=yes`. They were already allowed by `*`; the group makes it deliberate. A bot matched by a specific group ignores `*`, so the `disallow` list is repeated there — keep it in sync with the `*` one. Gemini / AI Overviews answer from the Googlebot index and Copilot / ChatGPT search lean on Bing's, so both stay indexable.
2. **`/llms.txt` and `/llms-full.txt`** ([server/routes/](server/routes/)) — llmstxt.org index (profile pages, every project, every article, both locales) and the whole site in one Markdown file.
3. **Markdown twin of every content page** — append `.md` to the canonical path: `/pt-br.md`, `/pt-br/about.md`, `/pt-br/projects.md`, `/pt-br/projects/<slug>.md`, `/pt-br/blog.md`, `/pt-br/blog/<slug>.md`. Implemented in [server/middleware/markdown-pages.ts](server/middleware/markdown-pages.ts) as a **middleware, not file routes**, because of the suffix-param gotcha above. Pages advertise their twin with `setSeoMeta({ markdown: true })` (`<link rel="alternate" type="text/markdown">`); the `.md` response carries `Link: <html url>; rel="canonical"` so Googlebot treats it as a duplicate. It deliberately does **not** send `noindex` — AI crawlers that honour `X-Robots-Tag` would skip the files meant for them. The long project `description` is rendered on both `/projects/<slug>` (HTML) and its twin.
4. **JSON-LD** — unchanged; see the SEO pipeline section. Identity stays single-sourced.

Code lives in `server/utils/llm-source.ts` (backend fetch + cache + HTML→Markdown via `node-html-markdown`) and `server/utils/llm-render.ts` (document renderers, pt-br/en-us labels, response headers). Behaviour worth knowing:

- Data is cached in memory for 5 min with in-flight de-duplication. A partial (degraded) load is cached only 30 s and served with `Cache-Control: no-store`.
- `llms.txt` / `llms-full.txt` always answer 200 (static skeleton if the backend is down). `.md` pages answer **503 + Retry-After** when the backend is unreachable and the document would be empty, **404** for unknown paths/slugs (category pages have no twin).
- `GET /api/site-settings/` returns a one-item paginated list; `llm-source.ts` unwraps `results[0]`.
- Visitor comments are never included — only content authored in the CMS.
- Adding a new content page? Add a renderer + a `case` in the middleware, a section in `renderLlmsTxt`/`renderLlmsFullTxt`, and `markdown: true` in its `setSeoMeta`.

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

### Tailwind v4 setup

[`@tailwindcss/vite`](https://tailwindcss.com) is wired into [nuxt.config.ts](nuxt.config.ts) under `vite.plugins`. There is intentionally **no `tailwind.config.ts`** — v4 reads everything from CSS via `@theme {}` in [main.css](app/assets/styles/main.css), which mirrors the tokens declared in [tokens.css](app/assets/styles/tokens.css). When adding a token, declare it in `tokens.css` first, then expose it in the `@theme` block.

`@tailwindcss/typography` is installed for the blog post body (markdown rendered through `marked`).

Tokens worth knowing:
- `bg-paper`, `bg-card`, `bg-card-soft` — surfaces (warm cream in light, near-black in dark).
- `text-ink`, `text-ink-2`, `text-ink-3`, `text-ink-4` — type hierarchy.
- `border-line`, `border-line-2` — hairlines (no soft shadows by default).
- `text-accent`, `bg-accent`, `bg-accent-soft` — single brand blue (`#1d4ed8` light / `#4d80ef` dark). The light value was deepened from `#2C67E8`, which read 4.34:1 on `paper` and failed AA for links and button labels.
- `text-accent-fg` — the foreground to pair with an `bg-accent` fill (white in light, near-black in dark). Always use this on accent fills; `text-paper`/`text-night-text` fail contrast in one mode or the other.
- `text-accent-night` — accent for use *inside* the always-dark night tile. Deliberately does not flip with the theme, because the surface under it doesn't either.
- `bg-blob-1/2/3` — soft gradient stops, now only the hero portrait's fallback when no image is attached.
- `rounded-tile`, `rounded-card`, `rounded-input`, `rounded-chip` — radius scale.

Reusable utilities defined in CSS (not @theme): `.h-display` (display tracking), `.ring-hair` (hairline ring), `.font-mono-rail`, `.scrim-night`. `.dark .bg-night` adds a hairline because `night` equals the dark-mode `paper`.

**Deliberately removed as template ornament** (Oct 2026 review): aurora blobs (`AuroraBg`, `.aurora-soft`), glass chips (`.glass-cream`), blue glow halos (`.glow-blue`, `UiButton glow`), the fake `whoami.sh` terminal (`TerminalPanel`/`TerminalLine`), pulsing `animate-ping` dots, `// 0N ·` section numbering and eyebrow labels above h1/h2. `SectionLabel` is for labelling content (now-tiles, facts panel, About rail), never above a heading. Don't bring these back by default.

`.scrim-night` is the gradient that makes cream text legible over an arbitrary photo (project cards, hero portrait caption). It supplies the gradient only — the caller positions it (`absolute inset-0`, or a bottom strip). Don't weaken its stops: over a light screenshot the text needs >= 0.65 overlay alpha to clear 4.5:1.

**Contrast is a hard constraint on this palette.** `ink-3` and the accent were both retuned to pass WCAG AA on every surface they render on; `ink-4` passes only 3:1 and is for separators and decorative icons, never body text or placeholders. Re-check any token change against `paper`, `card` and `card-soft` in both themes.

### Projects

`/projects/<slug>` ([app/pages/projects/[slug].vue](app/pages/projects/[slug].vue)) renders a project's long `description` — plain text with blank-line paragraphs and `•` lists, turned into `<p>`/`<ul>` by [`textToBlocks`](app/utils/text.ts) (no `v-html`). Slugs are translated per locale (`resolve-cliente` / `customer-resolve`): look up with `translations__slug`, fetch the other locale by id for hreflang. Projects with an empty description still render (cards always link there) but are `noindex` and left out of the sitemap. The list page is `app/pages/projects/index.vue` (a sibling `projects.vue` would turn into a parent route).

### Content blocks (CMS-lite)

A lot of homepage/about copy is editable from the backend as `ContentBlock` rows ([app/types/content.ts](app/types/content.ts)) — pages call `useApiPaginated('...content-blocks...')` and look up by `key` (e.g. `'hero_name'`, `'seo_image'`, `'contact_linkedin'`). When editing pages, prefer adding a content block lookup over hardcoding strings, falling back to an i18n key.

### Scroll animations

[`useFadeUp`](app/composables/useFadeUp.ts) owns the GSAP/ScrollTrigger entrance used by every list page — call it instead of writing a new `gsap.from` block. It no-ops under `prefers-reduced-motion` (the tween sets `opacity: 0` from JS, so the CSS media query in [main.css](app/assets/styles/main.css) cannot undo it), skips blocks already on screen at mount (hiding SSR-painted content made the hero blink and pushed Speed Index to 5 s), and kills its ScrollTriggers on unmount. A print rule forces `.fade-up` visible.

### Images

`@nuxt/image`'s `sizes` prop uses **its own syntax** — `sizes="sm:100vw md:50vw lg:400px"` (value applies from that breakpoint up). A standard media-query string like `"(max-width: 768px) 100vw, 560px"` is silently misparsed and phones got 1120–1600px images. IPX's remote (backend media) cache lifetime is set in `image.ipx.http.maxAge`, not `image.ipx.maxAge`.

### Caching

`routeRules` give every `/pt-br/**` and `/en-us/**` page `swr: 60` — served from Nitro's cache, re-rendered in the background, so CMS edits show within ~a minute. Nitro never caches responses ≥ 400. Anything that makes the HTML depend on the visitor (cookies, auth, request headers) must not be added to these pages without revisiting this; the one cookie they set today, `i18n_redirected`, always equals the URL's locale.

### View tracking

[`usePostViews`](app/composables/usePostViews.ts) increments view counts by issuing a plain `GET /api/posts/:id/` after a 3s dwell (the backend counts the read on its side). Session storage prevents double-counting per session. This is client-only.
