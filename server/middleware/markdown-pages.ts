import type { H3Event } from "h3";
import { loadSiteData, type LlmLocale } from "../utils/llm-source";
import {
  renderAbout,
  renderBlogIndex,
  renderHome,
  renderPost,
  renderProject,
  renderProjects,
  sendLlmText,
} from "../utils/llm-render";

/**
 * Markdown twin of every content page: append `.md` to the canonical URL.
 *
 *   /pt-br.md                 /pt-br/about.md      /pt-br/projects.md
 *   /pt-br/projects/<slug>.md /pt-br/blog.md       /pt-br/blog/<slug>.md
 *
 * This is a middleware instead of file-based routes on purpose: Nitro names a
 * param in `[slug].md.ts` as `slug.md` (and passes `foo.md` as its value), so
 * the locale/slug would never resolve. Matching the path here is explicit, and
 * requests that aren't `.md` fall through after a single regex test.
 */
const MARKDOWN_PATH = /^\/(pt-br|en-us)((?:\/[\w-]+)*)\.md$/;
const POST_PATH = /^\/blog\/([\w-]+)$/;
const PROJECT_PATH = /^\/projects\/([\w-]+)$/;

const unavailable = (event: H3Event) => {
  setResponseStatus(event, 503);
  setResponseHeader(event, "Retry-After", 60);
  setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
  return "Temporarily unavailable.\n";
};

export default defineEventHandler(async (event) => {
  if (event.method !== "GET" && event.method !== "HEAD") return;

  const match = MARKDOWN_PATH.exec(event.path.split("?")[0] ?? "");
  if (!match) return;

  const locale = match[1] as LlmLocale;
  const rest = match[2] ?? "";
  const data = await loadSiteData(locale);

  // Backend unreachable: an empty document served as 200 would read as "this
  // person has no content". Tell clients to retry instead.
  const isEmpty =
    !Object.keys(data.blocks).length &&
    !data.projects.length &&
    !data.posts.length;
  if (data.degraded && isEmpty) return unavailable(event);

  const send = (body: string, htmlPath: string) =>
    sendLlmText(event, body, {
      contentType: "text/markdown",
      degraded: data.degraded,
      language: locale,
      canonical: `${data.siteUrl}/${locale}${htmlPath}`,
    });

  switch (rest) {
    case "":
      return send(renderHome(data), "");
    case "/about":
      return send(renderAbout(data), "/about");
    case "/projects":
      return send(renderProjects(data), "/projects");
    case "/blog":
      return send(renderBlogIndex(data), "/blog");
  }

  const projectSlug = PROJECT_PATH.exec(rest)?.[1];
  if (projectSlug) {
    const project = data.projects.find((p) => p.slug === projectSlug);
    if (project) {
      const altLocale: LlmLocale = locale === "pt-br" ? "en-us" : "pt-br";
      const alt = (await loadSiteData(altLocale)).projects.find(
        (p) => p.id === project.id,
      );
      return send(
        renderProject(data, project, alt),
        `/projects/${project.slug}`,
      );
    }
    if (data.degraded) return unavailable(event);
  }

  const slug = POST_PATH.exec(rest)?.[1];
  if (slug) {
    const post = data.posts.find((p) => p.slug === slug);
    if (post) {
      // Slugs are translated, so the other-language twin is matched by id.
      const altLocale: LlmLocale = locale === "pt-br" ? "en-us" : "pt-br";
      const alt = (await loadSiteData(altLocale)).posts.find(
        (p) => p.id === post.id,
      );
      return send(renderPost(data, post, alt), `/blog/${post.slug}`);
    }
    // Couldn't load posts at all: say "try again", not "doesn't exist".
    if (data.degraded) return unavailable(event);
  }

  setResponseStatus(event, 404);
  setResponseHeader(event, "Content-Type", "text/plain; charset=utf-8");
  return "Not found.\n";
});
