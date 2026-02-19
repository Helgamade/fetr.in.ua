// Wrapper for Hosting Ukraine webapp manager
const path = require("path");
const fs = require("fs");

// Change to project root first
process.chdir(path.join(__dirname, ".."));

// Load .env.local manually (standalone mode doesn't auto-load it)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
  console.log("[wrapper] Loaded .env.local, keys:", Object.keys(process.env).filter(k => k.startsWith("AUTH") || k.startsWith("GOOGLE") || k.startsWith("NEXT") || k === "DB_HOST").join(", "));
} else {
  console.log("[wrapper] WARNING: .env.local not found at", envPath);
}

// Parse HOST from hosting (may contain protocol like "http://127.1.5.169:3000")
let rawHost = process.env.HOST || "";
console.log("[wrapper] Raw HOST env:", JSON.stringify(rawHost));
let host = rawHost.replace(/^https?:\/\//, "").replace(/:\d+$/, "") || "127.1.5.169";
process.env.HOSTNAME = host;
process.env.PORT = process.env.PORT || "3000";
process.env.NODE_ENV = "production";

// Auth.js v5: trust the reverse proxy host header
process.env.AUTH_TRUST_HOST = "true";
process.env.AUTH_URL = "https://fetr.in.ua";

console.log("[wrapper] Starting with HOSTNAME=" + process.env.HOSTNAME + " PORT=" + process.env.PORT);
console.log("[wrapper] AUTH_TRUST_HOST=" + process.env.AUTH_TRUST_HOST + " AUTH_URL=" + process.env.AUTH_URL);
console.log("[wrapper] GOOGLE_CLIENT_ID set:", !!process.env.GOOGLE_CLIENT_ID);
console.log("[wrapper] NEXTAUTH_SECRET set:", !!process.env.NEXTAUTH_SECRET);

require("../server.js");
