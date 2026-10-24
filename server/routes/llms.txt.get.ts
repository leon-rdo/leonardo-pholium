import { loadAllLocales } from "../utils/llm-source";
import { renderLlmsTxt, sendLlmText } from "../utils/llm-render";

/**
 * /llms.txt — llmstxt.org index for AI assistants: who this site is about and a
 * link (to the Markdown version) of every page, project and article.
 * Always 200: with the backend down it degrades to the static links.
 */
export default defineEventHandler(async (event) => {
  const byLocale = await loadAllLocales();
  return sendLlmText(event, renderLlmsTxt(byLocale), {
    contentType: "text/plain",
    degraded: Object.values(byLocale).some((d) => d.degraded),
  });
});
