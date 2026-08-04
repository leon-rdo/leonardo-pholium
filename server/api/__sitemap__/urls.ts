import type { SitemapUrl } from "#sitemap/types";
import type { Post, Category } from "@/types/blog";
import type { DjangoListResponse } from "@/types/api";
import type { Image } from "@/types/core";

type Locale = "pt-br" | "en-us";
const LOCALES: readonly Locale[] = ["pt-br", "en-us"] as const;

const localeToHreflang = (loc: Locale) => (loc === "pt-br" ? "pt-BR" : "en-US");

export default defineSitemapEventHandler(async (_e) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  if (!apiBase) {
    console.warn(
      "[sitemap] API base URL not configured, returning static pages only"
    );
    return getStaticPages();
  }

  const urls: SitemapUrl[] = [];

  try {
    // ---------- Blog posts ----------
    // Fetch once per locale so each translation's `slug` is correct, then pair by id.
    const postsByLocale = await fetchByLocale<Post<{ category: true }>>(
      apiBase,
      "/api/posts/published/",
      {
        limit: 1000,
        ordering: "-published_at",
        expand: "category,images",
      }
    );

    const postRecords = pairByLocale(postsByLocale);
    postRecords.forEach(({ perLocale, sample }) => {
      const lastmod = sample.updated_at || sample.published_at || undefined;
      const priority = sample.is_pinned ? 0.9 : 0.8;
      const images = extractImages(sample.images);
      const alternatives = alternativesFromPerLocale(perLocale, "/blog");

      LOCALES.forEach((locale) => {
        const slug = perLocale[locale];
        if (!slug) return;
        urls.push({
          loc: `/${locale}/blog/${slug}`,
          lastmod,
          changefreq: "weekly",
          priority,
          images,
          alternatives,
        });
      });
    });

    // ---------- Blog categories ----------
    const categoriesByLocale = await fetchByLocale<
      Category & { images?: Image[] }
    >(apiBase, "/api/post-categories/", {
      is_active: true,
      limit: 1000,
      ordering: "order",
      expand: "images",
    });

    const categoryRecords = pairByLocale(categoriesByLocale);
    categoryRecords.forEach(({ perLocale, sample }) => {
      const images = extractImages(sample.images);
      const alternatives = alternativesFromPerLocale(
        perLocale,
        "/blog/category"
      );

      LOCALES.forEach((locale) => {
        const slug = perLocale[locale];
        if (!slug) return;
        urls.push({
          loc: `/${locale}/blog/category/${slug}`,
          changefreq: "weekly",
          priority: 0.7,
          images,
          alternatives,
        });
      });
    });

    // Projects don't have detail pages yet — list page is covered by getStaticPages().

    urls.push(...getStaticPages());

    console.log(`[sitemap] ✅ Generated ${urls.length} URLs`);
  } catch (error) {
    console.error("[sitemap] ❌ Error generating URLs:", error);
    return getStaticPages();
  }

  return urls;
});

async function fetchByLocale<T>(
  apiBase: string,
  path: string,
  params: Record<string, unknown>
): Promise<Record<Locale, T[]>> {
  const entries = await Promise.all(
    LOCALES.map(async (locale) => {
      try {
        const resp = await $fetch<DjangoListResponse<T>>(path, {
          baseURL: apiBase,
          params,
          headers: { "Accept-Language": locale },
        });
        return [locale, resp?.results ?? []] as const;
      } catch (err) {
        console.error(`[sitemap] failed ${path} for locale=${locale}:`, err);
        return [locale, []] as const;
      }
    })
  );
  return Object.fromEntries(entries) as Record<Locale, T[]>;
}

interface PairedRecord<T> {
  id: number;
  perLocale: Partial<Record<Locale, string>>;
  sample: T;
}

function pairByLocale<T extends { id: number; slug: string }>(
  byLocale: Record<Locale, T[]>
): Array<PairedRecord<T>> {
  const byId = new Map<number, PairedRecord<T>>();
  for (const locale of LOCALES) {
    for (const item of byLocale[locale] ?? []) {
      let rec = byId.get(item.id);
      if (!rec) {
        rec = { id: item.id, perLocale: {}, sample: item };
        byId.set(item.id, rec);
      }
      rec.perLocale[locale] = item.slug;
    }
  }
  return Array.from(byId.values());
}

function alternativesFromPerLocale(
  perLocale: Partial<Record<Locale, string>>,
  basePath: string
) {
  const alts: Array<{ hreflang: string; href: string }> = [];
  LOCALES.forEach((locale) => {
    const slug = perLocale[locale];
    if (!slug) return;
    alts.push({
      hreflang: localeToHreflang(locale),
      href: `/${locale}${basePath}/${slug}`,
    });
  });
  const defaultSlug = perLocale["pt-br"] || perLocale["en-us"];
  if (defaultSlug) {
    alts.push({
      hreflang: "x-default",
      href: `/pt-br${basePath}/${defaultSlug}`,
    });
  }
  return alts;
}

function alternativesFor(pathWithoutLocale: string) {
  const alts = LOCALES.map((loc) => ({
    hreflang: localeToHreflang(loc),
    href: `/${loc}${pathWithoutLocale}`,
  }));
  alts.push({
    hreflang: "x-default",
    href: `/pt-br${pathWithoutLocale}`,
  });
  return alts;
}

function extractImages(
  images?: Image[],
  fallbackUrl?: string | null
): Array<{ loc: string }> {
  if (!images?.length && !fallbackUrl) return [];
  const urls: string[] = [];
  if (images?.length) {
    images
      .filter(
        (img) => img.image_type === "cover" || img.image_type === "gallery"
      )
      .forEach((img) => {
        const url = img.file || img.thumbnail;
        if (url) urls.push(url);
      });
  }
  if (!urls.length && fallbackUrl) {
    urls.push(fallbackUrl);
  }
  return urls.map((loc) => ({ loc }));
}

/**
 * Static pages that always exist, with i18n alternates per URL
 */
function getStaticPages(): SitemapUrl[] {
  const staticPaths: Array<{
    path: string;
    priority: number;
    changefreq: SitemapUrl["changefreq"];
  }> = [
    { path: "/", priority: 1.0, changefreq: "weekly" },
    { path: "/about", priority: 0.9, changefreq: "monthly" },
    { path: "/projects", priority: 0.9, changefreq: "weekly" },
    { path: "/blog", priority: 0.9, changefreq: "daily" },
    { path: "/blog/category", priority: 0.7, changefreq: "weekly" },
  ];

  const urls: SitemapUrl[] = [];
  staticPaths.forEach(({ path, priority, changefreq }) => {
    // Home is emitted as /{locale} (no trailing slash) — the canonical
    // strips trailing slashes, and sitemap loc must match the canonical.
    const suffix = path === "/" ? "" : path;
    LOCALES.forEach((locale) => {
      urls.push({
        loc: `/${locale}${suffix}`,
        priority,
        changefreq,
        alternatives: alternativesFor(suffix),
      });
    });
  });
  return urls;
}
