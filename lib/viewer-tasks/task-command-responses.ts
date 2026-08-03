// Every outgoing chat confirmation string for the viewer task system lives here so
// the wording stays consistent and is easy to tweak without touching hook logic.

export function taskAddedResponse(displayName: string, task: string): string {
  return `Task added, ${displayName}: ${task}`
}

export function taskRepeatResponse(displayName: string, task: string): string {
  return `You're continuing, ${displayName}: ${task}`
}

export function noPreviousTaskResponse(displayName: string): string {
  return `${displayName}, you don't have a previous task yet. Use !task followed by your task.`
}

export function taskCompletedResponse(displayName: string, count: number): string {
  const noun = count === 1 ? "task" : "tasks"
  return `Great work, ${displayName}! You've completed ${count} ${noun} today!`
}

export function noTaskToCompleteResponse(displayName: string): string {
  return `${displayName}, you don't currently have a task to complete.`
}

/** Mod-only !hidetask. Deliberately neutral: it does not repeat the removed text
 *  back into chat, which would defeat the point of removing it. */
export function taskHiddenResponse(targetName: string): string {
  return `Removed ${targetName}'s task from the rotation.`
}

export function nothingToHideResponse(targetName: string): string {
  return `${targetName} doesn't have a task on screen right now.`
}
