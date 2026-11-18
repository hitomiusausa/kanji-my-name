#!/usr/bin/env node
// build-i18n.mjs — /fr/ /it/ /id/ landing pages ("<prénom> en japonais" etc.).
// Policy (2026-11-18): ONE hand-written landing page per language. Do not mass-produce
// translated name pages (thin duplicates could hurt the English site's rankings).
// D-56: the locale name pages (/fr/prenoms/ …, tools/build-locale-names.mjs) are NOT translations:
// they carry the local reading. When tools/locales/<lc>-names.json exists, the grid below lists
// those names and links to their local pages. build-locale-names.mjs runs this script at its end.
// Strings live in tools/i18n-strings.mjs. Kana/kanji come from index.html, extracted the same
// way tools/build-names.mjs does (single-source rule: no dictionaries are copied here).
// Usage: node tools/build-i18n.mjs
// The sitemap entries are written by tools/build-names.mjs (it imports I18N_LANGS).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { I18N_LANGS, LANG_LABELS, STRINGS, LOCALE_NAME_STRINGS } from "./i18n-strings.mjs";
// Shared page CSS/fonts/beacon (also used by the locale name pages) + locale name data (D-56).
import { I18N_CSS as CSS, I18N_FONTS_LINK as FONTS_LINK, CF_BEACON_SNIPPET, LOCALE_DIRS, loadLocaleNames, loadLocaleMeanings, extractEngine, analyzeLocaleName } from "./locale-names-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://kanji.kugainc.com";
const SOCIAL_IMAGE = `${SITE}/image/kanjimyname.png?v=2`;

const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// ---- Generator logic, extracted from index.html (same regexes as build-names.mjs) ----
function extract(re, label) {
  const m = src.match(re);
  if (!m) throw new Error("extract failed: " + label);
  return m[0];
}
const code = [
  extract(/const NAME_DICT=\{.*?\};/s, "NAME_DICT"),
  extract(/Object\.assign\(NAME_DICT,\{.*?\}\);/s, "NAME_DICT special readings"),
  extract(/const PRESERVE_ART_LONG_VOWELS=.*?;/, "preserved art long vowels"),
  extract(/const NAME_SAY=\{.*?\};/s, "NAME_SAY"),
  extract(/const ATEJI\s*=\s*\{[\s\S]*?ATEJI\.ye=ATEJI\.e;/, "ATEJI + aliases"),
  extract(/function nameVariants\([^)]*\)\{[\s\S]*?\n\}/, "nameVariants"),
  extract(/const NAME_KANA=\{.*?\};/s, "NAME_KANA display fixes"),
  extract(/function displayReading\([^)]*\)\{[\s\S]*?\n\}/, "displayReading"),
  extract(/function pinyinTerminalNgReading\([^)]*\)\{[\s\S]*?\n\}/, "Pinyin terminal -ng rule"),
  extract(/function toRomaji\(name[^)]*\)\{[\s\S]*?\n\}/, "toRomaji"),
  extract(/const KANA_MAP=\{[\s\S]*?\};/, "KANA_MAP"),
  extract(/function toKatakana\([^)]*\)\{[\s\S]*?\n\}/, "toKatakana"),
  extract(/function tokenize\(r\)\{[\s\S]*?\n\}/, "tokenize"),
  extract(/const CN_MIN=[\s\S]*?function nameDefaultPicks\([^\n]*\}/, "name profiles"),
  extract(/const APPROX_SYL=\{.*?\};/s, "APPROX_SYL"),
  extract(/function trueSound\([^\n]*\}/, "trueSound"),
  extract(/function pickDefaults\([\s\S]*?\n\}/, "pickDefaults"),
].join("\n");
const { displayReading, toKatakana, nameTokens, nameTokenOptions, nameDefaultPicks } = new Function(
  code + "\nreturn {displayReading,toKatakana,nameTokens,nameTokenOptions,nameDefaultPicks};"
)();

const NAMES = new Set(
  fs.readFileSync(path.join(ROOT, "tools", "names.txt"), "utf8")
    .split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter((s) => /^[a-z]+$/.test(s))
);

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stripTags = (s) => String(s).replace(/<[^>]+>/g, "");
const toHiragana = (k) => k.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Default reading (index 0) only — the same default the name pages and the generator show first.
function analyze(spec) {
  const [slug, label] = spec.split(":");
  const toks = nameTokens(slug, 0);
  if (!toks || !toks.length) throw new Error(`cannot analyze "${slug}"`);
  const variants = toks.map((t) => nameTokenOptions(slug, 0, t));
  const picks = nameDefaultPicks(slug, 0, toks, variants);
  const def = toks.map((t, i) => variants[i][picks[i]]);
  const romaji = displayReading(slug, 0);
  const kata = toKatakana(romaji);
  if (!kata) throw new Error(`no katakana for "${slug}"`);
  return {
    slug, name: label || cap(slug), inList: NAMES.has(slug),
    kata, hira: toHiragana(kata), romaji,
    kanji: def.map(([k]) => k).join(""),
    meanings: def.map(([, m]) => m),
  };
}

// ---- hreflang: identical block on all four pages (index.html carries a hand-copied version) ----
const ALT_URLS = { en: `${SITE}/`, ...Object.fromEntries(I18N_LANGS.map((l) => [l, `${SITE}/${l}/`])) };
const HREFLANG = [
  ...Object.entries(ALT_URLS).map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${u}">`),
  `<link rel="alternate" hreflang="x-default" href="${ALT_URLS.en}">`,
].join("\n");



// The name box hands off to the English generator via its #Name hash. The generator only reads
// a–z, so accents are folded (Chloé → Chloe) and other characters become word breaks.
// D-56: a word that is in this language's locale name list gets "@<lc>" (#Lorenzo@it), so the
// generator uses the local reading (ロレンツォ) instead of the English one.
const FORM_JS = (lang, slugs) => `<script>
document.getElementById("nf").addEventListener("submit",function(e){
  e.preventDefault();
  var i=document.getElementById("ni");
  var v=i.value.replace(/[œŒ]/g,function(c){return c==="œ"?"oe":"Oe"}).replace(/[æÆ]/g,function(c){return c==="æ"?"ae":"Ae"})
    .normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^A-Za-z]+/g," ").trim();
  if(!v){i.focus();return;}
  var LN=${JSON.stringify(slugs)};
  v=v.split(" ").map(function(w){return LN.indexOf(w.toLowerCase())>=0?w+"@${lang}":w}).join(" ");
  // anonymous click count (D-55): event + page language only, never the name
  try{if(navigator.sendBeacon)navigator.sendBeacon("https://kanji-my-name-metrics.hitomiusausa.workers.dev/e?k=lp_cta&s="+document.documentElement.lang)}catch(_){}
  location.href="../#"+encodeURIComponent(v);
});
</script>`;

// D-56 locale names: kanji from the locale "art" romaji, same engine as the generator.
const ENGINE = extractEngine(src);
// How many locale names the landing grid shows (popularity order); the rest are on the list page.
const LOCALE_GRID_MAX = 24;

function pageHtml(lang) {
  const S = STRINGS[lang];
  const LS = LOCALE_NAME_STRINGS[lang];
  const url = ALT_URLS[lang];
  const locDir = LOCALE_DIRS[lang];
  const locMeans = loadLocaleMeanings(ROOT, lang);
  const loc = loadLocaleNames(ROOT, lang).map((n) => analyzeLocaleName(ENGINE, n, locMeans));
  const ex = analyze(S.example);
  // The example uses the locale reading + local page when that name is in the locale list.
  // Its meanings stay English (S.kanjiWhy says they are shown in English).
  const exLoc = loc.find((n) => n.slug === ex.slug);
  if (exLoc) Object.assign(ex, { kata: exLoc.kana, hira: exLoc.hira, romaji: exLoc.romaji, kanji: exLoc.kanji, meanings: exLoc.meaningsEn });
  const exData = { name: esc(ex.name), kata: ex.kata, hira: ex.hira, romaji: ex.romaji, kanji: ex.kanji, mean: esc(ex.meanings.join(" · ")) };
  const exHref = exLoc ? `${locDir}/${exLoc.slug}` : ex.inList ? `../names/${ex.slug}` : `../#${encodeURIComponent(ex.name)}`;
  const grid = S.names.map(analyze);
  for (const g of grid) if (!g.inList) throw new Error(`[${lang}] "${g.slug}" is not in tools/names.txt`);
  if (new Set(grid.map((g) => g.slug)).size !== grid.length) throw new Error(`[${lang}] duplicate name in list`);
  const meanHtml = (ms) => ms.map((m) => (m.en ? `<span lang="en">${esc(m.text)}</span>` : esc(m.text))).join(" · ");
  // Locale grid (links to /<lc>/<dir>/<slug>) once the locale data exists; English grid otherwise.
  const gridBlock = loc.length
    ? `<h2>${esc(LS.gridH2Local)}</h2>
  <p class="grid-note">${LS.gridNoteLocal}</p>
  <div class="ngrid">
    ${loc.slice(0, LOCALE_GRID_MAX).map((g) => `<a class="nc" href="${locDir}/${g.slug}"><span class="nc-name">${esc(g.display)}</span><span class="nc-kana" lang="ja">${esc(g.kana)}</span><span class="nc-kanji" lang="ja">${esc(g.kanji)}</span><span class="nc-mean">${meanHtml(g.meaningsLoc)}</span></a>`).join("\n    ")}
  </div>
  <p class="grid-more"><a href="${locDir}/">${esc(LS.allNamesLink)}</a></p>`
    : `<h2>${esc(S.gridH2)}</h2>
  <p class="grid-note">${S.gridNote}</p>
  <div class="ngrid">
    ${grid.map((g) => `<a class="nc" href="../names/${g.slug}"><span class="nc-name">${esc(g.name)}</span><span class="nc-kana" lang="ja">${esc(g.kata)}</span><span class="nc-kanji" lang="ja">${esc(g.kanji)}</span><span class="nc-mean" lang="en">${esc(g.meanings.join(" · "))}</span></a>`).join("\n    ")}
  </div>`;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: S.ogTitle, inLanguage: S.htmlLang,
        description: S.description, isPartOf: { "@id": `${SITE}/#website` },
        about: { "@id": `${SITE}/#app` },
      },
      {
        "@type": "FAQPage", "@id": `${url}#faq`, inLanguage: S.htmlLang,
        mainEntity: S.faq.map(([q, a]) => ({
          "@type": "Question", name: stripTags(q),
          acceptedAnswer: { "@type": "Answer", text: stripTags(a) },
        })),
      },
    ],
  };
  const langNav = Object.keys(ALT_URLS).map((l) =>
    `<a href="${l === "en" ? "../" : `../${l}/`}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="page"' : ""}>${esc(LANG_LABELS[l])}</a>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="${S.htmlLang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(S.title)}</title>
<meta name="description" content="${esc(S.description)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">
${HREFLANG}
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(S.ogTitle)}">
<meta property="og:description" content="${esc(S.description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kanji My Name">
<meta property="og:locale" content="${S.ogLocale}">
<meta property="og:image" content="${SOCIAL_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="../image/kanjimyname-icon.png?v=2">
${FONTS_LINK}
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${CF_BEACON_SNIPPET}
</head>
<body>
<div class="wrap">
  <div class="top">
    <div class="brand"><a href="../">Kanji My Name</a></div>
    <nav class="langs" aria-label="${esc(S.langNav)}">${langNav}</nav>
  </div>

  <h1>${esc(S.h1)}</h1>
  <p class="lead">${S.lead}</p>

  <form class="namebox" id="nf" action="../" method="get">
    <label for="ni">${esc(S.formLabel)}</label>
    <div class="nb-row">
      <input id="ni" name="n" type="text" autocomplete="given-name" autocapitalize="words" spellcheck="false" maxlength="40" placeholder="${esc(S.placeholder)}" required>
      <button class="cta" type="submit">${esc(S.button)}</button>
    </div>
    <p class="nb-note">${S.formNote}</p>
  </form>

  <h2>${S.scriptsH2(exData)}</h2>
  <dl class="scripts">
    <div class="sc-row"><dt>Katakana</dt><dd><span class="sc-script" lang="ja">${esc(ex.kata)}</span><span class="romaji">(${esc(ex.romaji)})</span><span class="sc-why">${S.kataWhy}</span></dd></div>
    <div class="sc-row"><dt>Hiragana</dt><dd><span class="sc-script" lang="ja">${esc(ex.hira)}</span><span class="sc-why">${S.hiraWhy}</span></dd></div>
    <div class="sc-row"><dt>Kanji</dt><dd><a href="${exHref}" style="text-decoration:none"><span class="sc-script sc-kanji" lang="ja">${esc(ex.kanji)}</span></a><span class="sc-why">${S.kanjiWhy(exData)}</span></dd></div>
  </dl>

  <h2>${esc(S.sayH2)}</h2>
  <p class="body-copy">${S.say}${loc.length ? " " + LS.sayLocal : ""}</p>

  ${gridBlock}

  <h2>${esc(S.faqH2)}</h2>
  ${S.faq.map(([q, a]) => `<div class="qa"><h3>${q}</h3><p>${a}</p></div>`).join("\n  ")}

  <p class="trust">${esc(S.trust)} <a href="../about" hreflang="en">${esc(S.about)}</a> · <a href="../" hreflang="en">${esc(S.toolLink)}</a></p>

  <footer><a href="../" class="flogo" aria-label="Kanji My Name"><img src="../image/kanjilogo-footer.png" alt="Kanji My Name logo" width="84" height="84" loading="lazy"></a><div>Kanji My Name · © <a href="https://kugainc.com/en/" rel="noopener">KUGA Inc.</a> · <a href="../about" hreflang="en">About</a> · <a href="../terms" hreflang="en">Terms</a> · <a href="../tokushoho" hreflang="en">Legal Notice</a></div><div style="margin-top:6px" lang="en">Made in Japan by a native speaker &amp; Japanese-language teacher</div></footer>
</div>
${FORM_JS(lang, loc.map((n) => n.slug))}
</body>
</html>
`;
}

for (const lang of I18N_LANGS) {
  const dir = path.join(ROOT, lang);
  fs.mkdirSync(dir, { recursive: true });
  let html = pageHtml(lang);
  // French typography: no-break space before : ; ? ! » and after «, so they never start a line.
  if (lang === "fr") html = html.replace(/ ([:;?!»])(?=[\s<"])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
  fs.writeFileSync(path.join(dir, "index.html"), html);
  console.log(`wrote ${lang}/index.html`);
}

// index.html keeps a hand-written copy of the hreflang block (a minimal edit to the
// single-file app). Warn if it drifts from the generated one.
for (const line of HREFLANG.split("\n")) {
  if (!src.includes(line)) console.warn("WARN index.html is missing:", line);
}
