// locale-names-lib.mjs — shared helpers for the FR/IT/ID locale name pages (D-56).
// Pure functions + file loaders, no side effects on import, so build-names.mjs (sitemap owner),
// build-i18n.mjs (landing grids) and build-locale-names.mjs (pages) can all import it.
//
// Data (source of truth): tools/locales/<lc>-names.json and <lc>-meanings.json
// (format: _local/locale-names-spec-20261118.md §1).
import fs from "node:fs";
import path from "node:path";

export const LOCALES = ["fr", "it", "id"];
// URL folder under /<lc>/ — /fr/prenoms/<slug>, /it/nomi/<slug>, /id/nama/<slug>
export const LOCALE_DIRS = { fr: "prenoms", it: "nomi", id: "nama" };

const locFile = (root, lc, kind) => path.join(root, "tools", "locales", `${lc}-${kind}.json`);

// Returns [] when the file does not exist yet (the landing page then keeps its English grid).
export function loadLocaleNames(root, lc) {
  const f = locFile(root, lc, "names");
  if (!fs.existsSync(f)) return [];
  const data = JSON.parse(fs.readFileSync(f, "utf8"));
  if (!Array.isArray(data)) throw new Error(`${path.basename(f)}: expected an array`);
  return data;
}
export function loadLocaleMeanings(root, lc) {
  const f = locFile(root, lc, "meanings");
  if (!fs.existsSync(f)) return {};
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

// Every public URL of the locale name pages (list page first). Used by build-names.mjs for the sitemap.
export function localeNameUrls(root, site) {
  const out = [];
  for (const lc of LOCALES) {
    const names = loadLocaleNames(root, lc);
    if (!names.length) continue;
    const base = `${site}/${lc}/${LOCALE_DIRS[lc]}/`;
    out.push(base, ...names.map((n) => base + n.slug));
  }
  return out;
}

// Generator logic extracted from index.html (single-source rule: no dictionary is copied).
// Only what a locale word needs: its kanji come from tokenize(art) + pickDefaults, exactly like
// wordTokens()/wordDefaultPicks() in index.html.
export function extractEngine(src) {
  const ex = (re, label) => {
    const m = src.match(re);
    if (!m) throw new Error("extract failed: " + label);
    return m[0];
  };
  const code = [
    ex(/const ATEJI\s*=\s*\{[\s\S]*?ATEJI\.ye=ATEJI\.e;/, "ATEJI + aliases"),
    ex(/function tokenize\(r\)\{[\s\S]*?\n\}/, "tokenize"),
    ex(/const APPROX_SYL=\{.*?\};/s, "APPROX_SYL"),
    ex(/function trueSound\([^\n]*\}/, "trueSound"),
    ex(/function pickDefaults\([\s\S]*?\n\}/, "pickDefaults"),
  ].join("\n");
  return new Function(code + "\nreturn {ATEJI,tokenize,trueSound,pickDefaults};")();
}

export const toHiragana = (k) => k.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

// One locale name → everything a page / card needs. `meanings` maps English gloss → local gloss;
// a missing gloss falls back to English and is flagged (the page then says so).
export function analyzeLocaleName(engine, n, meanings) {
  const { ATEJI, tokenize, pickDefaults } = engine;
  const toks = tokenize(n.art);
  const variants = toks.map((t) => ATEJI[t]);
  // optional curated defaults (validated in build-locale-names.mjs): one kanji per token
  const picks = n.defaults ? n.defaults.map((k, i) => variants[i].findIndex(([kk]) => kk === k)) : pickDefaults(toks);
  const loc = (en) => (meanings[en] ? { text: meanings[en], en: false } : { text: en, en: true });
  const def = toks.map((t, i) => variants[i][picks[i]]);
  return {
    ...n,
    hira: toHiragana(n.kana),
    toks, variants, picks,
    kanji: def.map(([k]) => k).join(""),
    meaningsEn: def.map(([, m]) => m),
    meaningsLoc: def.map(([, m]) => loc(m)),
    locMeaning: loc,
    combos: variants.reduce((a, o) => a * o.length, 1),
  };
}

// Hash for the generator CTA: accents folded (Chloé → Chloe) + @lc (index.html parseHashWord).
export const foldName = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z]+/g, "");
export const generatorHash = (n, lc) => encodeURIComponent(`${foldName(n.display)}@${lc}`);

// ---- Shared look of the /fr/ /it/ /id/ pages (moved verbatim from build-i18n.mjs) ----
// Same (empty) Cloudflare Web Analytics gate as build-names.mjs — set both together.
const CF_BEACON_TOKEN = "";
export const CF_BEACON_SNIPPET = `<script>(function(){var CF_BEACON_TOKEN="${CF_BEACON_TOKEN}";if(!CF_BEACON_TOKEN)return;var s=document.createElement("script");s.type="module";s.src="https://static.cloudflareinsights.com/beacon.min.js";s.setAttribute("data-cf-beacon",JSON.stringify({token:CF_BEACON_TOKEN}));document.head.appendChild(s);})();</script>`;

export const I18N_CSS = `
:root{--bg:#131310;--panel:#1a1a16;--line:#35332a;--ink:#e8e2d5;--head:#f0ead9;--gold:#b89250;--muted:#8f897b;--seal:#c73e2c;
--washi:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 .9 0 0 0 .05 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Inter',sans-serif;line-height:1.7;position:relative}
body::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 60% 40% at 78% 8%,rgba(232,226,213,.045),transparent 70%),radial-gradient(ellipse 46% 34% at -6% 86%,rgba(199,62,44,.04),transparent 72%),var(--washi)}
.wrap{max-width:920px;margin:0 auto;padding:0 20px;position:relative;z-index:1}
.top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 20px;padding:34px 0 0}
.brand{font-family:'Space Grotesk',sans-serif;font-size:12px;letter-spacing:.5em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:12px}
.brand::before{content:"印";font-family:'Yuji Syuku',serif;font-size:13px;color:#fdf6ea;background:var(--seal);width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:3px;transform:rotate(3deg);letter-spacing:0}
.brand a{color:inherit;text-decoration:none}
.langs{display:flex;flex-wrap:wrap;gap:4px 14px;font-family:'Space Grotesk',sans-serif;font-size:12px;letter-spacing:.06em}
.langs a{color:var(--muted);text-decoration:none;padding:4px 0;border-bottom:1px solid transparent}
.langs a:hover{color:var(--ink)}
.langs a[aria-current]{color:var(--gold);border-bottom-color:var(--gold)}
h1{font-family:'Shippori Mincho',serif;font-weight:700;font-size:clamp(32px,5.4vw,50px);line-height:1.2;margin:26px 0 10px;color:var(--head)}
h2{font-family:'Shippori Mincho',serif;font-size:clamp(21px,3vw,25px);line-height:1.35;color:var(--head);margin:48px 0 14px}
p{margin:10px 0}
.lead{color:rgba(232,226,213,.82);max-width:680px;font-size:16px}
.lead b{color:var(--head);font-weight:600}
.namebox{margin:28px 0 0;padding:22px;border:1px solid var(--line);background:rgba(26,26,22,.82);max-width:680px}
.namebox label{display:block;font-family:'Space Grotesk',sans-serif;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.nb-row{display:flex;flex-wrap:wrap;gap:10px}
.nb-row input{flex:1 1 220px;min-width:0;background:#0f0f0c;border:1px solid var(--line);color:var(--head);font-family:'Inter',sans-serif;font-size:18px;padding:13px 14px;border-radius:0}
.nb-row input:focus{outline:2px solid var(--gold);outline-offset:1px;border-color:var(--gold)}
.cta{flex:0 1 auto;display:inline-block;background:#15150f;color:var(--gold);border:1px solid var(--gold);font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;letter-spacing:.1em;text-transform:uppercase;padding:15px 22px;text-decoration:none;cursor:pointer;position:relative;overflow:hidden;z-index:0;transition:color .2s}
.cta::before{content:"";position:absolute;inset:0;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.3,0,.2,1);z-index:-1}
.cta:hover,.cta:focus-visible{color:#131310}
.cta:hover::before,.cta:focus-visible::before{transform:scaleX(1)}
@media(prefers-reduced-motion:reduce){.cta::before{transition:none}}
@media(max-width:480px){.cta{flex:1 1 100%}}
.nb-note{font-size:13px;color:var(--muted);margin:12px 0 0}
.nb-note b{color:var(--ink);font-weight:600}
.scripts{margin:0;display:grid;max-width:760px}
.sc-row{display:grid;grid-template-columns:110px minmax(0,1fr);gap:4px 18px;align-items:baseline;padding:14px 0;border-bottom:1px solid var(--line)}
.sc-row:first-child{border-top:1px solid var(--line)}
.sc-row dt{font-family:'Space Grotesk',sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
.sc-row dd{margin:0;font-size:14px;line-height:1.75;color:rgba(232,226,213,.78)}
.sc-script{font-family:'Shippori Mincho',serif;font-size:26px;color:var(--head);margin-right:.4em}
.sc-kanji{font-family:'Yuji Syuku',serif}
.romaji{color:var(--muted);font-size:13px}
.sc-why{display:block;margin-top:4px}
@media(max-width:480px){.sc-row{grid-template-columns:1fr}}
.body-copy{max-width:720px;color:rgba(232,226,213,.82)}
.ngrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin:18px 0 0}
.nc{display:block;border:1px solid var(--line);background:rgba(26,26,22,.82);padding:14px 14px 12px;text-decoration:none;color:var(--ink);transition:border-color .15s}
.nc:hover,.nc:focus-visible{border-color:var(--gold)}
.nc-name{display:block;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;color:var(--head)}
.nc-kana{display:block;font-family:'Shippori Mincho',serif;font-size:16px;color:rgba(232,226,213,.8);margin-top:2px}
.nc-kanji{display:block;font-family:'Yuji Syuku',serif;font-size:26px;line-height:1.3;color:var(--head);margin-top:6px;overflow-wrap:anywhere}
.nc-mean{display:block;font-size:11.5px;line-height:1.5;color:var(--muted);margin-top:4px}
.grid-note{font-size:13px;color:var(--muted);max-width:720px}
.grid-more{margin:16px 0 0;font-size:14px}
.grid-more a{color:var(--gold)}
.qa{border-bottom:1px solid var(--line);padding:16px 0;max-width:760px}
.qa h3{font-family:'Inter',sans-serif;font-size:15.5px;font-weight:600;color:var(--head);margin-bottom:4px}
.qa p{color:rgba(232,226,213,.72);font-size:14.5px;margin:0}
.trust{margin:44px 0 0;padding:18px 0 0;border-top:1px solid var(--line);font-size:14px;color:rgba(232,226,213,.8)}
.trust a{color:var(--gold)}
footer{border-top:1px solid var(--line);margin-top:40px;padding:24px 0 40px;color:var(--muted);font-size:13px;text-align:center}
footer a{color:var(--gold)}
.flogo{display:inline-block;margin-bottom:12px}
.flogo img{width:84px;height:84px;display:block;opacity:.92}
`;

export const I18N_FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&family=Yuji+Syuku&family=Space+Grotesk:wght@400;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">`;
