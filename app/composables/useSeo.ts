interface SeoMetaInput {
  title?: string;
  description?: string;
  image?: string;
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

export const useSeo = () => {
  const route = useRoute();
  const config = useRuntimeConfig();
  const { locale, locales } = useI18n();
  const switchLocalePath = useSwitchLocalePath();

  // Get site settings from nuxtData (set by plugin)
  const siteSettingsData = useNuxtData("site-settings");
  const siteSettings = computed(() => siteSettingsData.data.value);

  const siteName = computed(
    () => siteSettings.value?.site_name || "Leonardo Costa"
  );
  const defaultTitle = computed(
    () => siteSettings.value?.default_title || "Portfolio | Leonardo Costa"
  );
  const defaultDescription = computed(
    () => siteSettings.value?.default_description || "Full Stack Developer"
  );
  const defaultImage = computed(() => {
    if (siteSettings.value?.default_image) {
      return siteSettings.value.default_image;
    }
    return `${config.public.siteUrl}/og-default.jpg`;
  });

  const availableLocales = locales.value as Array<{
    code: "pt-br" | "en-us";
    iso: string;
  }>;

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
    } = input;

    // Build full URL
    const baseUrl = config.public.siteUrl || "https://leonardocosta.dev";
    const currentPath = route.path;
    const fullUrl = url || `${baseUrl}${currentPath}`;
    const imageUrl = image || defaultImage.value;

    // Build title with site name
    const fullTitle = title
      ? `${title} | ${siteName.value}`
      : defaultTitle.value;

    // Canonical URL
    const canonical = canonicalUrl || fullUrl;

    // Robots meta
    const robotsContent = [];

    if (input.robots) {
      const r = input.robots;

      // Index/noindex
      if (r.index === false || noindex) {
        robotsContent.push("noindex");
      } else {
        robotsContent.push("index");
      }

      // Follow/nofollow
      if (r.follow === false || nofollow) {
        robotsContent.push("nofollow");
      } else {
        robotsContent.push("follow");
      }

      // Additional directives
      if (r.noarchive) robotsContent.push("noarchive");
      if (r.nosnippet) robotsContent.push("nosnippet");
      if (r.noimageindex) robotsContent.push("noimageindex");
      if (r.maxSnippet !== undefined)
        robotsContent.push(`max-snippet:${r.maxSnippet}`);
      if (r.maxImagePreview)
        robotsContent.push(`max-image-preview:${r.maxImagePreview}`);
      if (r.maxVideoPreview !== undefined)
        robotsContent.push(`max-video-preview:${r.maxVideoPreview}`);
    } else {
      // Default behavior
      if (noindex) robotsContent.push("noindex");
      else robotsContent.push("index");

      if (nofollow) robotsContent.push("nofollow");
      else robotsContent.push("follow");

      robotsContent.push("max-image-preview:large");
      robotsContent.push("max-snippet:-1");
      robotsContent.push("max-video-preview:-1");
    }

    // Build meta object
    const meta: any = {
      title: fullTitle,
      description: description || defaultDescription.value,

      // Open Graph
      ogTitle: title || defaultTitle.value,
      ogDescription: description || defaultDescription.value,
      ogImage: imageUrl,
      ogImageAlt: title || siteName.value,
      ogUrl: fullUrl,
      ogType: type,
      ogSiteName: siteName.value,
      ogLocale: locale.value === "pt-br" ? "pt_BR" : "en_US",

      // Twitter Card
      twitterCard: "summary_large_image",
      twitterTitle: title || defaultTitle.value,
      twitterDescription: description || defaultDescription.value,
      twitterImage: imageUrl,
      twitterImageAlt: title || siteName.value,
    };

    // Article specific meta
    if (type === "article" && article) {
      if (article.publishedTime) {
        meta.articlePublishedTime = article.publishedTime;
      }
      if (article.modifiedTime) {
        meta.articleModifiedTime = article.modifiedTime;
      }
      if (article.author) {
        meta.articleAuthor = article.author;
      }
      if (article.section) {
        meta.articleSection = article.section;
      }
      if (article.tags) {
        meta.articleTag = article.tags;
      }
    }

    // Set meta tags using Nuxt's useSeoMeta
    useSeoMeta(meta);

    // Set head tags for additional control
    useHead({
      title: fullTitle,
      htmlAttrs: {
        lang: locale.value === "pt-br" ? "pt-BR" : "en-US",
      },
      link: [
        // Canonical
        {
          rel: "canonical",
          href: canonical,
        },
        // Hreflang for alternate languages
        ...getHreflangLinks(currentPath),
      ],
      meta: [
        // Robots
        {
          name: "robots",
          content: robotsContent.join(", "),
        },
        // Additional OG image dimensions
        ...(imageUrl
          ? [
              { property: "og:image:width", content: "1200" },
              { property: "og:image:height", content: "630" },
              { property: "og:image:type", content: "image/jpeg" },
            ]
          : []),
      ],
    });
  };

  /**
   * Generate hreflang links for all locales
   */
  const getHreflangLinks = (path: string) => {
    const baseUrl = config.public.siteUrl || "https://leonardocosta.dev";
    const links: any[] = [];

    availableLocales.forEach((loc) => {
      const localePath = switchLocalePath(loc.code);
      if (localePath) {
        links.push({
          rel: "alternate",
          hreflang: loc.iso.toLowerCase(),
          href: `${baseUrl}${localePath}`,
        });
      }
    });

    // Add x-default for fallback
    const defaultLocalePath = switchLocalePath("pt-br");
    if (defaultLocalePath) {
      links.push({
        rel: "alternate",
        hreflang: "x-default",
        href: `${baseUrl}${defaultLocalePath}`,
      });
    }

    return links;
  };

  /**
   * Set JSON-LD structured data
   */
  const setStructuredData = (data: any) => {
    useHead({
      script: [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(data),
        },
      ],
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

    // Add blog RSS feeds if enabled (default: true)
    if (options?.includeBlog !== false) {
      availableLocales.forEach((loc) => {
        const title =
          loc.code === "pt-br"
            ? `${siteName.value} - Blog (Português)`
            : `${siteName.value} - Blog (English)`;

        feeds.push({
          rel: "alternate",
          type: "application/rss+xml",
          title,
          href: `${baseUrl}/api/rss/${loc.code}.xml`,
        });
      });
    }

    // Add custom feeds if provided
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

    useHead({
      link: feeds,
    });
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
