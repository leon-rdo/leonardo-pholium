/**
 * Plain-text CMS fields (e.g. a project's `description`) arrive as paragraphs
 * separated by blank lines, with "•"/"-" lines for lists. Rendering them as
 * one `whitespace-pre-line` block lost the structure; this splits them into
 * blocks the template renders as real <p>/<ul>, without any v-html.
 */
export type TextBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: TextListItem[] };

/** `lead` is the short label before an em dash ("Backend — Django REST…"). */
export interface TextListItem {
  lead?: string;
  text: string;
}

const BULLET = /^[•\-*–]\s+/;
const LEAD = /^(.{1,32}?)\s+[—–-]\s+(.+)$/;

const toItem = (line: string): TextListItem => {
  const body = line.replace(BULLET, "");
  const match = LEAD.exec(body);
  return match ? { lead: match[1], text: match[2]! } : { text: body };
};

export const textToBlocks = (text: string): TextBlock[] => {
  const blocks: TextBlock[] = [];
  for (const chunk of text.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    if (lines.every((line) => BULLET.test(line))) {
      const items = lines.map(toItem);
      const last = blocks[blocks.length - 1];
      // Bullets separated by blank lines are still one list.
      if (last?.type === "ul") last.items.push(...items);
      else blocks.push({ type: "ul", items });
    } else {
      blocks.push({ type: "p", text: lines.join(" ") });
    }
  }
  return blocks;
};

/** Rough check for CMS fields that were saved as HTML rather than text. */
export const looksLikeHtml = (text: string) => /<[a-z][\s\S]*>/i.test(text);
