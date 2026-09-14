import { readFileSync } from "fs"
import { createHash } from "crypto"

const KEY = "STREAMELEMENTS_JWT_TOKEN"
const files = ["/vercel/share/v0-project/.env.development.local", "/vercel/share/v0-project/.env.project"]

for (const f of files) {
  console.log("=== " + f + " ===")
  let txt
  try {
    txt = readFileSync(f, "utf8")
  } catch (e) {
    console.log("  (cannot read: " + e.code + ")")
    continue
  }
  const lines = txt.split("\n")
  let hits = 0
  lines.forEach((line, i) => {
    if (!line.startsWith(KEY + "=")) return
    hits++
    let val = line.slice(KEY.length + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    const fp = createHash("sha256").update(val).digest("hex").slice(0, 8)
    let exp = "(no exp)"
    try {
      const c = JSON.parse(Buffer.from(val.split(".")[1], "base64").toString("utf8"))
      exp = c.exp ? c.exp + " (" + new Date(c.exp * 1000).toISOString().slice(0, 10) + ")" : "(no exp claim)"
    } catch {
      exp = "(undecodable)"
    }
    console.log("  line " + (i + 1) + ": fp=" + fp + " len=" + val.length + " exp=" + exp)
  })
  console.log("  total " + KEY + " lines: " + hits)
}
