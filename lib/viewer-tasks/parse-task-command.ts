import type { NormalizedChatMessage } from "@/lib/chat-commands"
import { sanitizeTaskText } from "./sanitize-task-text"

export type ParsedTaskCommand =
  | { type: "task"; task: string }
  | { type: "repeat" }
  | { type: "done" }
  | null

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
    default:
      return null
  }
}
