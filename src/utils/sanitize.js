import DOMPurify from "dompurify";

/**
 * Allowlist-based HTML sanitizer for rendered markdown (reviews, AI
 * summaries, syllabus content).
 *
 * Deny-by-default: only plain formatting / structure tags survive. Links
 * (<a>) are intentionally NOT allowed — that kills javascript:, data:,
 * vbscript: and every other href pseudo-protocol vector at the root,
 * instead of chasing protocols via a blocklist.
 */
const ALLOWED_TAGS = [
  // inline text
  "p", "br", "strong", "b", "em", "i", "u", "s", "del", "strike",
  "sub", "sup", "code", "span", "mark",
  // structure
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "hr",
];

const ALLOWED_ATTR = ["class", "align", "colspan", "rowspan"];

export const sanitize = (html) =>
  DOMPurify.sanitize(html, {
    // Pure allowlist — no USE_PROFILES, which would re-import html
    // profile tags (a, img, …) on top of ALLOWED_TAGS.
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Content of stripped elements (e.g. link text) is kept as plain text.
    KEEP_CONTENT: true,
  });

export default { sanitize };
