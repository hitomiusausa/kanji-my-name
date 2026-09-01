// Kanji My Name — unlock-code service (Cloudflare Worker)
// Endpoints:
//   GET  /claim?session_id=cs_... -> called by the unlock page after Stripe checkout.
//                                    Verifies payment with Stripe, issues (or re-returns) a unique code.
//   GET  /verify?code=KMN-...     -> called by the site when a buyer enters a code. {ok:true|false}
//   POST /webhook                 -> Stripe webhook (checkout.session.completed).
//                                    Issues the code even if the buyer never opens the unlock page,
//                                    and emails it to the buyer via Resend (once per session).
// Storage (KV binding CODES):
//   code:<CODE>       -> {active, created, session, email}
//   session:<cs_...>  -> <CODE>            (idempotency for /claim and /webhook)
//   emailed:<cs_...>  -> "1"               (the code email was sent for this session)
// Secrets: STRIPE_SECRET_KEY   (restricted key, read-only on Checkout Sessions)
//          STRIPE_WEBHOOK_SECRET (whsec_... signing secret of the webhook endpoint)
//          RESEND_API_KEY      (re_... key; sender domain must be verified in Resend)

const ALLOWED_ORIGINS = [
  "https://hitomiusausa.github.io",
  "https://kanji-my-name.pages.dev",
  "https://kanji.kugainc.com",
];

const MAIL_FROM = "Kanji My Name <kanji@kugainc.com>";
const MAIL_REPLY_TO = "kanjimyname@gmail.com";
const MAIL_BCC = "kanjimyname@gmail.com"; // 販売控え兼・売れた通知
const SITE_URL = "https://kanji.kugainc.com/";

async function issueCode(env, sid, email) {
  const existing = await env.CODES.get("session:" + sid);
  if (existing) return existing;
  const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const code = "KMN-" + raw.match(/.{4}/g).join("-");
  const rec = { active: true, created: new Date().toISOString(), session: sid, email: email || null };
  await env.CODES.put("code:" + code, JSON.stringify(rec));
  await env.CODES.put("session:" + sid, code);
  return code;
}

// Stripe-Signature: t=<ts>,v1=<hmac_sha256(secret, `${ts}.${body}`)>
async function verifyStripeSig(body, header, secret) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // 5 min tolerance
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${body}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

async function sendCodeEmail(env, to, code) {
  const text = [
    "Thank you for getting the Kanji My Name Premium Pack!",
    "",
    "Your unlock code (lifetime, works on any device):",
    "",
    `    ${code}`,
    "",
    "How to unlock:",
    `1. Open ${SITE_URL}`,
    "2. Scroll to The Premium Pack and paste the code",
    "3. Press Unlock — enjoy 4K art, all 13 fonts, transparent backgrounds & exclusive styles",
    "",
    "Keep this email (or jot the code down) somewhere safe.",
    `Lost it? Just reply to this email with your Stripe receipt.`,
  ].join("\n");
  const html = `
  <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#26241e">
    <h2 style="font-weight:600">感謝 — Thank you!</h2>
    <p>Your <b>Kanji My Name Premium Pack</b> is ready. Here is your unlock code — it's yours for life and works on any device:</p>
    <p style="font-family:monospace;font-size:22px;letter-spacing:.08em;border:2px dashed #b89250;padding:14px 18px;text-align:center;background:#faf6ec">${code}</p>
    <ol style="line-height:1.8">
      <li>Open <a href="${SITE_URL}" style="color:#b89250">kanji.kugainc.com</a></li>
      <li>Scroll to <b>The Premium Pack</b> and paste the code</li>
      <li>Press <b>Unlock</b> — enjoy 4K art, all 13 fonts, transparent backgrounds &amp; exclusive styles</li>
    </ol>
    <p style="font-size:13px;color:#7c7462">✍️ Keep this email (or jot the code down) somewhere safe. Lost it? Just reply to this email with your Stripe receipt.</p>
    <p style="font-size:12px;color:#9a927e">Kanji My Name · © KUGA Inc.</p>
  </div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [to],
      bcc: [MAIL_BCC],
      reply_to: MAIL_REPLY_TO,
      subject: "Your Kanji My Name unlock code ✦",
      text, html,
    }),
  });
  return r.ok;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin");
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
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
      const code = await issueCode(env, sid, s.customer_details?.email);
      return json({ ok: true, code });
    }

    if (url.pathname === "/webhook" && req.method === "POST") {
      if (!env.STRIPE_WEBHOOK_SECRET) return new Response("webhook not configured", { status: 503 });
      const body = await req.text();
      const sig = req.headers.get("stripe-signature") || "";
      if (!(await verifyStripeSig(body, sig, env.STRIPE_WEBHOOK_SECRET)))
        return new Response("bad signature", { status: 400 });
      const event = JSON.parse(body);
      if (event.type === "checkout.session.completed") {
        const s = event.data.object;
        if (s.payment_status === "paid") {
          const email = s.customer_details?.email || null;
          const code = await issueCode(env, s.id, email);
          if (email && env.RESEND_API_KEY && !(await env.CODES.get("emailed:" + s.id))) {
            const sent = await sendCodeEmail(env, email, code);
            if (sent) await env.CODES.put("emailed:" + s.id, "1");
          }
        }
      }
      return new Response("ok", { status: 200 }); // 常に200（Stripeの再送ループ防止。冪等なので再送されても安全）
    }

    return json({ ok: false, error: "not found" }, 404);
  },
};
