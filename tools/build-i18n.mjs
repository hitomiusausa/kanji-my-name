#!/usr/bin/env node
// build-i18n.mjs — the /fr/ /it/ /id/ LANDING SECTIONS ("<prénom> en japonais" etc.).
// Policy (2026-11-18): ONE hand-written landing text per language. Do not mass-produce
// translated name pages (thin duplicates could hurt the English site's rankings).
//
// Since 2026-11-19 the /fr/ /it/ /id/ top page is the full generator in that language
// (tools/build-app-i18n.mjs, the ONLY writer of <lc>/index.html). This module no longer writes
// files: it exports landingParts(lc) — the sections shown BELOW the generator (three scripts,
// pronunciation note, locale name grid → /fr/prenoms/…, FAQ, trust line) + their JSON-LD —
// and LANDING_CSS (the landing look, scoped to .lp so it cannot touch the generator).
// Running it directly (`node tools/build-i18n.mjs`, as tools/build-locale-names.mjs does at its
// end) just runs tools/build-app-i18n.mjs, so old build steps keep working with one writer.
//
// D-56: the locale name pages (/fr/prenoms/ …, tools/build-locale-names.mjs) carry the local
// reading; the grid below lists those names and links to their local pages.
// Strings live in tools/i18n-strings.mjs. Kana/kanji come from index.html, extracted the same
// way tools/build-names.mjs does (single-source rule: no dictionaries are copied here).
// The sitemap entries are written by tools/build-names.mjs (it imports I18N_LANGS).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { I18N_LANGS, STRINGS, LOCALE_NAME_STRINGS } from "./i18n-strings.mjs";
// Shared landing CSS + locale name data (D-56).
import { I18N_CSS, LOCALE_DIRS, loadLocaleNames, loadLocaleMeanings, extractEngine, analyzeLocaleName } from "./locale-names-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://kanji.kugainc.com";

// ---- CLI: delegate to the single writer ----
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  execFileSync(process.execPath, [path.join(ROOT, "tools", "build-app-i18n.mjs"), ...process.argv.slice(2)], { stdio: "inherit" });
  process.exit(0);
}

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
const { ATEJI, NAME_PROFILES, displayReading, toKatakana, nameTokens, nameTokenOptions, nameDefaultPicks } = new Function(
  code + "\nreturn {ATEJI,NAME_PROFILES,displayReading,toKatakana,nameTokens,nameTokenOptions,nameDefaultPicks};"
)();

// Every English gloss the generator can show (ATEJI + per-name profile options) — the keys a
// complete tools/locales/<lc>-meanings.json must have.
export const ALL_GLOSSES = [...new Set([
  ...Object.values(ATEJI).flat().map((e) => e[1]),
  ...Object.values(NAME_PROFILES).flatMap((p) => Object.values(p.options || {}).flat().map((e) => e[1])),
])];

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

// D-56 locale names: kanji from the locale "art" romaji, same engine as the generator.
const ENGINE = extractEngine(src);
// How many locale names the landing grid shows (popularity order); the rest are on the list page.
const LOCALE_GRID_MAX = 24;

// French typography: no-break space before : ; ? ! » and after «, so they never start a line.
// » always (interpolated meanings can end right before ) , .); : ; ? ! before whitespace, a tag, a quote or ) , .
const finish = (lang, s) => (lang === "fr" ? s.replace(/ »/g, "\u00a0»").replace(/ ([:;?!])(?=[\s<"),.]|$)/g, "\u00a0$1").replace(/« /g, "«\u00a0") : s);

// Landing sections for /<lang>/ (paths are relative to /<lang>/). Returns { ld: JSON-LD text, sections: HTML }.
export function landingParts(lang) {
  const S = STRINGS[lang];
  const LS = LOCALE_NAME_STRINGS[lang];
  const url = `${SITE}/${lang}/`;
  const locDir = LOCALE_DIRS[lang];
  const locMeans = loadLocaleMeanings(ROOT, lang);
  const loc = loadLocaleNames(ROOT, lang).map((n) => analyzeLocaleName(ENGINE, n, locMeans));
  const ex = analyze(S.example);
  // The example uses the locale reading + local page when that name is in the locale list.
  // With a locale entry its meanings are local (S.kanjiWhyLocal); otherwise English (S.kanjiWhy says so).
  // Per-kanji glosses are joined with " / " (a gloss itself may contain " · ").
  const exLoc = loc.find((n) => n.slug === ex.slug);
  if (exLoc) Object.assign(ex, { kata: exLoc.kana, hira: exLoc.hira, romaji: exLoc.romaji, kanji: exLoc.kanji, meanings: exLoc.meaningsLoc.map((m) => m.text) });
  const exData = { name: esc(ex.name), kata: ex.kata, hira: ex.hira, romaji: ex.romaji, kanji: ex.kanji, mean: esc(ex.meanings.join(" / ")) };
  const exHref = exLoc ? `${locDir}/${exLoc.slug}` : ex.inList ? `../names/${ex.slug}` : `../#${encodeURIComponent(ex.name)}`;
  if (!loc.length) throw new Error(`[${lang}] tools/locales/${lang}-names.json is missing or empty (the landing grid lists the locale names)`);
  const meanHtml = (ms) => ms.map((m) => (m.en ? `<span lang="en">${esc(m.text)}</span>` : esc(m.text))).join(" / ");
  const gridBlock = `<h2>${esc(LS.gridH2Local)}</h2>
  <p class="grid-note">${LS.gridNoteLocal}</p>
  <div class="ngrid">
    ${loc.slice(0, LOCALE_GRID_MAX).map((g) => `<a class="nc" href="${locDir}/${g.slug}"><span class="nc-name">${esc(g.display)}</span><span class="nc-kana" lang="ja">${esc(g.kana)}</span><span class="nc-kanji" lang="ja">${esc(g.kanji)}</span><span class="nc-mean">${meanHtml(g.meaningsLoc)}</span></a>`).join("\n    ")}
  </div>
  <p class="grid-more"><a href="${locDir}/">${esc(LS.allNamesLink)}</a></p>`;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: S.ogTitle, inLanguage: S.htmlLang,
        ...(S.altNames ? { alternateName: S.altNames } : {}),
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

  const sections = `  <h2>${S.scriptsH2(exData)}</h2>
  <dl class="scripts">
    <div class="sc-row"><dt>Katakana</dt><dd><span class="sc-script" lang="ja">${esc(ex.kata)}</span><span class="romaji">(${esc(ex.romaji)})</span><span class="sc-why">${S.kataWhy}</span></dd></div>
    <div class="sc-row"><dt>Hiragana</dt><dd><span class="sc-script" lang="ja">${esc(ex.hira)}</span><span class="sc-why">${S.hiraWhy}</span></dd></div>
    <div class="sc-row"><dt>Kanji</dt><dd><a href="${exHref}" style="text-decoration:none"><span class="sc-script sc-kanji" lang="ja">${esc(ex.kanji)}</span></a><span class="sc-why">${exLoc ? S.kanjiWhyLocal(exData) : S.kanjiWhy(exData)}</span></dd></div>
  </dl>

  <h2>${esc(S.sayH2)}</h2>
  <p class="body-copy">${S.say} ${LS.sayLocal}</p>

  ${gridBlock}

  <h2>${esc(S.faqH2)}</h2>
  ${S.faq.map(([q, a]) => `<div class="qa"><h3>${q}</h3><p>${a}</p></div>`).join("\n  ")}

  <p class="trust">${esc(S.trust)} <a href="../about" hreflang="en">${esc(S.about)}</a></p>`;

  return { ld: finish(lang, JSON.stringify(ld)), sections: finish(lang, sections) };
}

// The landing look (tools/locale-names-lib.mjs I18N_CSS), only the rules the sections use, each
// selector prefixed with ".lp " so nothing leaks into the generator above it.
const LP_SEL = /^(h2|h3|p|\.scripts|\.sc-|\.romaji|\.body-copy|\.ngrid|\.nc|\.grid-|\.qa|\.trust)/;
const scope = (sels) => sels.split(",").map((s) => `.lp ${s.trim()}`).join(",");
export const LANDING_CSS = [".lp{line-height:1.7;margin:20px 0 0}"].concat(
  I18N_CSS.split("\n").map((line) => {
    let m = line.match(/^(@media[^{]+)\{([^{}]+)\{([^{}]*)\}\}$/);
    if (m) return m[2].split(",").every((s) => LP_SEL.test(s.trim())) ? `${m[1]}{${scope(m[2])}{${m[3]}}}` : null;
    m = line.match(/^([^@{][^{]*)\{([^{}]*)\}$/);
    if (m) return m[1].split(",").every((s) => LP_SEL.test(s.trim())) ? `${scope(m[1])}{${m[2]}}` : null;
    return null;
  }).filter(Boolean)
).join("\n");
