// kanji-my-name-metrics — anonymous button-click counter (D-55, 2026-11-18).
// Stores ONLY daily totals per (event, surface). No names, no IP, no cookies, no user agent.
// Client: navigator.sendBeacon(`${URL}/e?k=<event>&s=<surface>`). Read: tools/metrics-report.sh
const EVENTS = new Set(["gen", "hash_gen", "dl_free", "dl_4k", "share", "buy_click", "unlock_ok", "np_cta", "lp_cta"]);
const SURFACES = new Set(["home", "names", "fr", "it", "id"]);
const ORIGINS = new Set(["https://kanji.kugainc.com", "https://kanji-my-name.pages.dev", "https://hitomiusausa.github.io"]);
const TTL_SECONDS = 400 * 24 * 3600; // keep ~13 months of daily totals

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const cors = { "Access-Control-Allow-Origin": ORIGINS.has(origin) ? origin : "https://kanji.kugainc.com", "Vary": "Origin" };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "POST", "Access-Control-Max-Age": "86400" } });
    if (url.pathname !== "/e" || req.method !== "POST") return new Response("not found", { status: 404, headers: cors });
    if (origin && !ORIGINS.has(origin)) return new Response(null, { status: 204, headers: cors }); // ignore foreign origins silently
    const k = url.searchParams.get("k"), s = url.searchParams.get("s");
    if (!EVENTS.has(k) || !SURFACES.has(s)) return new Response(null, { status: 204, headers: cors });
    const day = new Date().toISOString().slice(0, 10); // UTC day
    const key = `c:${day}:${k}:${s}`;
    // KV is eventually consistent: simultaneous hits can lose a count. Fine for trend reading at this volume.
    const n = parseInt((await env.METRICS.get(key)) || "0", 10) + 1;
    await env.METRICS.put(key, String(n), { expirationTtl: TTL_SECONDS });
    return new Response(null, { status: 204, headers: cors });
  },
};
