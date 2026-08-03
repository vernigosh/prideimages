// Single source of truth for the 25/5 work-cycle phase.
//
// The cycle is derived purely from the wall clock (work x:00-x:25 and x:30-x:55,
// breaks at x:25-x:30 and x:55-x:00), so every consumer that calls getClockState()
// agrees without any shared React state. components/work-timer.tsx renders it and
// owns the transition events; hooks/use-viewer-tasks.ts reads the same function for
// its initial phase and then follows those events. Do not re-implement this math.

export const WORK_DURATION = 25 * 60
export const SHORT_BREAK = 5 * 60

export type WorkCyclePhase = "work" | "break"

export interface WorkCycleState {
  currentPhase: WorkCyclePhase
  remaining: number
  cycle: number
}

export function getClockState(): WorkCycleState {
  const now = new Date()
  const minutesIntoBlock = now.getMinutes() % 30
  const totalSecondsIntoBlock = minutesIntoBlock * 60 + now.getSeconds()

  let currentPhase: WorkCyclePhase
  let remaining: number

  if (totalSecondsIntoBlock < WORK_DURATION) {
    currentPhase = "work"
    remaining = WORK_DURATION - totalSecondsIntoBlock
  } else {
    currentPhase = "break"
    const secondsIntoBreak = totalSecondsIntoBlock - WORK_DURATION
    remaining = Math.max(SHORT_BREAK - secondsIntoBreak, 0)
  }

  // Cycle resets each half-hour block
  const blockIndex = Math.floor(now.getMinutes() / 30)
  const cycle = now.getHours() * 2 + blockIndex + 1

  return { currentPhase, remaining, cycle }
}
