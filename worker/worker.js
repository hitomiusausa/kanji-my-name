// Kanji My Name — unlock-code service (Cloudflare Worker)
// Endpoints:
//   GET /claim?session_id=cs_...  -> called by the unlock page after Stripe checkout.
//                                    Verifies payment with Stripe, issues (or re-returns) a unique code.
//   GET /verify?code=KMN-...      -> called by the site when a buyer enters a code. {ok:true|false}
// Storage (KV binding CODES):
//   code:<CODE>       -> {active, created, session, email}
//   session:<cs_...>  -> <CODE>            (makes /claim idempotent)
// Secrets: STRIPE_SECRET_KEY (restricted key, read-only on Checkout Sessions is enough)

const ALLOWED_ORIGIN = "https://hitomiusausa.github.io";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Max-Age": "86400",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const json = (o, s = 200) =>
      new Response(JSON.stringify(o), { status: s, headers: { ...cors, "content-type": "application/json" } });

    if (url.pathname === "/verify") {
      const code = (url.searchParams.get("code") || "").trim().toUpperCase();
      if (!code) return json({ ok: false, error: "missing code" }, 400);
      const rec = await env.CODES.get("code:" + code, "json");
      return json({ ok: !!(rec && rec.active !== false) });
    }

    if (url.pathname === "/claim") {
      const sid = url.searchParams.get("session_id") || "";
      if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) return json({ ok: false, error: "bad session id" }, 400);
      const existing = await env.CODES.get("session:" + sid);
      if (existing) return json({ ok: true, code: existing });
      if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: "service not configured" }, 503);
      const r = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sid), {
        headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY },
      });
      if (!r.ok) return json({ ok: false, error: "stripe lookup failed" }, 502);
      const s = await r.json();
      if (s.payment_status !== "paid") return json({ ok: false, error: "not paid" }, 402);
      const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
      const code = "KMN-" + raw.match(/.{4}/g).join("-");
      const rec = {
        active: true,
        created: new Date().toISOString(),
        session: sid,
        email: s.customer_details?.email || null,
      };
      await env.CODES.put("code:" + code, JSON.stringify(rec));
      await env.CODES.put("session:" + sid, code);
      return json({ ok: true, code });
    }

    return json({ ok: false, error: "not found" }, 404);
  },
};
