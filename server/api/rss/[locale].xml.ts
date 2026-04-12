import type { SiteSetting } from "@/types/content";
import type { Post } from "@/types/blog";
import type { DjangoListResponse } from "@/types/api";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const locale = getRouterParam(event, "locale") || "pt-br";

  if (!["pt-br", "en-us"].includes(locale)) {
    throw createError({
      statusCode: 404,
      message: "RSS feed not found for this locale",
    });
  }

  const apiBase = config.public.apiBase;
  const siteUrl = config.public.siteUrl;

  if (!apiBase) {
    throw createError({
      statusCode: 500,
      message: "API base URL not configured",
    });
  }

  if (!siteUrl) {
    throw createError({
      statusCode: 500,
      message: "Site URL not configured",
    });
  }

  try {
    const postsResponse = await $fetch<
      DjangoListResponse<Post<{ category: true; author: true; tags: true }>>
    >("/api/posts/published/", {
      baseURL: apiBase,
      params: {
        limit: 50,
        ordering: "-published_at",
        expand: "category,author,images,tags",
      },
      headers: {
        "Accept-Language": locale,
      },
    });

    const posts = postsResponse.results || [];

    let siteName = "Leonardo Costa";
    let siteDescription = "Full Stack Developer & Creative Problem Solver";

    try {
      const settings: SiteSetting = await $fetch("/api/site-settings/", {
        baseURL: apiBase,
        headers: { "Accept-Language": locale },
      });
      siteName = settings.site_name || siteName;
      siteDescription = settings.tagline || siteDescription;
    } catch {
      console.warn("[rss] Could not fetch site settings, using defaults");
    }

    const rss = generateRSS({
      posts,
      locale,
      siteUrl,
      siteName,
      siteDescription,
    });

    setHeader(event, "Content-Type", "application/rss+xml; charset=utf-8");
    setHeader(event, "Cache-Control", "public, max-age=3600, s-maxage=3600");

    return rss;
  } catch (error: any) {
    console.error("[rss] ❌ Error:", error?.message || error);
    throw createError({
      statusCode: 500,
      message: `Error generating RSS feed: ${error?.message || "Unknown error"}`,
    });
  }
});

interface RSSOptions {
  posts: Post<{ category: true; author: true; tags: true }>[];
  locale: string;
  siteUrl: string;
  siteName: string;
  siteDescription: string;
}

function generateRSS(options: RSSOptions): string {
  const { posts, locale, siteUrl, siteName, siteDescription } = options;

  const langCode = locale === "pt-br" ? "pt-BR" : "en-US";
  const blogUrl = `${siteUrl}/${locale}/blog`;
  const feedUrl = `${siteUrl}/api/rss/${locale}.xml`;
  const logoUrl = `${siteUrl}/og-default.jpg`;

  const items = posts
    .map((post) => {
      try {
        const postUrl = `${siteUrl}/${locale}/blog/${post.slug}`;
        const pubDate = post.published_at
          ? new Date(post.published_at).toUTCString()
          : new Date().toUTCString();

        const coverImage = post.images?.find(
          (img) => img.image_type === "cover"
        );
        const imageUrl = coverImage?.file || coverImage?.thumbnail || "";
        const imageType = coverImage?.mime_type || "image/jpeg";
        const imageLength = coverImage?.file_size || 0;
        const imageWidth = coverImage?.width || 0;
        const imageHeight = coverImage?.height || 0;

        const categoryName =
          post.category && typeof post.category === "object"
            ? post.category.name
            : "";

        const authorName =
          post.author && typeof post.author === "object"
            ? `${post.author.first_name} ${post.author.last_name}`.trim()
            : siteName;

        const description = escapeXml(
          post.meta_description ||
            post.excerpt ||
            post.body
              ?.replace(/<[^>]*>/g, "")
              .slice(0, 300)
              .trim() ||
            ""
        );

        const tagsXml =
          post.tags
            ?.map((tag) =>
              typeof tag === "object"
                ? `<category>${escapeXml(tag.name)}</category>`
                : ""
            )
            .filter(Boolean)
            .join("\n      ") || "";

        const enclosureXml = imageUrl
          ? `<enclosure url="${escapeXml(imageUrl)}" length="${imageLength}" type="${imageType}"/>`
          : "";

        const mediaXml = imageUrl
          ? `<media:content url="${escapeXml(imageUrl)}" medium="image" type="${imageType}"${imageWidth ? ` width="${imageWidth}"` : ""}${imageHeight ? ` height="${imageHeight}"` : ""}/>
      <media:thumbnail url="${escapeXml(coverImage?.thumbnail || imageUrl)}"/>`
          : "";

        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(authorName)}</dc:creator>
      <description><![CDATA[${description}]]></description>
      ${categoryName ? `<category>${escapeXml(categoryName)}</category>` : ""}
      ${tagsXml}
      ${enclosureXml}
      ${mediaXml}
      <content:encoded><![CDATA[${post.body || ""}]]></content:encoded>
    </item>`;
      } catch (error) {
        console.error(`[rss] Error on post ${post.id}:`, error);
        return "";
      }
    })
    .filter(Boolean)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)} — Blog</title>
    <link>${blogUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>${langCode}</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(siteName)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Nuxt RSS</generator>
    <image>
      <url>${logoUrl}</url>
      <title>${escapeXml(siteName)}</title>
      <link>${blogUrl}</link>
    </image>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
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
