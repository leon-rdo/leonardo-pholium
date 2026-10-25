import type { H3Event } from "h3";
import type { Education, Experience } from "@/types/portfolio";
import {
  blockToMarkdown,
  fieldToMarkdown,
  type LlmLocale,
  type LlmPost,
  type LlmProject,
  type LlmSiteData,
} from "./llm-source";

/**
 * Markdown renderers for the LLM-facing endpoints. Output is deliberately plain
 * (headings, bullet lists, links): no styling, no scripts, nothing a model has
 * to strip. Dates are ISO so they read the same in both languages.
 */

const LABELS = {
  "pt-br": {
    tag: "pt-BR",
    otherName: "English",
    home: "Início",
    about: "Sobre",
    projects: "Projetos",
    blog: "Blog",
    articles: "Artigos",
    profile: "Perfil",
    url: "URL",
    language: "Idioma",
    otherVersion: "Versão em inglês",
    quickFacts: "Informações rápidas",
    status: "Status",
    timezone: "Fuso horário",
    languages: "Idiomas",
    openFor: "Aberto a",
    responseTime: "Tempo de resposta",
    stack: "Stack e tecnologias",
    experience: "Experiência profissional",
    education: "Formação",
    featuredProjects: "Projetos em destaque",
    allProjects: "Todos os projetos",
    testimonials: "Depoimentos",
    contact: "Contato",
    email: "E-mail",
    present: "atual",
    period: "Período",
    website: "Site",
    repository: "Repositório",
    technologies: "Tecnologias",
    featured: "Projeto em destaque",
    author: "Autor",
    published: "Publicado em",
    updated: "Atualizado em",
    category: "Categoria",
    tags: "Tags",
    readingTime: "Tempo de leitura",
    minutes: "min",
    noPosts: "Nenhum artigo publicado ainda.",
    summary: "Resumo",
    llmNote:
      "Este arquivo ajuda assistentes de IA a conhecer o site. Toda página tem uma versão em Markdown (acrescente `.md` à URL) e o conteúdo completo está em llms-full.txt. O site é bilíngue (pt-BR e en-US).",
    fullIntro:
      "Conteúdo completo do site em Markdown, em português (pt-BR) e depois em inglês (en-US).",
  },
  "en-us": {
    tag: "en-US",
    otherName: "Português",
    home: "Home",
    about: "About",
    projects: "Projects",
    blog: "Blog",
    articles: "Articles",
    profile: "Profile",
    url: "URL",
    language: "Language",
    otherVersion: "Portuguese version",
    quickFacts: "Quick facts",
    status: "Status",
    timezone: "Timezone",
    languages: "Languages",
    openFor: "Open to",
    responseTime: "Response time",
    stack: "Stack and technologies",
    experience: "Professional experience",
    education: "Education",
    featuredProjects: "Featured projects",
    allProjects: "All projects",
    testimonials: "Testimonials",
    contact: "Contact",
    email: "Email",
    present: "present",
    period: "Period",
    website: "Website",
    repository: "Repository",
    technologies: "Technologies",
    featured: "Featured project",
    author: "Author",
    published: "Published",
    updated: "Updated",
    category: "Category",
    tags: "Tags",
    readingTime: "Reading time",
    minutes: "min",
    noPosts: "No articles published yet.",
    summary: "Summary",
    llmNote:
      "This file helps AI assistants get to know the site. Every page has a Markdown version (append `.md` to the URL) and the full content is in llms-full.txt. The site is bilingual (pt-BR and en-US).",
    fullIntro:
      "Full site content in Markdown, in Portuguese (pt-BR) first and then English (en-US).",
  },
} as const satisfies Record<LlmLocale, Record<string, string>>;

type Labels = (typeof LABELS)["pt-br"] | (typeof LABELS)["en-us"];

const otherLocale = (locale: LlmLocale): LlmLocale =>
  locale === "pt-br" ? "en-us" : "pt-br";

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------

export const pageUrl = (d: LlmSiteData, path = "") =>
  `${d.siteUrl}/${d.locale}${path}`;
export const markdownUrl = (d: LlmSiteData, path = "") =>
  `${pageUrl(d, path)}.md`;
const postPath = (post: { slug: string }) => `/blog/${post.slug}`;
const projectPath = (project: { slug: string }) => `/projects/${project.slug}`;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const block = (d: LlmSiteData, page: string, key: string) =>
  d.blocks[page]?.[key];
const blockText = (d: LlmSiteData, page: string, key: string) =>
  block(d, page, key)?.text?.trim() || "";
const md = (d: LlmSiteData, page: string, key: string) =>
  blockToMarkdown(block(d, page, key), d.siteUrl);

const isoDate = (value?: string | null) => (value ? value.slice(0, 10) : "");
const isoMonth = (value?: string | null) => (value ? value.slice(0, 7) : "");

const period = (
  l: Labels,
  start?: string | null,
  end?: string | null,
  current = false,
) => {
  const from = isoMonth(start);
  const to = current || !end ? l.present : isoMonth(end);
  return from ? `${from} → ${to}` : "";
};

/** Single line, no Markdown-breaking newlines. */
const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

const meta = (items: Array<[label: string, value?: string | null]>) =>
  items
    .filter(([, value]) => !!value)
    .map(([label, value]) => `- ${label}: ${value}`)
    .join("\n");

const joinSections = (sections: Array<string | false | null | undefined>) =>
  sections.filter(Boolean).join("\n\n") + "\n";

const descriptionOf = (d: LlmSiteData, page: string) =>
  blockText(d, page, "seo_description") ||
  (page === "home" ? d.settings?.default_description : "") ||
  d.fallbackDescription;

// ---------------------------------------------------------------------------
// Sections shared by several documents
// ---------------------------------------------------------------------------

function experienceSection(d: LlmSiteData, l: Labels): string {
  if (!d.experiences.length) return "";
  const items = d.experiences.map((e: Experience) => {
    const header = `### ${e.role} — ${e.company}`;
    const line = [period(l, e.start_date, e.end_date, e.current), e.location]
      .filter(Boolean)
      .join(" · ");
    return [header, line, fieldToMarkdown(e.description, d.siteUrl)]
      .filter(Boolean)
      .join("\n\n");
  });
  return `## ${l.experience}\n\n${items.join("\n\n")}`;
}

function educationSection(d: LlmSiteData, l: Labels): string {
  if (!d.educations.length) return "";
  const items = d.educations.map((e: Education) => {
    const header = `### ${e.degree} — ${e.institution}`;
    const line = period(l, e.start_date, e.end_date, !e.end_date);
    return [header, line, fieldToMarkdown(e.description, d.siteUrl)]
      .filter(Boolean)
      .join("\n\n");
  });
  return `## ${l.education}\n\n${items.join("\n\n")}`;
}

function contactSection(d: LlmSiteData, l: Labels): string {
  const email = blockText(d, "home", "contact_email");
  const linkedin = blockText(d, "home", "contact_linkedin");
  const github = blockText(d, "home", "contact_github");
  const body = meta([
    [l.email, email],
    ["LinkedIn", linkedin],
    ["GitHub", github],
  ]);
  return body ? `## ${l.contact}\n\n${body}` : "";
}

function projectSummaryList(d: LlmSiteData, projects: LlmProject[]): string {
  return projects
    .map(
      (p) =>
        `- [${p.title}](${markdownUrl(d, projectPath(p))}): ${oneLine(p.summary || "")}`,
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export function renderHome(d: LlmSiteData): string {
  const l = LABELS[d.locale];
  const alt = otherLocale(d.locale);
  const title =
    blockText(d, "home", "seo_title") ||
    d.settings?.default_title ||
    d.siteName;

  const facts = meta([
    [l.status, blockText(d, "home", "hero_badge")],
    [l.timezone, blockText(d, "home", "contact_timezone")],
    [l.languages, blockText(d, "home", "contact_languages")],
    [l.openFor, blockText(d, "home", "contact_open_for")],
    [l.responseTime, blockText(d, "home", "contact_response")],
  ]);

  const stack = d.skills.map((s) => s.name).filter(Boolean);
  const featured = d.projects.filter((p) => p.featured);

  const testimonials = d.testimonials
    .map((t) => {
      const who = [t.author_name, [t.author_role, t.company].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join(" — ");
      const quote = oneLine(t.text || "");
      return quote ? `> ${quote}\n>\n> — ${who}` : "";
    })
    .filter(Boolean);

  return joinSections([
    `# ${title}`,
    `> ${oneLine(descriptionOf(d, "home"))}`,
    meta([
      [l.url, pageUrl(d)],
      [l.language, l.tag],
      [`${l.otherVersion} (${LABELS[alt].tag})`, `${d.siteUrl}/${alt}`],
    ]),
    md(d, "home", "about_intro") &&
      `## ${blockText(d, "home", "about_title") || l.about}\n\n${md(d, "home", "about_intro")}`,
    facts && `## ${l.quickFacts}\n\n${facts}`,
    stack.length > 0 && `## ${l.stack}\n\n${stack.join(", ")}`,
    experienceSection(d, l),
    educationSection(d, l),
    featured.length > 0 &&
      `## ${l.featuredProjects}\n\n${projectSummaryList(d, featured)}\n\n[${l.allProjects}](${markdownUrl(d, "/projects")})`,
    testimonials.length > 0 && `## ${l.testimonials}\n\n${testimonials.join("\n\n")}`,
    contactSection(d, l),
  ]);
}

export function renderAbout(d: LlmSiteData): string {
  const l = LABELS[d.locale];
  const alt = otherLocale(d.locale);
  const title =
    blockText(d, "about", "seo_title") ||
    blockText(d, "about", "hero_title") ||
    l.about;

  const sections: Array<[titleKey: string, textKey: string]> = [
    ["journey_title", "journey_text"],
    ["values_title", "values_text"],
    ["what_i_do_title", "what_i_do_text"],
  ];

  return joinSections([
    `# ${title}`,
    `> ${oneLine(descriptionOf(d, "about"))}`,
    meta([
      [l.url, pageUrl(d, "/about")],
      [l.language, l.tag],
      [`${l.otherVersion} (${LABELS[alt].tag})`, `${d.siteUrl}/${alt}/about`],
    ]),
    md(d, "about", "intro"),
    ...sections.map(([titleKey, textKey]) => {
      const body = md(d, "about", textKey);
      const heading = blockText(d, "about", titleKey);
      return body && heading ? `## ${heading}\n\n${body}` : body;
    }),
    // Mirrors the HTML page, which now carries experience as well.
    experienceSection(d, l),
    educationSection(d, l),
    contactSection(d, l),
  ]);
}

export function renderProjects(d: LlmSiteData): string {
  const l = LABELS[d.locale];
  const alt = otherLocale(d.locale);
  const title =
    blockText(d, "projects", "seo_title") ||
    blockText(d, "projects", "hero_title") ||
    l.projects;

  const entries = d.projects.map((p) =>
    projectBody(d, l, p, `## ${p.title}`, [l.url, pageUrl(d, projectPath(p))]),
  );

  return joinSections([
    `# ${title}`,
    `> ${oneLine(descriptionOf(d, "projects"))}`,
    meta([
      [l.url, pageUrl(d, "/projects")],
      [l.language, l.tag],
      [`${l.otherVersion} (${LABELS[alt].tag})`, `${d.siteUrl}/${alt}/projects`],
    ]),
    ...entries,
  ]);
}

/** Shared by the /projects list and the /projects/<slug> page. */
function projectBody(
  d: LlmSiteData,
  l: Labels,
  p: LlmProject,
  heading: string,
  urlRow: [string, string],
): string {
  const description = fieldToMarkdown(p.description, d.siteUrl);
  const summary = oneLine(p.summary || "");
  // Descriptions often open with the summary verbatim; don't say it twice.
  const showSummary = summary && !description.startsWith(summary);

  const technologies = (Array.isArray(p.skills) ? p.skills : [])
    .map((s) => (typeof s === "object" ? s.name : ""))
    .filter(Boolean)
    .join(", ");

  return [
    heading,
    showSummary && `> ${summary}`,
    meta([
      urlRow,
      [l.period, period(l, p.start_date, p.end_date, !p.end_date)],
      [l.website, p.website_url],
      [l.repository, p.repo_url],
      [l.technologies, technologies],
      [l.featured, p.featured ? "✓" : ""],
    ]),
    description,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * `altLocaleProject` is the same project (matched by id) in the other
 * language — slugs are translated, so it makes the "other version" link right.
 */
export function renderProject(
  d: LlmSiteData,
  project: LlmProject,
  altLocaleProject?: LlmProject,
): string {
  const l = LABELS[d.locale];
  const alt = otherLocale(d.locale);
  return joinSections([
    projectBody(d, l, project, `# ${project.title}`, [
      l.url,
      pageUrl(d, projectPath(project)),
    ]),
    altLocaleProject &&
      meta([
        [
          `${l.otherVersion} (${LABELS[alt].tag})`,
          `${d.siteUrl}/${alt}${projectPath(altLocaleProject)}`,
        ],
        [l.allProjects, pageUrl(d, "/projects")],
      ]),
  ]);
}

export function renderBlogIndex(d: LlmSiteData): string {
  const l = LABELS[d.locale];
  const alt = otherLocale(d.locale);
  const title = blockText(d, "blog", "page_title") || l.blog;

  const items = d.posts.map((p) => {
    const category = typeof p.category === "object" ? p.category?.name : "";
    const line = [isoDate(p.published_at), category].filter(Boolean).join(" · ");
    return `- [${p.title}](${markdownUrl(d, postPath(p))})${line ? ` (${line})` : ""}: ${oneLine(p.excerpt || "")}`;
  });

  return joinSections([
    `# ${title}`,
    `> ${oneLine(blockText(d, "blog", "page_description") || descriptionOf(d, "blog"))}`,
    meta([
      [l.url, pageUrl(d, "/blog")],
      [l.language, l.tag],
      [`${l.otherVersion} (${LABELS[alt].tag})`, `${d.siteUrl}/${alt}/blog`],
    ]),
    items.length ? items.join("\n") : l.noPosts,
  ]);
}

/**
 * `altLocalePost` is the same post (matched by id) in the other language, which
 * has a different slug — it is what makes the "other version" link correct.
 */
export function renderPost(
  d: LlmSiteData,
  post: LlmPost,
  altLocalePost?: LlmPost,
): string {
  const l = LABELS[d.locale];
  const alt = otherLocale(d.locale);
  const author =
    post.author && typeof post.author === "object"
      ? `${post.author.first_name} ${post.author.last_name}`.trim()
      : d.siteName;
  const category = typeof post.category === "object" ? post.category?.name : "";
  const tags = (post.tags ?? [])
    .map((t) => (typeof t === "object" ? t.name : ""))
    .filter(Boolean)
    .join(", ");

  return joinSections([
    `# ${post.title}`,
    post.excerpt && `> ${oneLine(post.excerpt)}`,
    meta([
      [l.url, pageUrl(d, postPath(post))],
      [l.language, l.tag],
      [l.author, author],
      [l.published, isoDate(post.published_at)],
      [l.updated, isoDate(post.updated_at)],
      [l.category, category],
      [l.tags, tags],
      [l.readingTime, post.reading_time ? `${post.reading_time} ${l.minutes}` : ""],
      altLocalePost
        ? [
            `${l.otherVersion} (${LABELS[alt].tag})`,
            `${d.siteUrl}/${alt}${postPath(altLocalePost)}`,
          ]
        : ["", ""],
    ]),
    fieldToMarkdown(post.body, d.siteUrl),
  ]);
}

// ---------------------------------------------------------------------------
// llms.txt / llms-full.txt
// ---------------------------------------------------------------------------

export function renderLlmsTxt(byLocale: Record<LlmLocale, LlmSiteData>): string {
  const primary = byLocale["pt-br"];
  const name = primary.settings?.site_name || primary.siteName;
  const links = (item: string, url: string, note: string) =>
    `- [${item}](${url})${note ? `: ${oneLine(note)}` : ""}`;

  const localeSections = (Object.keys(byLocale) as LlmLocale[]).flatMap((loc) => {
    const d = byLocale[loc];
    const l = LABELS[loc];
    const notes =
      loc === "pt-br"
        ? {
            home: "Resumo do perfil, stack, experiência, formação, projetos em destaque e contato",
            about: "Trajetória, valores e áreas de atuação",
            projects: "Projetos com descrição completa, tecnologias e links",
            blog: "Índice dos artigos",
          }
        : {
            home: "Profile summary, stack, experience, education, featured projects and contact",
            about: "Background, values and areas of work",
            projects: "Projects with full descriptions, technologies and links",
            blog: "Article index",
          };

    return [
      `## ${l.profile} (${l.tag})\n\n${[
        links(l.home, `${d.siteUrl}/${loc}.md`, notes.home),
        links(l.about, markdownUrl(d, "/about"), notes.about),
        links(l.projects, markdownUrl(d, "/projects"), notes.projects),
        links(l.blog, markdownUrl(d, "/blog"), notes.blog),
      ].join("\n")}`,
      d.projects.length > 0 &&
        `## ${l.projects} (${l.tag})\n\n${projectSummaryList(d, d.projects)}`,
      d.posts.length > 0 &&
        `## ${l.articles} (${l.tag})\n\n${d.posts
          .map((p) => links(p.title, markdownUrl(d, postPath(p)), p.excerpt))
          .join("\n")}`,
    ];
  });

  const home = byLocale["pt-br"];
  const github = blockText(home, "home", "contact_github");
  const linkedin = blockText(home, "home", "contact_linkedin");

  const optional = [
    links("llms-full.txt", `${primary.siteUrl}/llms-full.txt`, "All content above in a single file (pt-BR + en-US)"),
    links("RSS (pt-BR)", `${primary.siteUrl}/api/rss/pt-br.xml`, ""),
    links("RSS (en-US)", `${primary.siteUrl}/api/rss/en-us.xml`, ""),
    links("Sitemap", `${primary.siteUrl}/sitemap.xml`, ""),
    github && links("GitHub", github, ""),
    linkedin && links("LinkedIn", linkedin, ""),
  ].filter(Boolean);

  return joinSections([
    `# ${name}`,
    `> (pt-BR) ${oneLine(descriptionOf(byLocale["pt-br"], "home"))}\n> (en-US) ${oneLine(descriptionOf(byLocale["en-us"], "home"))}`,
    `${LABELS["en-us"].llmNote}\n\n${LABELS["pt-br"].llmNote}`,
    ...localeSections,
    `## Optional\n\n${optional.join("\n")}`,
  ]);
}

export function renderLlmsFullTxt(
  byLocale: Record<LlmLocale, LlmSiteData>,
): string {
  const parts: string[] = [];
  const primary = byLocale["pt-br"];
  parts.push(
    `# ${primary.settings?.site_name || primary.siteName} — llms-full.txt\n\n> ${LABELS["pt-br"].fullIntro}\n> ${LABELS["en-us"].fullIntro}\n`,
  );

  for (const loc of Object.keys(byLocale) as LlmLocale[]) {
    const d = byLocale[loc];
    const altPosts = new Map(byLocale[otherLocale(loc)].posts.map((p) => [p.id, p]));
    parts.push(
      renderHome(d),
      renderAbout(d),
      renderProjects(d),
      renderBlogIndex(d),
      ...d.posts.map((p) => renderPost(d, p, altPosts.get(p.id))),
    );
  }
  return parts.join("\n---\n\n");
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

export function sendLlmText(
  event: H3Event,
  body: string,
  options: {
    contentType: "text/plain" | "text/markdown";
    degraded?: boolean;
    language?: LlmLocale;
    /** HTML page this Markdown mirrors; sent as a canonical hint to search engines. */
    canonical?: string;
  },
): string {
  setResponseHeader(event, "Content-Type", `${options.contentType}; charset=utf-8`);
  setResponseHeader(event, "X-Content-Type-Options", "nosniff");
  setResponseHeader(
    event,
    "Cache-Control",
    options.degraded
      ? "no-store"
      : "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
  );
  if (options.language) {
    setResponseHeader(event, "Content-Language", LABELS[options.language].tag);
  }
  // Tells Googlebot the .md file is a representation of the HTML page, so the
  // two don't compete in the index. Deliberately NOT a noindex: AI crawlers
  // that honour X-Robots-Tag would skip the very files meant for them.
  if (options.canonical) {
    setResponseHeader(event, "Link", `<${options.canonical}>; rel="canonical"`);
  }
  return body;
}
