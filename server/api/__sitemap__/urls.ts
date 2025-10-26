import type { SitemapUrl } from "#sitemap/types";
import type { Post, Category } from "@/types/blog";
import type { DjangoListResponse } from "@/types/api";
import type { Project } from "@/types/portfolio";

export default defineSitemapEventHandler(async (e) => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  if (!apiBase) {
    console.warn(
      "API base URL not configured, sitemap will only include static pages"
    );
    return getStaticPages();
  }

  const urls: SitemapUrl[] = [];

  try {
    // Fetch all published posts with proper typing
    const postsResponse = await $fetch<DjangoListResponse<Post>>(
      "/api/posts/published/",
      {
        baseURL: apiBase,
        params: {
          limit: 1000,
          ordering: "-published_at",
        },
      }
    );

    if (postsResponse?.results?.length) {
      postsResponse.results.forEach((post) => {
        const lastmod = post.updated_at || post.published_at || undefined;
        const priority = post.is_pinned ? 0.9 : 0.8; // Higher priority for pinned posts

        // Portuguese version
        urls.push({
          loc: `/pt-br/blog/${post.slug}`,
          lastmod,
          changefreq: "weekly",
          priority,
        });

        // English version
        urls.push({
          loc: `/en-us/blog/${post.slug}`,
          lastmod,
          changefreq: "weekly",
          priority,
        });
      });
    }

    // Fetch all active categories with proper typing
    const categoriesResponse = await $fetch<DjangoListResponse<Category>>(
      "/api/post-categories/",
      {
        baseURL: apiBase,
        params: {
          is_active: true,
          limit: 1000,
          ordering: "order",
        },
      }
    );

    if (categoriesResponse?.results?.length) {
      categoriesResponse.results.forEach((category) => {
        // Portuguese version
        urls.push({
          loc: `/pt-br/blog/category/${category.slug}`,
          changefreq: "weekly",
          priority: 0.7,
        });

        // English version
        urls.push({
          loc: `/en-us/blog/category/${category.slug}`,
          changefreq: "weekly",
          priority: 0.7,
        });
      });
    }

    // Fetch all published projects with proper typing
    const projectsResponse = await $fetch<DjangoListResponse<Project>>(
      "/api/projects/",
      {
        baseURL: apiBase,
        params: {
          status: "published",
          limit: 1000,
          ordering: "-featured,sort_order",
        },
      }
    );

    if (projectsResponse?.results?.length) {
      projectsResponse.results.forEach((project) => {
        const priority = project.featured ? 0.9 : 0.7; // Higher priority for featured projects

        // Portuguese version
        urls.push({
          loc: `/pt-br/projects/${project.slug}`,
          lastmod: project.updated_at,
          changefreq: "monthly",
          priority,
        });

        // English version
        urls.push({
          loc: `/en-us/projects/${project.slug}`,
          lastmod: project.updated_at,
          changefreq: "monthly",
          priority,
        });
      });
    }

    // Add static pages
    urls.push(...getStaticPages());

    console.log(`✅ Generated sitemap with ${urls.length} URLs`);
  } catch (error) {
    console.error("❌ Error generating sitemap URLs:", error);

    // Return at least static pages if API fails
    return getStaticPages();
  }

  return urls;
});

/**
 * Get static pages that always exist
 */
function getStaticPages(): SitemapUrl[] {
  return [
    // Home pages
    { loc: "/pt-br/", priority: 1.0, changefreq: "weekly" },
    { loc: "/en-us/", priority: 1.0, changefreq: "weekly" },

    // About pages
    { loc: "/pt-br/about", priority: 0.9, changefreq: "monthly" },
    { loc: "/en-us/about", priority: 0.9, changefreq: "monthly" },

    // Projects index
    { loc: "/pt-br/projects", priority: 0.9, changefreq: "weekly" },
    { loc: "/en-us/projects", priority: 0.9, changefreq: "weekly" },

    // Blog index
    { loc: "/pt-br/blog", priority: 0.9, changefreq: "daily" },
    { loc: "/en-us/blog", priority: 0.9, changefreq: "daily" },

    // Categories index
    { loc: "/pt-br/blog/category", priority: 0.7, changefreq: "weekly" },
    { loc: "/en-us/blog/category", priority: 0.7, changefreq: "weekly" },
  ];
}
