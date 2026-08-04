interface OgImageInput {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
}

interface AlternateLanguage {
  /** locale code, e.g. "pt-br" or "en-us" */
  locale: string;
  /** path WITHOUT the locale prefix and including leading "/", e.g. "/blog/equipe-..." */
  path: string;
}

interface SeoMetaInput {
  title?: string;
  description?: string;
  image?: string | OgImageInput;
  url?: string;
  type?: "website" | "article" | "profile";
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  noindex?: boolean;
  nofollow?: boolean;
  canonicalUrl?: string;
  keywords?: string[];
  /**
   * Explicit hreflang alternates. When supplied, overrides the default
   * `useSwitchLocalePath`-based output. Required for routes with
   * locale-dependent slugs (e.g. blog posts, categories), where the slug
   * differs per language and switchLocalePath would otherwise emit a 404.
   */
  alternateLanguages?: AlternateLanguage[];
  robots?: {
    index?: boolean;
    follow?: boolean;
    noarchive?: boolean;
    nosnippet?: boolean;
    noimageindex?: boolean;
    maxSnippet?: number;
    maxImagePreview?: "none" | "standard" | "large";
    maxVideoPreview?: number;
  };
}

const DEFAULT_OG_WIDTH = 1200;
const DEFAULT_OG_HEIGHT = 630;

export const useSeo = () => {
  const route = useRoute();
  const config = useRuntimeConfig();
  const { locale, locales, defaultLocale } = useI18n();
  const switchLocalePath = useSwitchLocalePath();

  // Get site settings from nuxtData (set by plugin)
  const siteSettingsData = useNuxtData("site-settings");
  const siteSettings = computed(() => siteSettingsData.data.value);

  const siteName = computed(
    () => siteSettings.value?.site_name || "Leonardo Costa"
  );
  const defaultTitle = computed(
    () =>
      siteSettings.value?.default_title ||
      "Leonardo Costa — Desenvolvedor Backend Django, Python e PostgreSQL"
  );
  const defaultDescription = computed(
    () =>
      siteSettings.value?.default_description ||
      "Desenvolvedor backend com mais de 3 anos em Django REST, PostgreSQL e integrações com I.A. Construo APIs, sistemas com Vue.js/Next.js e arquiteturas com filas assíncronas."
  );
  const defaultImage = computed(() => {
    if (siteSettings.value?.default_image) {
      return siteSettings.value.default_image;
    }
    return `${config.public.siteUrl}/og-default.jpg`;
  });

  const availableLocales = locales.value as Array<{
    code: "pt-br" | "en-us";
    language?: string;
    iso?: string;
  }>;

  const getLanguageTag = (code: string) => {
    const loc = availableLocales.find((l) => l.code === code);
    return loc?.language || loc?.iso || code;
  };

  const normalizeOgImage = (input: SeoMetaInput["image"]): OgImageInput => {
    if (!input) {
      return {
        url: defaultImage.value,
        width: DEFAULT_OG_WIDTH,
        height: DEFAULT_OG_HEIGHT,
        type: "image/jpeg",
      };
    }
    if (typeof input === "string") {
      return {
        url: input,
        width: DEFAULT_OG_WIDTH,
        height: DEFAULT_OG_HEIGHT,
      };
    }
    return {
      url: input.url,
      width: input.width || DEFAULT_OG_WIDTH,
      height: input.height || DEFAULT_OG_HEIGHT,
      alt: input.alt,
      type: input.type,
    };
  };

  /**
   * Set comprehensive SEO meta tags
   */
  const setSeoMeta = (input: SeoMetaInput) => {
    const {
      title,
      description,
      image,
      url,
      type = "website",
      article,
      noindex = false,
      nofollow = false,
      canonicalUrl,
      keywords,
    } = input;

    const baseUrl = config.public.siteUrl || "https://leonardocosta.dev";
    const currentPath = route.path;
    // fullPath (with query) — stripVolatileQuery removes the volatile params
    // but must see ?page= so paginated pages can self-canonicalize.
    const fullUrl = url || `${baseUrl}${route.fullPath}`;
    const ogImage = normalizeOgImage(image);

    // Append the brand name, but avoid duplicating it when the page title
    // already contains it (backend `seo_title` blocks sometimes embed the
    // full "Leonardo Costa — …" string, which would otherwise render
    // "… | Leonardo Costa | Leonardo Costa").
    const brand = siteName.value;
    const titleHasBrand =
      !!title && title.toLowerCase().includes(brand.toLowerCase());
    const fullTitle = title
      ? titleHasBrand
        ? title
        : `${title} | ${brand}`
      : defaultTitle.value;

    // Canonical — strip volatile query params (search, sort) to prevent dup
    // content. `page` is kept: paginated pages are server-rendered with their
    // own content, so they must self-canonicalize or Google drops pages 2+.
    const canonical = canonicalUrl || stripVolatileQuery(fullUrl);

    // Robots directives
    const robotsContent: string[] = [];
    if (input.robots) {
      const r = input.robots;
      robotsContent.push(r.index === false || noindex ? "noindex" : "index");
      robotsContent.push(
        r.follow === false || nofollow ? "nofollow" : "follow"
      );
      if (r.noarchive) robotsContent.push("noarchive");
      if (r.nosnippet) robotsContent.push("nosnippet");
      if (r.noimageindex) robotsContent.push("noimageindex");
      if (r.maxSnippet !== undefined)
        robotsContent.push(`max-snippet:${r.maxSnippet}`);
      robotsContent.push(`max-image-preview:${r.maxImagePreview || "large"}`);
      if (r.maxVideoPreview !== undefined)
        robotsContent.push(`max-video-preview:${r.maxVideoPreview}`);
      else robotsContent.push("max-video-preview:-1");
    } else {
      robotsContent.push(noindex ? "noindex" : "index");
      robotsContent.push(nofollow ? "nofollow" : "follow");
      robotsContent.push("max-image-preview:large");
      robotsContent.push("max-snippet:-1");
      robotsContent.push("max-video-preview:-1");
    }

    const meta: Record<string, unknown> = {
      title: fullTitle,
      description: description || defaultDescription.value,

      // Open Graph
      ogTitle: title || defaultTitle.value,
      ogDescription: description || defaultDescription.value,
      ogImage: ogImage.url,
      ogImageAlt: ogImage.alt || title || siteName.value,
      // og:url must match the canonical, or shares of ?search=/?sort= URLs
      // register as distinct objects on social platforms.
      ogUrl: canonical,
      ogType: type,
      ogSiteName: siteName.value,
      ogLocale: locale.value === "pt-br" ? "pt_BR" : "en_US",
      ogLocaleAlternate: availableLocales
        .filter((l) => l.code !== locale.value)
        .map((l) => (l.code === "pt-br" ? "pt_BR" : "en_US")),

      // Twitter Card
      twitterCard: "summary_large_image",
      twitterTitle: title || defaultTitle.value,
      twitterDescription: description || defaultDescription.value,
      twitterImage: ogImage.url,
      twitterImageAlt: ogImage.alt || title || siteName.value,
    };

    if (config.public.twitterHandle) {
      meta.twitterSite = config.public.twitterHandle;
      meta.twitterCreator = config.public.twitterHandle;
    }

    // Article-specific meta
    if (type === "article" && article) {
      if (article.publishedTime)
        meta.articlePublishedTime = article.publishedTime;
      if (article.modifiedTime)
        meta.articleModifiedTime = article.modifiedTime;
      if (article.author) meta.articleAuthor = article.author;
      if (article.section) meta.articleSection = article.section;
      if (article.tags) meta.articleTag = article.tags;
    }

    if (keywords?.length) {
      meta.keywords = keywords.join(", ");
    }

    useSeoMeta(meta);

    const imageMeta: Array<Record<string, string>> = [
      { property: "og:image:width", content: String(ogImage.width) },
      { property: "og:image:height", content: String(ogImage.height) },
    ];
    if (ogImage.type) {
      imageMeta.push({ property: "og:image:type", content: ogImage.type });
    }

    useHead({
      title: fullTitle,
      htmlAttrs: {
        lang: getLanguageTag(locale.value),
      },
      link: [
        { rel: "canonical", href: canonical },
        ...getHreflangLinks(currentPath, input.alternateLanguages),
      ],
      meta: [
        { name: "robots", content: robotsContent.join(", ") },
        { name: "googlebot", content: robotsContent.join(", ") },
        ...imageMeta,
      ],
    });
  };

  /**
   * Generate hreflang links for all locales (+ x-default → default locale).
   *
   * If `explicit` is provided, use those URLs verbatim (required for routes
   * with locale-dependent slugs). Otherwise fall back to `useSwitchLocalePath`,
   * which only works for routes that share a slug across languages.
   */
  const getHreflangLinks = (
    _path: string,
    explicit?: AlternateLanguage[]
  ) => {
    const baseUrl = config.public.siteUrl || "https://leonardocosta.dev";
    const links: Array<{ rel: string; hreflang: string; href: string }> = [];

    if (explicit?.length) {
      explicit.forEach((alt) => {
        links.push({
          rel: "alternate",
          hreflang: getLanguageTag(alt.locale),
          href: `${baseUrl}/${alt.locale}${alt.path}`,
        });
      });

      const defaultLocaleCode = (defaultLocale as string) || "pt-br";
      const defaultEntry =
        explicit.find((alt) => alt.locale === defaultLocaleCode) ||
        explicit[0];
      if (defaultEntry) {
        links.push({
          rel: "alternate",
          hreflang: "x-default",
          href: `${baseUrl}/${defaultEntry.locale}${defaultEntry.path}`,
        });
      }
      return links;
    }

    availableLocales.forEach((loc) => {
      const localePath = switchLocalePath(loc.code);
      if (localePath) {
        links.push({
          rel: "alternate",
          hreflang: getLanguageTag(loc.code),
          href: `${baseUrl}${localePath}`,
        });
      }
    });

    const defaultPath = switchLocalePath(defaultLocale || "pt-br");
    if (defaultPath) {
      links.push({
        rel: "alternate",
        hreflang: "x-default",
        href: `${baseUrl}${defaultPath}`,
      });
    }

    return links;
  };

  /**
   * Set JSON-LD structured data. Accepts single object or array — each gets its own script.
   */
  const setStructuredData = (data: unknown | unknown[]) => {
    const items = Array.isArray(data) ? data : [data];
    useHead({
      // Keyed so callers inside watchEffect replace their previous script
      // instead of appending a duplicate JSON-LD block on every re-run.
      script: items.map((item, i) => ({
        key: `ld-${(item as Record<string, unknown>)?.["@type"] ?? "data"}-${i}`,
        type: "application/ld+json",
        innerHTML: JSON.stringify(item),
      })),
    });
  };

  /**
   * Add RSS feed links to head
   */
  const setRssFeed = (options?: {
    includeBlog?: boolean;
    customFeeds?: Array<{ title: string; href: string; type?: string }>;
  }) => {
    const baseUrl = config.public.siteUrl || "http://localhost:3000";
    const feeds: Array<{
      rel: string;
      title: string;
      href: string;
      type?: string;
    }> = [];

    if (options?.includeBlog !== false) {
      availableLocales.forEach((loc) => {
        const title =
          loc.code === "pt-br"
            ? `${siteName.value} — Blog (Português)`
            : `${siteName.value} — Blog (English)`;

        feeds.push({
          rel: "alternate",
          type: "application/rss+xml",
          title,
          href: `${baseUrl}/api/rss/${loc.code}.xml`,
        });
      });
    }

    if (options?.customFeeds) {
      options.customFeeds.forEach((feed) => {
        feeds.push({
          rel: "alternate",
          type: feed.type || "application/rss+xml",
          title: feed.title,
          href: feed.href,
        });
      });
    }

    useHead({ link: feeds });
  };

  return {
    setSeoMeta,
    setStructuredData,
    setRssFeed,
    siteName,
    defaultTitle,
    defaultDescription,
    defaultImage,
  };
};

function stripVolatileQuery(url: string): string {
  try {
    const parsed = new URL(url);
    const volatile = ["limit", "search", "q", "sort", "ordering"];
    volatile.forEach((key) => parsed.searchParams.delete(key));
    if (parsed.searchParams.get("page") === "1") {
      parsed.searchParams.delete("page");
    }
    const qs = parsed.searchParams.toString();
    // Normalize the trailing slash so `/pt-br/blog/` and `/pt-br/blog` don't
    // emit two self-referential canonicals (Google would treat them as
    // duplicates with conflicting canonicals). The sitemap uses the
    // no-trailing-slash form, so canonicals must match it.
    const pathname =
      parsed.pathname.length > 1
        ? parsed.pathname.replace(/\/+$/, "")
        : parsed.pathname;
    return `${parsed.origin}${pathname}${qs ? `?${qs}` : ""}`;
  } catch {
    return url;
  }
}
