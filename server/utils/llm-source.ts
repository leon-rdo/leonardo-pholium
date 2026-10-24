import { NodeHtmlMarkdown } from "node-html-markdown";
import type { DjangoListResponse } from "@/types/api";
import type { Post } from "@/types/blog";
import type { ContentBlock, SiteSetting, Testimonial } from "@/types/content";
import type { Education, Experience, Project, Skill } from "@/types/portfolio";

/**
 * Data layer behind the LLM-facing endpoints (llms.txt, llms-full.txt and the
 * per-page `.md` versions). Everything is read from the Django backend with the
 * same `Accept-Language` contract as the rest of the site, so these files can
 * never drift from what the HTML pages say.
 */

export const LLM_LOCALES = ["pt-br", "en-us"] as const;
export type LlmLocale = (typeof LLM_LOCALES)[number];

export const isLlmLocale = (value: unknown): value is LlmLocale =>
  (LLM_LOCALES as readonly string[]).includes(value as string);

export type LlmPost = Post<{ category: true; tags: true }>;
export type LlmProject = Project<{ skills: true }>;

export interface LlmSiteData {
  locale: LlmLocale;
  siteUrl: string;
  siteName: string;
  /** Static description from nuxt.config, used only when the backend has none. */
  fallbackDescription: string;
  settings: SiteSetting | null;
  /** page_name -> key -> block */
  blocks: Record<string, Record<string, ContentBlock>>;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  projects: LlmProject[];
  testimonials: Testimonial[];
  posts: LlmPost[];
  /** True when at least one backend call failed: the data is partial. */
  degraded: boolean;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const FETCH_TIMEOUT_MS = 10_000;
/** Bots can be aggressive; one backend round-trip set every few minutes is plenty. */
const CACHE_TTL_MS = 5 * 60_000;
/**
 * Partial (degraded) results are kept only briefly: long enough that a slow or
 * hanging backend isn't hit by every request, short enough to recover quickly.
 */
const DEGRADED_TTL_MS = 30_000;

// ---------------------------------------------------------------------------
// Tiny TTL cache with in-flight de-duplication. Each load decides its own TTL,
// so a backend blip can't pin an empty llms.txt for the full five minutes.
// ---------------------------------------------------------------------------

const cache = new Map<string, { expires: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

async function memoize<T>(
  key: string,
  load: () => Promise<{ value: T; ttlMs: number }>,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expires) return hit.value as T;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = load()
    .then(({ value, ttlMs }) => {
      cache.set(key, { expires: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Backend access
// ---------------------------------------------------------------------------

/**
 * Walks every page of a DRF list endpoint. `next` is an absolute URL whose
 * scheme/host can be wrong behind a proxy (http vs https) — and is untrusted
 * input anyway — so only its path+query are reused, always against `apiBase`.
 */
async function fetchAll<T>(
  apiBase: string,
  locale: LlmLocale,
  path: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const out: T[] = [];
  let url: string | null = path;

  for (let page = 0; url && page < MAX_PAGES; page++) {
    const res: DjangoListResponse<T> = await $fetch(url, {
      baseURL: apiBase,
      params: page === 0 ? { limit: PAGE_SIZE, ...params } : undefined,
      headers: { "Accept-Language": locale },
      timeout: FETCH_TIMEOUT_MS,
    });
    out.push(...(res?.results ?? []));

    if (res?.next) {
      const next = new URL(res.next);
      url = `${next.pathname}${next.search}`;
    } else {
      url = null;
    }
  }
  return out;
}

export function loadSiteData(locale: LlmLocale): Promise<LlmSiteData> {
  return memoize(`site:${locale}`, async () => {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    let failures = apiBase ? 0 : 1;

    const safe = async <T>(path: string, params?: Record<string, unknown>) => {
      if (!apiBase) return [] as T[];
      try {
        return await fetchAll<T>(apiBase, locale, path, params);
      } catch (error: any) {
        failures++;
        console.error(
          `[llm] ${path} (${locale}) failed:`,
          error?.message || error,
        );
        return [] as T[];
      }
    };

    const [
      settingsList,
      blockList,
      experiences,
      educations,
      skills,
      projects,
      testimonials,
      posts,
    ] = await Promise.all([
      // Returned as a one-item paginated list, not a bare object.
      safe<SiteSetting>("/api/site-settings/"),
      safe<ContentBlock>("/api/content-blocks/"),
      safe<Experience>("/api/experiences/", { ordering: "-start_date" }),
      safe<Education>("/api/educations/", { ordering: "-start_date" }),
      safe<Skill>("/api/skills/"),
      safe<LlmProject>("/api/projects/", {
        status: "published",
        expand: "skills",
      }),
      safe<Testimonial>("/api/testimonials/", { ordering: "order" }),
      safe<LlmPost>("/api/posts/published/", {
        ordering: "-published_at",
        expand: "category,author,tags,images",
      }),
    ]);

    const blocks: LlmSiteData["blocks"] = {};
    for (const block of blockList) {
      (blocks[block.page_name] ??= {})[block.key] = block;
    }

    const value: LlmSiteData = {
      locale,
      siteUrl: String(config.public.siteUrl).replace(/\/+$/, ""),
      siteName: config.siteName as string,
      fallbackDescription: config.siteDescription as string,
      settings: settingsList[0] ?? null,
      blocks,
      experiences,
      educations,
      skills,
      projects: projects.sort((a, b) => a.sort_order - b.sort_order),
      testimonials,
      posts,
      degraded: failures > 0,
    };
    return { value, ttlMs: failures === 0 ? CACHE_TTL_MS : DEGRADED_TTL_MS };
  });
}

export async function loadAllLocales(): Promise<Record<LlmLocale, LlmSiteData>> {
  const [ptBr, enUs] = await Promise.all(LLM_LOCALES.map(loadSiteData));
  return { "pt-br": ptBr!, "en-us": enUs! };
}

// ---------------------------------------------------------------------------
// HTML -> Markdown
// ---------------------------------------------------------------------------

const converter = new NodeHtmlMarkdown(
  {
    bulletMarker: "-",
    codeFence: "```",
    maxConsecutiveNewlines: 2,
    ignore: ["script", "style", "noscript"],
  },
  {
    // Embedded videos/widgets are dropped by default; keep them as a link,
    // since "there is a video of the pitch at <url>" is real information.
    iframe: ({ node }) => {
      const src = node.getAttribute("src");
      if (!src) return { ignore: true };
      const label = node.getAttribute("title") || "Embedded content";
      return {
        content: `[${label}](${src})`,
        recurse: false,
        surroundingNewlines: 2,
      };
    },
  },
);

export function htmlToMarkdown(html: string, siteUrl: string): string {
  return (
    converter
      .translate(html)
      // "2022. Com" at the start of a text node is escaped as a list marker
      // ("2022\. Com"); harmless in Markdown but noisy for a model reading it.
      .replace(/(\d)\\\.(?=\s|$)/g, "$1.")
      // Underscores in link targets come out percent-encoded (%5F).
      .replace(/\]\(([^)\s]+)\)/g, (_m, url: string) => {
        const decoded = url.replace(/%5F/gi, "_");
        return `](${decoded.startsWith("/") ? siteUrl + decoded : decoded})`;
      })
      .trim()
  );
}

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*?>/i.test(value);

/** Backend free-text fields are plain text, Markdown-ish text or HTML. */
export function fieldToMarkdown(
  value: string | null | undefined,
  siteUrl: string,
): string {
  const text = (value ?? "").trim();
  if (!text) return "";
  return looksLikeHtml(text) ? htmlToMarkdown(text, siteUrl) : text;
}

export function blockToMarkdown(
  block: ContentBlock | undefined,
  siteUrl: string,
): string {
  if (!block?.text) return "";
  return block.kind === "html"
    ? htmlToMarkdown(block.text, siteUrl)
    : block.text.trim();
}
