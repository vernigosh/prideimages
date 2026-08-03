"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { NormalizedChatMessage } from "@/lib/chat-commands"
import { getClockState, type WorkCyclePhase } from "@/lib/work-cycle"
import { parseTaskCommand } from "@/lib/viewer-tasks/parse-task-command"
import {
  noPreviousTaskResponse,
  noTaskToCompleteResponse,
  nothingToHideResponse,
  taskAddedResponse,
  taskCompletedResponse,
  taskHiddenResponse,
  taskRepeatResponse,
} from "@/lib/viewer-tasks/task-command-responses"
import {
  createViewerTask,
  TASK_COMMAND_COOLDOWN_MS,
  type DisplayedTask,
  type TaskCommandResponse,
  type ViewerTask,
  type ViewerTaskState,
} from "@/lib/viewer-tasks/task-types"
import { useTaskRotation } from "./use-task-rotation"
import { useViewerTaskStorage } from "./use-viewer-task-storage"

interface UseViewerTasksOptions {
  /** Fires for every generated confirmation, whether or not it reached Twitch. */
  onTaskCommandResponse?: (response: TaskCommandResponse) => void
  /** Send confirmations through the StreamElements bot. Default true. */
  sendToChat?: boolean
}

interface ProcessOptions {
  /** Debug-panel simulations pass false so they never post to real chat. */
  sendToChat?: boolean
  /** Debug panel only: fire commands back-to-back without waiting out the cooldown. */
  bypassCooldown?: boolean
}

const EMPTY_STATE: ViewerTaskState = { tasksByUser: {}, rotationOrder: [], enabled: true }

// Reuses the same authenticated bot route the work timer already uses for its
// FOCUS TIME / BREAK TIME announcements.
async function sendChatMessage(message: string) {
  try {
    await fetch("/api/send-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
  } catch (error) {
    console.error("[v0] Failed to send task confirmation:", error)
  }
}

export function useViewerTasks({ onTaskCommandResponse, sendToChat = true }: UseViewerTasksOptions = {}) {
  const [state, setState] = useState<ViewerTaskState>(EMPTY_STATE)
  // Phase comes from the same wall-clock helper the work timer renders, then follows
  // the timer's own transition events. No second timer state is created here.
  const [phase, setPhase] = useState<WorkCyclePhase>(() =>
    typeof window === "undefined" ? "work" : getClockState().currentPhase,
  )

  const stateRef = useRef(state)
  stateRef.current = state
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const sendToChatRef = useRef(sendToChat)
  sendToChatRef.current = sendToChat
  const responseCbRef = useRef(onTaskCommandResponse)
  responseCbRef.current = onTaskCommandResponse

  /** Twitch message ids already handled, mirroring the id-based dedup the chat
   *  overlay relies on. Trimmed so it can't grow without bound in a long stream. */
  const seenMessageIds = useRef<Set<string>>(new Set())
  const cooldowns = useRef<Map<string, number>>(new Map())

  const handleRollover = useCallback(() => {
    setState((prev) => {
      const tasksByUser: Record<string, ViewerTask> = {}
      for (const [key, user] of Object.entries(prev.tasksByUser)) {
        tasksByUser[key] = { ...user, completedToday: 0 }
      }
      return { ...prev, tasksByUser }
    })
  }, [])

  const { hydrate, persist, clear } = useViewerTaskStorage(handleRollover)

  // Restore yesterday-proof counts and lastTask values after an OBS refresh.
  useEffect(() => {
    const users = hydrate()
    if (Object.keys(users).length === 0) return
    setState((prev) => {
      const tasksByUser = { ...prev.tasksByUser }
      for (const [key, saved] of Object.entries(users)) {
        const existing = tasksByUser[key] ?? createViewerTask(key, key, undefined, Date.now())
        tasksByUser[key] = {
          ...existing,
          lastTask: saved.lastTask ?? existing.lastTask,
          completedToday: saved.completedToday,
        }
      }
      return { ...prev, tasksByUser }
    })
  }, [hydrate])

  // Persist only the durable slice.
  useEffect(() => {
    const users = Object.entries(state.tasksByUser).reduce<
      Record<string, { lastTask: string | null; completedToday: number }>
    >((acc, [key, user]) => {
      if (user.lastTask || user.completedToday > 0) {
        acc[key] = { lastTask: user.lastTask, completedToday: user.completedToday }
      }
      return acc
    }, {})
    persist(users)
  }, [state.tasksByUser, persist])

  const emitResponse = useCallback((userId: string, displayName: string, message: string) => {
    const response: TaskCommandResponse = { userId, displayName, message, timestamp: Date.now() }
    responseCbRef.current?.(response)
    if (sendToChatRef.current) void sendChatMessage(message)
  }, [])

  /** Handles one normalized chat message. Safe to call from the live chat listener
   *  or the debug panel. */
  const processTaskChatEvent = useCallback(
    (message: NormalizedChatMessage, options: ProcessOptions = {}) => {
      const current = stateRef.current
      if (!current.enabled) return
      if (message.isBot) return

      // Dedup on the Twitch message id.
      if (message.id) {
        if (seenMessageIds.current.has(message.id)) return
        seenMessageIds.current.add(message.id)
        if (seenMessageIds.current.size > 500) {
          seenMessageIds.current = new Set(Array.from(seenMessageIds.current).slice(-250))
        }
      }

      const parsed = parseTaskCommand(message)
      if (!parsed) return

      const displayName = message.username || "Unknown"
      const userId = displayName.toLowerCase()
      const now = Date.now()

      // --- Mod moderation path ---------------------------------------------------
      // !hidetask acts on ANOTHER user, so it deliberately runs before the
      // per-viewer cooldown (mods must be able to act immediately, and repeatedly)
      // and never creates a task record for the mod who ran it.
      if (parsed.type === "hidetask") {
        const previous = sendToChatRef.current
        if (options.sendToChat !== undefined) sendToChatRef.current = options.sendToChat
        try {
          const target = current.tasksByUser[parsed.targetUserId]
          if (!target?.currentTask) {
            emitResponse(userId, displayName, nothingToHideResponse(parsed.targetName))
            return
          }
          // Clear lastTask/lastWorkTask as well as currentTask: leaving them set
          // would let the offender restore the exact removed text with !repeat,
          // which would defeat the moderation. completedToday is intentionally
          // preserved — this removes a message, it is not a punishment.
          const cleared: ViewerTask = {
            ...target,
            currentTask: null,
            lastTask: null,
            lastWorkTask: null,
            status: "cleared",
          }
          const next: ViewerTaskState = {
            ...current,
            tasksByUser: { ...current.tasksByUser, [parsed.targetUserId]: cleared },
            rotationOrder: current.rotationOrder.filter((id) => id !== parsed.targetUserId),
          }
          stateRef.current = next
          setState(next)
          emitResponse(userId, displayName, taskHiddenResponse(target.displayName || parsed.targetName))
        } finally {
          sendToChatRef.current = previous
        }
        return
      }

      if (!options.bypassCooldown) {
        const lastUsed = cooldowns.current.get(userId) ?? 0
        if (now - lastUsed < TASK_COMMAND_COOLDOWN_MS) return
        cooldowns.current.set(userId, now)
      }

      const previousSend = sendToChatRef.current
      if (options.sendToChat !== undefined) sendToChatRef.current = options.sendToChat

      try {
        const existing =
          current.tasksByUser[userId] ?? createViewerTask(userId, displayName, message.color, now)
        const user: ViewerTask = { ...existing, displayName, usernameColor: message.color || existing.usernameColor }
        const isWork = phaseRef.current === "work"

        let next: ViewerTaskState = current
        let responseText: string | null = null

        if (parsed.type === "task") {
          const updated: ViewerTask = {
            ...user,
            currentTask: parsed.task,
            lastTask: parsed.task,
            status: isWork ? "active" : "queued",
            submittedAt: now,
          }
          const rotationOrder = isWork
            ? current.rotationOrder.includes(userId)
              ? current.rotationOrder
              : [...current.rotationOrder, userId]
            : current.rotationOrder.filter((id) => id !== userId)
          next = { ...current, tasksByUser: { ...current.tasksByUser, [userId]: updated }, rotationOrder }
          responseText = taskAddedResponse(displayName, parsed.task)
        } else if (parsed.type === "repeat") {
          const source = user.lastTask ?? user.lastWorkTask
          if (!source) {
            responseText = noPreviousTaskResponse(displayName)
          } else {
            const updated: ViewerTask = {
              ...user,
              currentTask: source,
              lastTask: source,
              status: isWork ? "active" : "queued",
              submittedAt: user.currentTask === source ? user.submittedAt : now,
            }
            const rotationOrder = isWork
              ? current.rotationOrder.includes(userId)
                ? current.rotationOrder
                : [...current.rotationOrder, userId]
              : current.rotationOrder.filter((id) => id !== userId)
            next = { ...current, tasksByUser: { ...current.tasksByUser, [userId]: updated }, rotationOrder }
            responseText = taskRepeatResponse(displayName, source)
          }
        } else {
          // !done — allowed during work, and during a break for the task carried out
          // of the work period that just ended.
          const completed = user.currentTask ?? user.lastWorkTask
          if (!completed) {
            responseText = noTaskToCompleteResponse(displayName)
          } else {
            const updated: ViewerTask = {
              ...user,
              currentTask: null,
              lastWorkTask: null,
              lastTask: completed,
              status: "cleared",
              completedToday: user.completedToday + 1,
            }
            next = {
              ...current,
              tasksByUser: { ...current.tasksByUser, [userId]: updated },
              rotationOrder: current.rotationOrder.filter((id) => id !== userId),
            }
            responseText = taskCompletedResponse(displayName, updated.completedToday)
          }
        }

        if (next !== current) {
          stateRef.current = next
          setState(next)
        }
        if (responseText) emitResponse(userId, displayName, responseText)
      } finally {
        sendToChatRef.current = previousSend
      }
    },
    [emitResponse],
  )

  // --- Incoming chat: reuse the existing normalized event queue ----------------
  // chat-integration.tsx dispatches every message as `overlayChatMessage`; the chat
  // overlay already listens to the same event. No second StreamElements client.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<NormalizedChatMessage>).detail
      if (detail) processTaskChatEvent(detail)
    }
    window.addEventListener("overlayChatMessage", handler)
    return () => window.removeEventListener("overlayChatMessage", handler)
  }, [processTaskChatEvent])

  /** Break: clear the visible rotation but keep everything !repeat and !done need. */
  const beginBreak = useCallback(() => {
    setPhase("break")
    setState((prev) => {
      const tasksByUser: Record<string, ViewerTask> = {}
      for (const [key, user] of Object.entries(prev.tasksByUser)) {
        tasksByUser[key] = user.currentTask
          ? { ...user, currentTask: null, lastWorkTask: user.currentTask, lastTask: user.currentTask, status: "cleared" }
          : user
      }
      return { ...prev, tasksByUser, rotationOrder: [] }
    })
  }, [])

  /** Work: promote tasks queued during the break; leave unfinished ones behind. */
  const beginWork = useCallback(() => {
    setPhase("work")
    setState((prev) => {
      const tasksByUser: Record<string, ViewerTask> = {}
      const promoted: ViewerTask[] = []
      for (const [key, user] of Object.entries(prev.tasksByUser)) {
        if (user.status === "queued" && user.currentTask) {
          const active: ViewerTask = { ...user, status: "active", lastWorkTask: null }
          tasksByUser[key] = active
          promoted.push(active)
        } else {
          tasksByUser[key] = { ...user, lastWorkTask: null }
        }
      }
      promoted.sort((a, b) => a.submittedAt - b.submittedAt)
      return { ...prev, tasksByUser, rotationOrder: promoted.map((u) => u.userId) }
    })
  }, [])

  // Follow the work timer's existing transition events.
  useEffect(() => {
    const onWork = () => beginWork()
    const onBreak = () => beginBreak()
    window.addEventListener("workCycleStart", onWork)
    window.addEventListener("breakStart", onBreak)
    return () => {
      window.removeEventListener("workCycleStart", onWork)
      window.removeEventListener("breakStart", onBreak)
    }
  }, [beginWork, beginBreak])

  // --- Controls ---------------------------------------------------------------
  const enableTaskSystem = useCallback(() => setState((p) => ({ ...p, enabled: true })), [])
  const disableTaskSystem = useCallback(
    () => setState((p) => ({ ...p, enabled: false, rotationOrder: [] })),
    [],
  )

  const clearCurrentTasks = useCallback(() => {
    setState((prev) => {
      const tasksByUser: Record<string, ViewerTask> = {}
      for (const [key, user] of Object.entries(prev.tasksByUser)) {
        tasksByUser[key] = { ...user, currentTask: null, status: "cleared" }
      }
      return { ...prev, tasksByUser, rotationOrder: [] }
    })
  }, [])

  const removeUserTask = useCallback((userId: string) => {
    const key = userId.toLowerCase()
    setState((prev) => {
      const user = prev.tasksByUser[key]
      if (!user) return prev
      return {
        ...prev,
        tasksByUser: { ...prev.tasksByUser, [key]: { ...user, currentTask: null, status: "cleared" } },
        rotationOrder: prev.rotationOrder.filter((id) => id !== key),
      }
    })
  }, [])

  /** Full wipe, including persisted counts. Never called automatically on a break. */
  const resetDailyTaskData = useCallback(() => {
    cooldowns.current.clear()
    seenMessageIds.current.clear()
    clear()
    setState((prev) => ({ tasksByUser: {}, rotationOrder: [], enabled: prev.enabled }))
  }, [clear])

  // --- Derived display state --------------------------------------------------
  const rotationActive = state.enabled && phase === "work" && state.rotationOrder.length > 0
  const { currentUserId, advance } = useTaskRotation(state.rotationOrder, rotationActive)

  const displayedTask: DisplayedTask | null = useMemo(() => {
    if (!rotationActive || !currentUserId) return null
    const user = state.tasksByUser[currentUserId]
    if (!user?.currentTask) return null
    return {
      userId: user.userId,
      displayName: user.displayName,
      usernameColor: user.usernameColor,
      task: user.currentTask,
    }
  }, [rotationActive, currentUserId, state.tasksByUser])

  const showBreakPrompt = state.enabled && phase === "break"

  return {
    displayedTask,
    showBreakPrompt,
    phase,
    enabled: state.enabled,
    activeTaskCount: state.rotationOrder.length,
    tasksByUser: state.tasksByUser,
    processTaskChatEvent,
    advanceRotation: advance,
    enableTaskSystem,
    disableTaskSystem,
    clearCurrentTasks,
    removeUserTask,
    resetDailyTaskData,
    simulateWorkStart: beginWork,
    simulateBreakStart: beginBreak,
  }
}
