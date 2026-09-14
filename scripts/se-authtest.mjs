import { io } from "socket.io-client"
import { createHash } from "crypto"

const raw = process.env.STREAMELEMENTS_JWT_TOKEN || ""
const chan = process.env.STREAMELEMENTS_CHANNEL_ID || ""
const parts = raw.split(".")
let claims = {}
try {
  claims = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"))
} catch {}
const now = Math.floor(Date.now() / 1000)
console.log("[test] fp:", createHash("sha256").update(raw).digest("hex").slice(0, 8))
console.log("[test] exp:", claims.exp, claims.exp ? new Date(claims.exp * 1000).toISOString() : "(none)")
console.log("[test] now:", now, new Date(now * 1000).toISOString())
console.log("[test] expired?:", claims.exp ? claims.exp < now : "no-exp-claim")
console.log("[test] channel claim:", claims.channel, "| env CHANNEL_ID:", chan, "| match:", String(claims.channel) === String(chan))

const socket = io("https://realtime.streamelements.com", { transports: ["websocket"] })
let done = false
const finish = (m) => {
  if (done) return
  done = true
  console.log("[test] RESULT:", m)
  socket.close()
  process.exit(0)
}
socket.on("connect", () => {
  console.log("[test] socket connected, authenticating with jwt...")
  socket.emit("authenticate", { method: "jwt", token: raw })
})
socket.on("authenticated", (d) => finish("AUTHENTICATED OK -> " + JSON.stringify(d)))
socket.on("unauthorized", (d) => finish("UNAUTHORIZED -> " + JSON.stringify(d)))
socket.on("connect_error", (e) => finish("CONNECT_ERROR -> " + e.message))
setTimeout(() => finish("TIMEOUT (no auth response)"), 15000)
