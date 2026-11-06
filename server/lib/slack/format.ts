import type { KnownBlock } from "@slack/web-api";

// Cumulative cap for all `markdown` blocks in one message is 12,000 chars.
// Leave headroom for the truncation marker.
const MARKDOWN_LIMIT = 11_900;
const TRUNCATED = "\n\n_…trimmed for length. Ask me for the rest._";
const EMPTY_REPLY = "Hmm, I lost my train of thought. Ask me again?";

/**
 * Clean up common LLM habits that render badly inside a markdown block:
 * leftover Slack mrkdwn links, em dashes (off-voice), and runaway blank lines.
 * Mentions like <@U123>, <#C123> and <!here> are left alone.
 */
const normalize = (md: string): string =>
  md
    .replace(/\r\n?/g, "\n")
    // <https://x.com|text> → [text](https://x.com)
    .replace(/<((?:https?|mailto):[^|>\s]+)\|([^>]+)>/g, "[$2]($1)")
    // bare <https://x.com> → https://x.com
    .replace(/<((?:https?|mailto):[^|>\s]+)>/g, "$1")
    .replace(/\s*—\s*/g, ", ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** Cut at a paragraph or line boundary so we never split mid-list or mid-link. */
const truncate = (md: string): string => {
  if (md.length <= MARKDOWN_LIMIT) return md;
  const budget = MARKDOWN_LIMIT - TRUNCATED.length;
  const head = md.slice(0, budget);
  const cut = Math.max(head.lastIndexOf("\n\n"), head.lastIndexOf("\n"));
  let out = cut > budget * 0.6 ? head.slice(0, cut) : head;
  // Don't leave a code fence open.
  if ((out.match(/```/g) ?? []).length % 2 === 1) out += "\n```";
  return out.trimEnd() + TRUNCATED;
};

/**
 * Turn a Claude reply (standard Markdown) into Block Kit for
 * chat.postMessage / chat.update / say. Always pair with a `text` fallback.
 *
 * Uses Slack's `markdown` block, which is built for LLM output: Slack does the
 * translation, so bold, lists, links, quotes, code, headings and tables render
 * as written. Contract used across listeners: markdownToBlocks(md) => KnownBlock[].
 */
export const markdownToBlocks = (md: string): KnownBlock[] => [
  { type: "markdown", text: truncate(normalize(md)) || EMPTY_REPLY },
];
