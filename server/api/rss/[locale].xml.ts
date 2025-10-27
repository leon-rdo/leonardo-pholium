import type { SiteSetting } from "@/types/content";
import type { Post } from "@/types/blog";
import type { DjangoListResponse } from "@/types/api";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const locale = getRouterParam(event, "locale") || "pt-br";

  console.log("🚀 RSS Feed Request:", { locale });

  // Validate locale
  if (!["pt-br", "en-us"].includes(locale)) {
    console.error("❌ Invalid locale:", locale);
    throw createError({
      statusCode: 404,
      message: "RSS feed not found for this locale",
    });
  }

  const apiBase = config.public.apiBase;
  const siteUrl = config.public.siteUrl;

  console.log("⚙️  Config:", { apiBase, siteUrl });

  if (!apiBase) {
    console.error("❌ API base URL not configured");
    throw createError({
      statusCode: 500,
      message: "API base URL not configured",
    });
  }

  if (!siteUrl) {
    console.error("❌ Site URL not configured");
    throw createError({
      statusCode: 500,
      message: "Site URL not configured",
    });
  }

  try {
    console.log("📡 Fetching posts from API...");

    // Fetch latest published posts
    const postsResponse = await $fetch<
      DjangoListResponse<Post<{ category: true }>>
    >("/api/posts/published/", {
      baseURL: apiBase,
      params: {
        limit: 50,
        ordering: "-published_at",
        expand: "category,author,images",
      },
      headers: {
        "Accept-Language": locale,
      },
    });

    console.log(`✅ Fetched ${postsResponse.results?.length || 0} posts`);

    const posts = postsResponse.results || [];

    // Get site settings
    let siteName = "Leonardo Costa";
    let siteDescription = "Full Stack Developer";

    try {
      console.log("📡 Fetching site settings...");
      const settings: SiteSetting = await $fetch("/api/site-settings/", {
        baseURL: apiBase,
        headers: {
          "Accept-Language": locale,
        },
      });
      siteName = settings.site_name || siteName;
      siteDescription = settings.tagline || siteDescription;
      console.log("✅ Site settings fetched");
    } catch (error) {
      console.warn("⚠️  Could not fetch site settings, using defaults:", error);
    }

    console.log("🔨 Generating RSS XML...");

    // Build RSS XML
    const rss = generateRSS<{ category: true }>({
      posts,
      locale,
      siteUrl,
      siteName,
      siteDescription,
    });

    console.log("✅ RSS XML generated successfully");

    // Set headers
    setHeader(event, "Content-Type", "application/xml; charset=utf-8");
    setHeader(event, "Cache-Control", "max-age=3600");

    return rss;
  } catch (error: any) {
    console.error("❌ Error generating RSS feed:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error details:", error);

    throw createError({
      statusCode: 500,
      message: `Error generating RSS feed: ${error.message || "Unknown error"}`,
    });
  }
});

interface RSSOptions<T = Record<string, never>> {
  posts: Post<T>[];
  locale: string;
  siteUrl: string;
  siteName: string;
  siteDescription: string;
}

function generateRSS<T = Record<string, never>>(
  options: RSSOptions<T>
): string {
  const { posts, locale, siteUrl, siteName, siteDescription } = options;

  const langCode = locale === "pt-br" ? "pt-BR" : "en-US";
  const localePrefix = locale;
  const blogUrl = `${siteUrl}/${localePrefix}/blog`;

  const items = posts
    .map((post) => {
      try {
        const postUrl = `${siteUrl}/${localePrefix}/blog/${post.slug}`;
        const pubDate = post.published_at
          ? new Date(post.published_at).toUTCString()
          : new Date().toUTCString();

        // Get cover image
        const coverImage = post.images?.find(
          (img) => img.image_type === "cover"
        );
        const imageUrl = coverImage?.file || coverImage?.thumbnail || "";

        // Get category name
        const categoryName =
          post.category && typeof post.category === "object"
            ? post.category.name
            : "";

        // Clean HTML from body for description
        const description = escapeXml(
          post.excerpt ||
            post.body
              ?.replace(/<[^>]*>/g, "")
              .slice(0, 300)
              .trim() ||
            ""
        );

        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      ${categoryName ? `<category>${escapeXml(categoryName)}</category>` : ""}
      ${
        imageUrl
          ? `<enclosure url="${escapeXml(imageUrl)}" type="image/jpeg"/>`
          : ""
      }
      <content:encoded><![CDATA[${post.body || ""}]]></content:encoded>
    </item>`;
      } catch (error) {
        console.error(`❌ Error processing post ${post.id}:`, error);
        return ""; // Skip this post if it fails
      }
    })
    .filter(Boolean) // Remove empty items
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)} - Blog</title>
    <link>${blogUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>${langCode}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss/${locale}.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";

  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
