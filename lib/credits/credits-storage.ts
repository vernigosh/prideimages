// Durable slice of the end-of-stream credits.
//
// StreamElements aggregates (follows, subs, gift subs, tips, bits, raids, merch,
// charity, redeems) used to live purely in React state inside useStreamElements.
// A single OBS refresh mid-stream wiped all of it, so the credits roll ran with
// empty Followers/Raiders/Tippers/Cheerers sections while the sections fed from
// Neon (guardians) and localStorage (flower totals) survived and looked fine.
// That asymmetry is exactly what made the bug look like a missing DB migration.
//
// Unlike the garden, credits are NOT keyed by calendar date: streams regularly
// run past local midnight, and rolling credits must not truncate at 00:00. They
// instead expire after a long idle gap, which cheaply approximates "a new stream
// started" without needing an explicit start signal.
//
// Mirrors lib/garden/flower-storage.ts in structure and defensive parsing.

export const CREDITS_STORAGE_KEY = "verniStreamCreditsVersion1"
export const CREDITS_STORAGE_VERSION = 1

/** Idle gap after which stored credits are treated as belonging to a finished
 *  stream. Long enough to survive intermissions, technical difficulties, and a
 *  full OBS restart; short enough that yesterday's follows never leak into
 *  today's roll. */
export const CREDITS_IDLE_EXPIRY_MS = 5 * 60 * 60 * 1000 // 5 hours

export interface StoredCredits {
  followers: string[]
  subscribers: Array<{ name: string; months: number; tier: string; gifted: boolean; gifter?: string }>
  giftSubs: Array<{ gifter: string; count: number }>
  tippers: Array<{ name: string; amount: number }>
  cheerers: Array<{ name: string; bits: number }>
  raiders: Array<{ name: string; viewers: number }>
  merchBuyers: Array<{ name: string; items: string[]; amount: number }>
  charityDonors: Array<{ name: string; amount: number }>
  redeemers: Array<{ name: string; redeems: string[] }>
}

interface PersistedCreditsData {
  version: 1
  /** Time of the most recent write, used for idle expiry. */
  updatedAt: number
  credits: StoredCredits
}

export function emptyCredits(): StoredCredits {
  return {
    followers: [],
    subscribers: [],
    giftSubs: [],
    tippers: [],
    cheerers: [],
    raiders: [],
    merchBuyers: [],
    charityDonors: [],
    redeemers: [],
  }
}

// --- defensive field coercion -------------------------------------------------
// Rebuild every entry rather than trusting the blob. A corrupted amount would
// otherwise flow straight into the credits totals shown on stream.

const str = (v: unknown): string | null => {
  if (typeof v !== "string") return null
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : null
}

const num = (v: unknown, { min = 0 }: { min?: number } = {}): number | null => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min) return null
  return v
}

const strArray = (v: unknown): string[] => {
  if (!Array.isArray(v)) return []
  return v.map(str).filter((s): s is string => s !== null)
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function parseCredits(raw: unknown): StoredCredits {
  const c = (raw ?? {}) as Record<string, unknown>
  const out = emptyCredits()

  // Followers: de-duplicated, order preserved.
  const seenFollowers = new Set<string>()
  for (const name of strArray(c.followers)) {
    const key = name.toLowerCase()
    if (seenFollowers.has(key)) continue
    seenFollowers.add(key)
    out.followers.push(name)
  }

  for (const e of arr(c.subscribers)) {
    const o = e as Record<string, unknown>
    const name = str(o.name)
    if (!name) continue
    out.subscribers.push({
      name,
      months: num(o.months, { min: 0 }) ?? 1,
      tier: str(o.tier) ?? "1000",
      gifted: o.gifted === true,
      gifter: str(o.gifter) ?? undefined,
    })
  }

  for (const e of arr(c.giftSubs)) {
    const o = e as Record<string, unknown>
    const gifter = str(o.gifter)
    const count = num(o.count, { min: 1 })
    if (!gifter || count === null) continue
    out.giftSubs.push({ gifter, count: Math.floor(count) })
  }

  for (const e of arr(c.tippers)) {
    const o = e as Record<string, unknown>
    const name = str(o.name)
    const amount = num(o.amount, { min: 0 })
    if (!name || amount === null) continue
    out.tippers.push({ name, amount })
  }

  for (const e of arr(c.cheerers)) {
    const o = e as Record<string, unknown>
    const name = str(o.name)
    const bits = num(o.bits, { min: 0 })
    if (!name || bits === null) continue
    out.cheerers.push({ name, bits: Math.floor(bits) })
  }

  for (const e of arr(c.raiders)) {
    const o = e as Record<string, unknown>
    const name = str(o.name)
    if (!name) continue
    out.raiders.push({ name, viewers: Math.floor(num(o.viewers, { min: 0 }) ?? 0) })
  }

  for (const e of arr(c.merchBuyers)) {
    const o = e as Record<string, unknown>
    const name = str(o.name)
    if (!name) continue
    out.merchBuyers.push({
      name,
      items: strArray(o.items),
      amount: num(o.amount, { min: 0 }) ?? 0,
    })
  }

  for (const e of arr(c.charityDonors)) {
    const o = e as Record<string, unknown>
    const name = str(o.name)
    const amount = num(o.amount, { min: 0 })
    if (!name || amount === null) continue
    out.charityDonors.push({ name, amount })
  }

  for (const e of arr(c.redeemers)) {
    const o = e as Record<string, unknown>
    const name = str(o.name)
    if (!name) continue
    const redeems = strArray(o.redeems)
    if (redeems.length === 0) continue
    out.redeemers.push({ name, redeems })
  }

  return out
}

/** Reads persisted credits, discarding them when the idle window has elapsed or
 *  the payload is malformed. Guarded for SSR and for OBS profiles with storage
 *  denied. */
export function loadCredits(now = Date.now()): StoredCredits {
  if (typeof window === "undefined") return emptyCredits()

  try {
    const raw = window.localStorage.getItem(CREDITS_STORAGE_KEY)
    if (!raw) return emptyCredits()

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return emptyCredits()

    const candidate = parsed as Partial<PersistedCreditsData>
    if (candidate.version !== CREDITS_STORAGE_VERSION) return emptyCredits()

    const updatedAt = num(candidate.updatedAt, { min: 1 })
    if (updatedAt === null) return emptyCredits()
    // Stale (previous stream) or a clock that moved backwards past the window.
    if (now - updatedAt > CREDITS_IDLE_EXPIRY_MS) return emptyCredits()

    return parseCredits(candidate.credits)
  } catch {
    return emptyCredits()
  }
}

export function saveCredits(credits: StoredCredits, now = Date.now()): void {
  if (typeof window === "undefined") return
  try {
    const payload: PersistedCreditsData = {
      version: CREDITS_STORAGE_VERSION,
      updatedAt: now,
      credits,
    }
    window.localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage unavailable (private mode / quota). Credits stay in memory only.
  }
}

/** Wipes stored credits, for an explicit reset at the top of a stream. */
export function clearCredits(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(CREDITS_STORAGE_KEY)
  } catch {
    // Nothing else to do.
  }
}

/** True when there is nothing worth persisting, so the very first render doesn't
 *  write an empty payload and refresh the idle timestamp for a dead stream. */
export function isEmptyCredits(c: StoredCredits): boolean {
  return (
    c.followers.length === 0 &&
    c.subscribers.length === 0 &&
    c.giftSubs.length === 0 &&
    c.tippers.length === 0 &&
    c.cheerers.length === 0 &&
    c.raiders.length === 0 &&
    c.merchBuyers.length === 0 &&
    c.charityDonors.length === 0 &&
    c.redeemers.length === 0
  )
}
