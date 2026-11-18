#!/usr/bin/env node
// build-app-i18n.mjs — the ONLY writer of fr/index.html, it/index.html, id/index.html.
//
// Each locale top page = the full generator from index.html (single source), with every UI string
// swapped for that language, followed by the locale landing sections (three scripts, pronunciation,
// locale name grid, FAQ — built by tools/build-i18n.mjs → landingParts()).
//
// How strings are found in index.html (English stays inline as the default):
//   HTML  data-i18n="key"                 → the element's innerHTML is replaced
//         data-i18n-attr="attr:key;…"     → those attribute values are replaced
//   JS    /* app-ui:start */ … /* app-ui:end */ block: const PAGE_LC / UI / GLOSS
//         (UI = app strings for the JS, GLOSS = English gloss → local gloss, PAGE_LC = "fr" …)
//   <!-- en-only:start --> … <!-- en-only:end -->  English FAQ, replaced by the landing sections
// Strings: tools/app-strings.mjs (APP_STRINGS.en must equal what index.html contains — the build
// fails on drift, so edit both together). h1/title/description/og come from STRINGS[lc]
// (tools/i18n-strings.mjs, proofread landing copy). Glosses: tools/locales/<lc>-meanings.json.
//
// BUILD ORDER (whenever index.html, tools/app-strings.mjs, tools/i18n-strings.mjs or tools/locales/*
// change):
//   1. node tools/build-locale-names.mjs  rewrites the LOCALE_NAMES block in index.html + /fr/prenoms …
//                                         and at its end runs tools/build-i18n.mjs, which only
//                                         delegates to THIS script (so fr/index.html has one writer)
//   2. node tools/build-names.mjs         English /names/ + sitemap (touches only en-only parts of
//                                         index.html: the popular-names row)
//   3. node tools/build-app-i18n.mjs      (again — cheap and idempotent; picks up step 2)
//   4. node tools/test-romaji.mjs && node tools/test-app-i18n.mjs   0 failed
// Usage: node tools/build-app-i18n.mjs [--check]   (--check = validate, write nothing)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_STRINGS } from "./app-strings.mjs";
import { STRINGS, I18N_LANGS, LANG_LABELS } from "./i18n-strings.mjs";
import { langSwitcher, loadLocaleMeanings } from "./locale-names-lib.mjs";
import { landingParts, LANDING_CSS, ALL_GLOSSES } from "./build-i18n.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://kanji.kugainc.com";
const CHECK_ONLY = process.argv.includes("--check");
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escAttr = (s) => String(s).replace(/&(?![a-z]+;|#\d+;)/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
// French typography: no-break space before : ; ? ! » and after « (same rule as the landing pages).
export const frTypo = (s) => String(s).replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« ");
// Price as people write it in each language (display only — the Stripe amount is in the Payment Link).
// index.html keeps PRICE = "$X.YY"; the locale page shows fr/it "X,YY $", id "US$X,YY".
export const PRICE_FMT = {
  fr: (whole, cents) => `${whole},${cents} $`,
  it: (whole, cents) => `${whole},${cents} $`,
  id: (whole, cents) => `US$${whole},${cents}`,
};

// ---- 1. find every data-i18n element / data-i18n-attr in index.html ----
const VOID = new Set(["input", "img", "br", "meta", "link"]);
export function findI18n(html) {
  const out = [];
  const openRe = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let m;
  while ((m = openRe.exec(html))) {
    const tag = m[1].toLowerCase(), open = m[0];
    const key = (open.match(/\sdata-i18n="([^"]+)"/) || [])[1];
    const attrs = (open.match(/\sdata-i18n-attr="([^"]+)"/) || [])[1];
    if (!key && !attrs) continue;
    const el = { tag, key, attrs: attrs ? attrs.split(";").map((p) => p.split(":")) : [], openStart: m.index, openEnd: m.index + open.length };
    if (key) {
      if (VOID.has(tag)) throw new Error(`data-i18n on void <${tag}>`);
      // balanced search for the matching close tag
      const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
      re.lastIndex = el.openEnd;
      let depth = 1, c;
      while ((c = re.exec(html))) {
        depth += c[1] ? -1 : 1;
        if (!depth) { el.closeStart = c.index; el.closeEnd = c.index + c[0].length; break; }
      }
      if (el.closeStart === undefined) throw new Error(`no closing </${tag}> for data-i18n="${key}"`);
      el.inner = html.slice(el.openEnd, el.closeStart);
    }
    el.attrVals = Object.fromEntries(el.attrs.map(([a, k]) => [k, (open.match(new RegExp(`\\s${a}="([^"]*)"`)) || [])[1]]));
    out.push(el);
  }
  return out;
}

const UI_BLOCK = /(\/\* app-ui:start \*\/\n)([\s\S]*?)(\n\/\* app-ui:end \*\/)/;
export function readUiBlock(html) {
  const m = html.match(UI_BLOCK);
  if (!m) throw new Error("index.html: app-ui markers missing");
  const ui = m[2].match(/^const UI=(\{.*\});$/m);
  if (!ui) throw new Error("index.html: const UI={…}; (one line, JSON) missing in the app-ui block");
  return JSON.parse(ui[1]);
}

// English as it stands in index.html: { key: value } for HTML keys + JS keys.
export function extractEnglish(html) {
  const en = {}, kinds = {};
  for (const el of findI18n(html)) {
    if (el.key) { en[el.key] = el.inner; kinds[el.key] = "html"; }
    for (const [, k] of el.attrs) { en[k] = el.attrVals[k].replace(/&quot;/g, '"').replace(/&amp;/g, "&"); kinds[k] = "attr"; }
  }
  for (const [k, v] of Object.entries(readUiBlock(html))) { en[k] = v; kinds[k] = "js"; }
  return { en, kinds };
}

const { en: EN_IN_INDEX, kinds: KINDS } = extractEnglish(src);
if (process.argv.includes("--print-en")) { console.log(JSON.stringify(EN_IN_INDEX, null, 2)); process.exit(0); }

// ---- 2. validate tools/app-strings.mjs against index.html ----
const problems = [];
const enKeys = Object.keys(EN_IN_INDEX);
for (const k of enKeys) {
  if (!(k in APP_STRINGS.en)) problems.push(`app-strings en is missing "${k}"`);
  else if (APP_STRINGS.en[k] !== EN_IN_INDEX[k]) problems.push(`app-strings en["${k}"] differs from index.html:\n      index: ${JSON.stringify(EN_IN_INDEX[k])}\n      table: ${JSON.stringify(APP_STRINGS.en[k])}`);
}
for (const lc of ["en", ...I18N_LANGS]) {
  const T = APP_STRINGS[lc];
  if (!T) { problems.push(`app-strings has no "${lc}" table`); continue; }
  for (const k of Object.keys(T)) if (!(k in EN_IN_INDEX)) problems.push(`app-strings ${lc}["${k}"] is not used by index.html`);
  if (lc === "en") continue;
  for (const k of enKeys) {
    if (typeof T[k] !== "string") { problems.push(`app-strings ${lc} is missing "${k}"`); continue; }
    // placeholders must survive translation
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join(",");
    if (ph(T[k]) !== ph(EN_IN_INDEX[k])) problems.push(`app-strings ${lc}["${k}"] placeholders ${ph(T[k])} ≠ en ${ph(EN_IN_INDEX[k])}`);
    // element ids inside HTML values must survive too (JS writes into them)
    const ids = (s) => (s.match(/\sid="[^"]+"/g) || []).sort().join(",");
    if (ids(T[k]) !== ids(EN_IN_INDEX[k])) problems.push(`app-strings ${lc}["${k}"] lost an element id (${ids(EN_IN_INDEX[k])})`);
  }
}
if (problems.length) {
  console.error(`✗ build-app-i18n: ${problems.length} problem(s)\n  ` + problems.join("\n  "));
  process.exit(1);
}

// ---- 3. glosses: report what each locale still shows in English ----
const missingGloss = {};
for (const lc of I18N_LANGS) {
  const m = loadLocaleMeanings(ROOT, lc);
  missingGloss[lc] = ALL_GLOSSES.filter((g) => !m[g]);
}

// ---- 4. page assembly ----
// Relative URLs in index.html point at the site root; the locale page lives one folder down.
function fixPaths(html) {
  return html
    .replace(/(\s(?:href|src)=")(?!https?:|#|mailto:|\/|data:|\.\.\/)([^"]*)"/g, (_, a, u) => `${a}${u === "./" ? "../" : "../" + u}"`)
    .replace(/url\('(fonts\/[^']+)'\)/g, "url('../$1')");
}
function replaceOnce(html, re, rep, label) {
  if (!re.test(html)) throw new Error(`index.html: cannot find ${label}`);
  return html.replace(re, rep);
}

function pageHtml(lc) {
  const typo = lc === "fr" ? frTypo : (s) => s;
  // title / description / og:* / h1 get the same French typography as the body text
  const S = Object.fromEntries(Object.entries(STRINGS[lc]).map(([k, v]) => [k, ["title", "description", "ogTitle", "h1"].includes(k) ? typo(v) : v]));
  const T = Object.fromEntries(Object.entries(APP_STRINGS[lc]).map(([k, v]) => [k, KINDS[k] === "attr" && k.endsWith("_href") ? v : typo(v)]));
  const url = `${SITE}/${lc}/`;
  const { ld, sections } = landingParts(lc);

  let html = fixPaths(src);
  // i18n attributes/innerHTML — after fixPaths, so *_href values are used as written (relative to /<lc>/)
  const els = findI18n(html);
  for (const el of els.reverse()) {
    let open = html.slice(el.openStart, el.openEnd);
    for (const [a, k] of el.attrs) open = open.replace(new RegExp(`(\\s${a}=")[^"]*(")`), (_, p, q) => p + escAttr(T[k]) + q);
    const body = el.key ? T[el.key] : null;
    html = el.key
      ? html.slice(0, el.openStart) + open + body + html.slice(el.closeStart)
      : html.slice(0, el.openStart) + open + html.slice(el.openEnd);
  }
  // JS strings + glosses + page language
  const gloss = Object.fromEntries(Object.entries(loadLocaleMeanings(ROOT, lc)).map(([k, v]) => [k, typo(v)]));
  const jsUI = Object.fromEntries(Object.keys(T).filter((k) => KINDS[k] === "js").map((k) => [k, T[k]]));
  html = html.replace(UI_BLOCK, (_, a, _b, c) => `${a}const PAGE_LC=${JSON.stringify(lc)};\nconst UI=${JSON.stringify(jsUI)};\nconst GLOSS=${JSON.stringify(gloss)};${c}`);

  // price display (the JS constant feeds every {price} toast; the span is the Premium box before JS runs)
  const pm = src.match(/const PRICE = "\$(\d+)\.(\d{2})";/);
  if (!pm) throw new Error('index.html: const PRICE = "$X.YY"; not found');
  const price = PRICE_FMT[lc](pm[1], pm[2]);
  html = replaceOnce(html, /const PRICE = "\$\d+\.\d{2}";/, () => `const PRICE = ${JSON.stringify(price)};`, "const PRICE");
  html = replaceOnce(html, /(<span id="priceVal">)[^<]*(<\/span>)/, (_, a, b) => a + esc(price) + b, "#priceVal");

  // <head>
  html = replaceOnce(html, /<html lang="en">/, `<html lang="${S.htmlLang}">`, "<html lang>");
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${esc(S.title)}</title>`, "<title>");
  html = replaceOnce(html, /(<meta name="description" content=")[^"]*(")/, `$1${esc(S.description)}$2`, "meta description");
  html = replaceOnce(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, "canonical");
  html = replaceOnce(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, "og:url");
  html = replaceOnce(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${esc(S.ogTitle)}$2`, "og:title");
  html = replaceOnce(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${esc(S.description)}$2`, "og:description");
  html = replaceOnce(html, /(<meta property="og:locale" content=")[^"]*(")/, `$1${S.ogLocale}$2`, "og:locale");
  html = replaceOnce(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(S.ogTitle)}$2`, "twitter:title");
  html = replaceOnce(html, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(S.description)}$2`, "twitter:description");
  html = replaceOnce(html, /<!-- hreflang:[^>]*-->\n/, "", "hreflang comment");
  html = replaceOnce(html, /<script type="application\/ld\+json">\n[\s\S]*?\n<\/script>/, () => `<script type="application/ld+json">\n${ld}\n</script>`, "JSON-LD");
  html = replaceOnce(html, /<\/head>/, `<style>/* locale landing sections (tools/build-i18n.mjs LANDING_CSS, scoped to .lp) */\n${LANDING_CSS}</style>\n</head>`, "</head>");

  // header: proofread landing H1 + language switcher with this language current
  html = replaceOnce(html, /<h1>[\s\S]*?<\/h1>/, `<h1>${esc(S.h1)}</h1>`, "<h1>");
  html = replaceOnce(html, /<nav class="langs"[^>]*>[\s\S]*?<\/nav>/, langSwitcher("../", lc), "language switcher");
  // footer language line: the other three languages
  const others = ["en", ...I18N_LANGS].filter((l) => l !== lc)
    .map((l) => `<a href="../${l === "en" ? "" : l + "/"}" hreflang="${l}" lang="${l}" style="color:var(--gold)">${esc(LANG_LABELS[l])}</a>`).join(" · ");
  html = replaceOnce(html, /(<div style="margin-top:6px" id="ftLangs">)[\s\S]*?(<\/div><\/footer>)/, `$1${others}$2`, "footer languages");

  // English FAQ → locale landing sections
  html = replaceOnce(html, /<!-- en-only:start[^>]*-->[\s\S]*?<!-- en-only:end -->/, () => `<section class="lp" id="about-${lc}">\n${sections}\n  </section>`, "en-only markers");
  return html;
}

const written = [], stale = [];
for (const lc of I18N_LANGS) {
  const html = pageHtml(lc);
  const out = path.join(ROOT, lc, "index.html");
  if (CHECK_ONLY) { if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== html) stale.push(`${lc}/index.html`); }
  else {
    fs.mkdirSync(path.join(ROOT, lc), { recursive: true });
    fs.writeFileSync(path.join(ROOT, lc, "index.html"), html);
  }
  written.push(`${lc}/index.html`);
}
const todo = I18N_LANGS.map((lc) => `${lc} ${enKeys.filter((k) => APP_STRINGS[lc][k] === APP_STRINGS.en[k]).length}`).join(", ");
console.log(`${CHECK_ONLY ? "checked" : "wrote"} ${written.join(", ")} — ${enKeys.length} UI keys; same as English (TODO or brand): ${todo}`);
console.log("glosses without a translation (shown in English): " + I18N_LANGS.map((lc) => `${lc} ${missingGloss[lc].length}/${ALL_GLOSSES.length}`).join(", "));
if (stale.length) { console.error(`✗ out of date: ${stale.join(", ")} — run node tools/build-app-i18n.mjs`); process.exit(1); }
