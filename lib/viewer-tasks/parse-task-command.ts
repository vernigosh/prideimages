import type { NormalizedChatMessage } from "@/lib/chat-commands"
import { sanitizeTaskText } from "./sanitize-task-text"

export type ParsedTaskCommand =
  | { type: "task"; task: string }
  | { type: "repeat" }
  | { type: "done" }
  | { type: "hidetask"; targetUserId: string; targetName: string }
  | null

/** !hidetask is a moderation tool, so it is gated on the same badge data the chat
 *  overlay already normalizes. Broadcaster counts as a mod. */
function isModerator(message: NormalizedChatMessage): boolean {
  return message.badges?.moderator === true || message.badges?.broadcaster === true
}

// Parses the three viewer task commands out of an already-normalized chat message.
// Returns null for anything else, including "!task" with no usable text after
// sanitizing (an empty or URL-only submission is ignored rather than confirmed).
export function parseTaskCommand(message: NormalizedChatMessage): ParsedTaskCommand {
  const raw = message.message?.trim()
  if (!raw || !raw.startsWith("!")) return null

  const firstSpace = raw.search(/\s/)
  const commandToken = (firstSpace === -1 ? raw : raw.slice(0, firstSpace)).toLowerCase()
  const rest = firstSpace === -1 ? "" : raw.slice(firstSpace + 1)

  switch (commandToken) {
    case "!task": {
      const task = sanitizeTaskText(rest)
      if (!task) return null
      return { type: "task", task }
    }
    case "!repeat":
      return { type: "repeat" }
    case "!done":
      return { type: "done" }
    case "!hidetask": {
      // Silently ignored for non-mods: no chat reply, so it can't be used to probe
      // who has a task or to spam the channel.
      if (!isModerator(message)) return null
      // Tolerate a leading "@" and any trailing words after the username.
      const targetName = rest.trim().split(/\s+/)[0]?.replace(/^@/, "") ?? ""
      if (!targetName) return null
      return { type: "hidetask", targetUserId: targetName.toLowerCase(), targetName }
    }
    default:
      return null
  }
}
