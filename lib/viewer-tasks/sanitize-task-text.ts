import { MAX_TASK_LENGTH } from "./task-types"

// Strips URLs, HTML, and control characters from viewer-submitted task text, then
// clamps it to MAX_TASK_LENGTH. The card renders this as plain text content (never
// dangerouslySetInnerHTML), so this is defence-in-depth plus on-screen tidiness.

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io|tv|gg|co|me|ly|xyz|dev|app)\b\S*/gi
const HTML_TAG_PATTERN = /<[^>]*>/g
// Zero-width and bidi control characters used to break overlay layout.
const INVISIBLE_PATTERN = /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g

export function sanitizeTaskText(raw: string): string {
  if (!raw) return ""

  let text = raw
    .replace(HTML_TAG_PATTERN, " ")
    .replace(URL_PATTERN, " ")
    .replace(INVISIBLE_PATTERN, "")
    // Neutralise any remaining markup characters.
    .replace(/[<>]/g, "")
    // Collapse all whitespace (including newlines) into single spaces.
    .replace(/\s+/g, " ")
    .trim()

  if (text.length > MAX_TASK_LENGTH) {
    // Trim to the limit, then back off to the last word boundary when that leaves
    // a reasonable amount of text, so words aren't chopped mid-way.
    text = text.slice(0, MAX_TASK_LENGTH)
    const lastSpace = text.lastIndexOf(" ")
    if (lastSpace > MAX_TASK_LENGTH * 0.6) text = text.slice(0, lastSpace)
    text = text.trim()
  }

  return text
}
