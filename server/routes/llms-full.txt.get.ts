import { loadAllLocales } from "../utils/llm-source";
import { renderLlmsFullTxt, sendLlmText } from "../utils/llm-render";

/**
 * /llms-full.txt — the whole site (home, about, projects, every article) in one
 * Markdown file, pt-BR first and then en-US, for assistants that prefer one
 * fetch over crawling.
 */
export default defineEventHandler(async (event) => {
  const byLocale = await loadAllLocales();
  return sendLlmText(event, renderLlmsFullTxt(byLocale), {
    contentType: "text/plain",
    degraded: Object.values(byLocale).some((d) => d.degraded),
  });
});
