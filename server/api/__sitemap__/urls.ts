import type { SitemapUrl } from "#sitemap/types";
import type { Post, Category } from "@/types/blog";
import type { DjangoListResponse } from "@/types/api";
import type { Project } from "@/types/portfolio";
import type { Image } from "@/types/core";

const LOCALES = ["pt-br", "en-us"] as const;

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
    const postsResponse = await $fetch<
      DjangoListResponse<Post<{ category: true }>>
    >("/api/posts/published/", {
      baseURL: apiBase,
      params: {
        limit: 1000,
        ordering: "-published_at",
        expand: "category,images",
      },
    });

    if (postsResponse?.results?.length) {
      postsResponse.results.forEach((post) => {
        const lastmod = post.updated_at || post.published_at || undefined;
        const priority = post.is_pinned ? 0.9 : 0.8;
        const images = extractImages(post.images);

        LOCALES.forEach((locale) => {
          urls.push({
            loc: `/${locale}/blog/${post.slug}`,
            lastmod,
            changefreq: "weekly",
            priority,
            images,
            alternatives: alternativesFor(`/blog/${post.slug}`),
          });
        });
      });
    }

    // ---------- Blog categories ----------
    const categoriesResponse = await $fetch<
      DjangoListResponse<Category & { images?: Image[] }>
    >("/api/post-categories/", {
      baseURL: apiBase,
      params: {
        is_active: true,
        limit: 1000,
        ordering: "order",
        expand: "images",
      },
    });

    if (categoriesResponse?.results?.length) {
      categoriesResponse.results.forEach((category) => {
        const images = extractImages(category.images);

        LOCALES.forEach((locale) => {
          urls.push({
            loc: `/${locale}/blog/category/${category.slug}`,
            changefreq: "weekly",
            priority: 0.7,
            images,
            alternatives: alternativesFor(`/blog/category/${category.slug}`),
          });
        });
      });
    }

    // ---------- Projects ----------
    const projectsResponse = await $fetch<
      DjangoListResponse<Project & { images?: Image[] }>
    >("/api/projects/", {
      baseURL: apiBase,
      params: {
        status: "published",
        limit: 1000,
        ordering: "-featured,sort_order",
        expand: "images",
      },
    });

    if (projectsResponse?.results?.length) {
      projectsResponse.results.forEach((project) => {
        const priority = project.featured ? 0.9 : 0.7;
        const images = extractImages(project.images, project.cover);

        LOCALES.forEach((locale) => {
          urls.push({
            loc: `/${locale}/projects/${project.slug}`,
            lastmod: project.updated_at,
            changefreq: "monthly",
            priority,
            images,
            alternatives: alternativesFor(`/projects/${project.slug}`),
          });
        });
      });
    }

    urls.push(...getStaticPages());

    console.log(`[sitemap] ✅ Generated ${urls.length} URLs`);
  } catch (error) {
    console.error("[sitemap] ❌ Error generating URLs:", error);
    return getStaticPages();
  }

  return urls;
});

function alternativesFor(pathWithoutLocale: string) {
  const alts = LOCALES.map((loc) => ({
    hreflang: loc === "pt-br" ? "pt-BR" : "en-US",
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
    LOCALES.forEach((locale) => {
      urls.push({
        loc: `/${locale}${path === "/" ? "/" : path}`,
        priority,
        changefreq,
        alternatives: alternativesFor(path === "/" ? "/" : path),
      });
    });
  });
  return urls;
}
