#!/usr/bin/env node
// build-names.mjs — 名前別SEOページ生成（設計: _local/DESIGN_NAMES_SEO.md）
// 当て字ロジックは持たない: 本体 index.html から NAME_DICT/ATEJI/toRomaji/tokenize を抽出して実行する。
// 使い方:  node tools/build-names.mjs [--only sophia]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { I18N_LANGS } from "./i18n-strings.mjs"; // /fr/ /it/ /id/ landing pages (tools/build-i18n.mjs)
import { localeNameUrls, langSwitcher, NAME_PAGE_CSS, NAME_HUB_ART_CSS } from "./locale-names-lib.mjs"; // /fr/prenoms/ … (tools/build-locale-names.mjs, D-56) — this script owns the sitemap

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Cloudflare Pages is the public, indexable site. Keep every generated
// canonical URL and the sitemap on this one host.
const SITE = "https://kanji.kugainc.com";
// Task D: "Reviewed by Hitomi Kuga" line under the per-name ateji note.
// Flip to true only after the ateji_diff review pass is complete.
const SHOW_REVIEWED_BY = true;
// Task G: Cloudflare Web Analytics beacon (cookie-free, page views only). Same
// placeholder constant/gate as every hand-authored page (index.html, about.html,
// terms.html, tokushoho.html, unlock-80b9aa.html, guide/*.html) — set the token
// in all of them together once Web Analytics is enabled (see task-G-report.md).
const CF_BEACON_TOKEN = "";
const CF_BEACON_SNIPPET = `<!-- Cookie-free analytics (Cloudflare Web Analytics, page views only). Empty token = no beacon request. Task G setup: see .superpowers/sdd/CLAUDE_CODE_INSTRUCTIONS_review3_SEO/task-G-report.md -->
<script>(function(){var CF_BEACON_TOKEN="${CF_BEACON_TOKEN}";if(!CF_BEACON_TOKEN)return;var s=document.createElement("script");s.type="module";s.src="https://static.cloudflareinsights.com/beacon.min.js";s.setAttribute("data-cf-beacon",JSON.stringify({token:CF_BEACON_TOKEN}));document.head.appendChild(s);})();</script>`;
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// ---- 本体からロジック抽出（単一ソース原則）----
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
  // Include the aliases immediately following the main dictionary too (for
  // example fi → hi). They are part of the generator's token vocabulary.
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
const { ATEJI, toRomaji, tokenize, NAME_SAY, nameVariants, displayReading, toKatakana, trueSound, pickDefaults, nameTokens, nameTokenOptions, nameDefaultPicks } = new Function(
  code + "\nreturn {ATEJI,toRomaji,tokenize,NAME_SAY,nameVariants,displayReading,toKatakana,trueSound,pickDefaults,nameTokens,nameTokenOptions,nameDefaultPicks};"
)();

// ---- 名前リスト ----
const list = fs
  .readFileSync(path.join(ROOT, "tools", "names.txt"), "utf8")
  .split(/\r?\n/)
  .map((s) => s.trim().toLowerCase())
  .filter((s) => /^[a-z]+$/.test(s));
const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : null;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cap = (s) => s[0].toUpperCase() + s.slice(1);
// Katakana → hiragana (same mora, shifted code block). ー stays: it is also used in hiragana loan spellings.
const toHiragana = (k) => k.replace(/[\u30A1-\u30F6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

// Task E: /guide/* pages (independent FAQ deep-dives, see doc/faq-4.md). Listed here so the
// sitemap and every name page's shared FAQ 1/4 entries stay in sync with the guide slugs.
// Internal links: names ordered by Search Console demand (2026-11, 3 months). Shown on the
// /names/ hub (all) and as a compact row on the homepage (first POPULAR_HOME_COUNT).
const POPULAR_NAMES = ["wyatt", "cecilia", "victoria", "jeremiah", "raj", "priya", "tatum", "jayden", "alexander", "liliana", "adriel", "anastasia", "jesus", "genesis", "alejandro", "sienna", "messiah", "hudson", "maxwell", "ana", "adam", "julia", "chris", "nathaniel", "christopher", "celeste", "zara", "tate", "elias", "landon"];
const POPULAR_HOME_COUNT = 12;
// Link text = Name + the practical katakana shown on each page (default reading).
const popLabel = (d) => `${d.Name} ${toKatakana(displayReading(d.name, 0)) || d.kanji}`;
function popularOf(all) {
  const byName = new Map(all.map((d) => [d.name, d]));
  const missing = POPULAR_NAMES.filter((n) => !byName.has(n));
  if (missing.length) throw new Error("POPULAR_NAMES not in names.txt: " + missing.join(", "));
  return POPULAR_NAMES.map((n) => byName.get(n));
}

const GUIDE_SLUGS = ["japanese-writing-systems", "how-names-become-kanji", "what-does-approx-mean", "katakana-vs-kanji-names"];
// Shared, condensed versions of FAQ 1 and FAQ 4 from doc/faq-4.md, added to every name page
// (kept short on purpose — full copy lives on the /guide/ pages and the index FAQ section).
// Third element is the /guide/ slug this entry links out to.
const SHARED_FAQ = [
  [
    "Why does Japanese have so many kinds of writing?",
    `Japanese uses four scripts side by side: kanji for meaning, hiragana and katakana for sound, and rōmaji for the Latin alphabet. A Japanese person writing a foreign name by ear reaches for katakana, which records the sound but carries no meaning — kanji is the meaning-based art form this site uses instead, in the ateji (当て字) tradition.`,
    "japanese-writing-systems",
  ],
  [
    "Is this how a Japanese person would write my name?",
    `No — in everyday Japan, foreign names are written in katakana, which is why it's shown beneath every artwork here. The kanji version is ateji (当て字): an artistic portrait of a name chosen for sound and meaning, not an official translation, so anything permanent should be checked by a native speaker first.`,
    "katakana-vs-kanji-names",
  ],
];

function analyzeReading(name, vi) {
  const toks = nameTokens(name, vi);
  if (!toks.length) return null;
  const variants = toks.map((t) => nameTokenOptions(name, vi, t));
  const picks = nameDefaultPicks(name, vi, toks, variants);
  const def = toks.map((t, i) => variants[i][picks[i]]);
  return {
    picks,
    toks,
    kanji: def.map(([k]) => k).join(""),
    meanings: def.map(([, m]) => m),
    variants,
    combos: variants.reduce((n, opts) => n * opts.length, 1),
  };
}
function analyze(name) {
  // readings[0] (the most common pronunciation) is the page default; extra
  // readings become a client-side toggle while meta/FAQ/schema stay on default.
  const count = Math.max(1, nameVariants(name).length);
  const readings = [];
  for (let i = 0; i < count; i++) {
    const r = analyzeReading(name, i);
    if (r) readings.push(r);
  }
  if (!readings.length) return null;
  return { name, Name: cap(name), say: NAME_SAY[name] || null, readings, ...readings[0] };
}

// ---- テンプレート（本体の和紙トーンを踏襲。本体CSSには触らない）----
// CSS lives in locale-names-lib.mjs so the FR/IT/ID name pages share the exact same look.
const CSS = NAME_PAGE_CSS;
// The name index has its own quiet, asymmetric background composition.
const HUB_ART_CSS = NAME_HUB_ART_CSS;

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&family=Yuji+Syuku&family=Cormorant+Garamond:ital@0;1&family=Space+Grotesk:wght@400;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">`;
const ICON = `<link rel="icon" type="image/png" href="../image/kanjimyname-icon.png?v=2">`;
const SOCIAL_IMAGE = `${SITE}/image/kanjimyname.png?v=2`;

function pageHtml(d, all) {
  const mm = d.meanings.join(" · ");
  const hasApprox = d.readings.some((r) => r.toks.some((t, i) => r.variants[i].some((e) => trueSound(t, e) !== t)));
  const idx = all.findIndex((x) => x.name === d.name);
  const rel = [];
  for (let o = 1; rel.length < 8 && o < all.length; o++) {
    for (const j of [idx + o, idx - o]) {
      const w = all[(j + all.length) % all.length];
      if (w && w.name !== d.name && !rel.includes(w) && rel.length < 8) rel.push(w);
    }
  }
  // Fix 5: default-reading katakana for the tattoo FAQ (same source as the Task B note).
  const kata0 = toKatakana(displayReading(d.name, 0));
  const faq = [
    ...(kata0 ? [[`How do you write ${d.Name} in Japanese?`,
     `${d.Name} is normally written ${kata0} in katakana — Japanese writes foreign names and other foreign words in katakana. In hiragana it would be ${toHiragana(kata0)}, though foreign names aren't normally written that way. As kanji art, one ateji spelling is ${d.kanji} ("${mm}"), chosen for sound and meaning rather than as an official spelling.`,
     "katakana-vs-kanji-names"]] : []),
    [`What does ${d.Name} mean in Japanese?`,
     `On its own, ${d.Name} has no meaning in Japanese. ${kata0 ? `Katakana (${kata0}) records only the sound, the way Japanese writes any foreign name.` : `Written in katakana, a foreign name records only the sound.`} Meaning comes in only if you write it in kanji: with ateji (当て字), you choose characters for their meaning as well as their sound. The default spelling here, ${d.kanji}, means "${mm}" — and you can swap any character to pick a different meaning.`],
    [`What is the kanji for ${d.Name}?`,
     `There is no single official kanji for ${d.Name}. This is one sound-based ateji (当て字) option: ${d.kanji}, read as "${d.toks.join("-")}", with the meanings "${mm}". You can swap a character for another with the same or closest Japanese sound: ${d.Name} has ${d.combos} possible kanji spellings in this generator.`],
    [`Is ${d.kanji} suitable for a tattoo?`,
     `It can be a starting point for a tattoo design. Because tattoos are permanent, we recommend having both the katakana${kata0 ? ` (${kata0})` : ""} and the kanji checked by a native Japanese speaker before committing.`],
    [`What does ${d.kanji} mean?`,
     `Character by character, ${d.kanji} reads ${d.toks.map((t, i) => {
       const e = d.variants[i][d.picks[i]], ts = trueSound(t, e);
       return `${e[0]} ("${e[1]}", read as "${ts}"${ts !== t ? `, used for the "${t}" sound` : ""})`;
     }).join(", ")}. Together they sound like "${d.Name}" while carrying the meanings ${mm}.`],
    ...SHARED_FAQ,
  ];
  // Task B: same practical-katakana + ateji note as the generator, right under the H1
  // summary. One per reading, reusing the page's existing .vgrp toggle (sayScript) so it
  // tracks the "How do you say it?" picker for names with more than one pronunciation.
  const noteBlock = (r, i) => {
    const raw = displayReading(d.name, i);
    const kk = toKatakana(raw);
    const row = (lbl, script, txt, lang, copy) => `<div class="sc-row"><dt>${lbl}</dt><dd><span class="sc-script"${lang ? ` lang="${lang}"` : ""}>${esc(script)}</span>${copy ? `<button type="button" class="sc-copy" data-copy="${esc(script)}" aria-label="Copy ${esc(d.Name)} in ${lbl.toLowerCase()}">Copy</button>` : ""}${txt}</dd></div>`;
    const rows = [
      kk ? row("Katakana", kk, `<span class="an-romaji">(${esc(raw)})</span><span class="sc-why">Japanese writes foreign names and other foreign words in katakana. This is how ${esc(d.Name)} is normally written in Japan.</span>`, "ja", true) : "",
      kk ? row("Hiragana", toHiragana(kk), `<span class="sc-why">Hiragana is used for native Japanese words, so foreign names aren't normally written this way. Some people still like it for its soft, rounded look.</span>`, "ja", true) : "",
      row("Kanji", r.kanji, `<span class="sc-why">Ateji: kanji chosen for their sound and meaning (“${esc(r.meanings.join(" · "))}”). It's an art form, not an official spelling.</span>`, "ja"),
    ].join("");
    return `<div class="an vgrp" data-v="${i}"${i > 0 ? " hidden" : ""}>
    <h2 class="sc-h">${esc(d.Name)} in Japanese: three ways to write it</h2>
    <dl class="scripts">${rows}</dl>
    <p class="an-l3">For anything permanent, have a native speaker check it.</p>
    ${SHOW_REVIEWED_BY ? `<p class="an-l3">Reviewed by Hitomi Kuga, Japanese-language teacher</p>` : ""}
  </div>`;
  };
  const artNotes = d.readings.map(noteBlock).join("\n  ");
  const url = `${SITE}/names/${d.name}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url,
        name: `${d.Name} in Japanese — Katakana, Hiragana & Kanji`, inLanguage: "en",
        description: `${d.Name} in Japanese kanji: ${d.kanji}. One sound-based ateji option, with meanings ${mm}.`,
        isPartOf: { "@id": `${SITE}/#website` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Kanji My Name", item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: "Names in Kanji", item: SITE + "/names/" },
          { "@type": "ListItem", position: 3, name: `${d.Name} in Japanese`, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map(([q, a]) => ({
          "@type": "Question", name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
  // ≈ = closest-reading kanji (ateji tradition); exact matches carry no mark
  const soundCell = (t, e) => {
    const ts = trueSound(t, e);
    return ts === t ? esc(t) : `${esc(t)} <span class="apx">(≈ ${esc(ts)})</span>`;
  };
  const sylBlocks = (r) => r.toks
    .map((t, i) => `<p class="syl">“${esc(t)}” — ${r.variants[i].length} kanji to choose from</p>
<div class="alts">${r.variants[i].map((e, o) => {
      const sel = o === r.picks[i];
      return `<div class="alt${sel ? " sel" : ""}">${sel ? `<i class="seal-sel" aria-label="Selected">選</i>` : ""}<span class="kj">${esc(e[0])}</span><span class="mm">${esc(e[1])}</span>${trueSound(t, e) !== t ? `<span class="apx">≈ ${esc(trueSound(t, e))}</span>` : ""}${sel ? `<span class="selline">In this spelling</span>` : ""}</div>`;
    }).join("")}</div>`)
    .join("\n");
  // Per-reading content block. The generator link carries the pick as #Name~n.
  const genHash = (i) => encodeURIComponent(d.Name + (i > 0 ? `~${i + 1}` : ""));
  const readingBlock = (r, i) => {
    const rm = r.meanings.join(" · ");
    const previewFile = `${d.name}${i > 0 ? `--${i + 1}` : ""}.jpg`;
    return `<div class="vgrp" data-v="${i}"${i > 0 ? " hidden" : ""}>
  <div class="hero">
    <img class="art-preview" src="../image/preview/${previewFile}" alt="${esc(d.Name)} in kanji: ${esc(r.kanji)} — artistic ateji" width="800" height="1200" loading="lazy">
    <div>
      <h2 style="margin-top:0">${esc(r.kanji)} — “${esc(rm)}”</h2>
      <p class="body-copy">${esc(d.Name)} sounds like <b>${esc(r.toks.join(" · "))}</b> in Japanese. Matching each sound to a kanji gives <b>${esc(r.kanji)}</b> — one of <b>${r.combos} possible kanji spellings</b> of ${esc(d.Name)}. Every character below has the same or closest Japanese sound but a different meaning, so the final choice is yours.</p>
      <a class="cta" href="../#${genHash(i)}" onclick="try{navigator.sendBeacon&&navigator.sendBeacon('https://kanji-my-name-metrics.hitomiusausa.workers.dev/e?k=np_cta&s=names')}catch(e){}">Create your ${esc(d.Name)} kanji art — free</a>
      <p class="note">Instant download · your name never leaves your browser</p>
    </div>
  </div>

  <h2>How ${esc(d.Name)} becomes kanji</h2>
  <table>
    <tr><th>Sound</th><th>Kanji</th><th>Meaning</th></tr>
    ${r.toks.map((t, j) => `<tr><td>${soundCell(t, r.variants[j][r.picks[j]])}</td><td><span class="kj">${esc(r.variants[j][r.picks[j]][0])}</span></td><td>${esc(r.variants[j][r.picks[j]][1])}</td></tr>`).join("\n    ")}
  </table>

  <h2>Every kanji choice for ${esc(d.Name)}</h2>
  <p class="body-copy">Pick a different character for any syllable — love, dreams, strength, light — and the art updates instantly in the <a style="color:var(--gold)" href="../#${genHash(i)}">generator</a>.</p>
  ${sylBlocks(r)}
</div>`;
  };
  // Copy buttons on the Katakana / Hiragana rows: clipboard API, execCommand fallback,
  // and as a last resort select the text so the visitor can copy it by hand.
  const copyScript = !kata0 ? "" : `<span class="sr-only" role="status" aria-live="polite" id="copyStatus"></span>
<script>
document.addEventListener("click",function(e){
  var b=e.target.closest(".sc-copy");if(!b)return;
  var t=b.dataset.copy,st=document.getElementById("copyStatus");
  function ok(){b.textContent="Copied";b.classList.add("done");st.textContent="Copied "+t;clearTimeout(b._t);b._t=setTimeout(function(){b.textContent="Copy";b.classList.remove("done");st.textContent="";},1600);}
  function manual(){var s=b.parentNode.querySelector(".sc-script"),r=document.createRange();r.selectNodeContents(s);var sel=getSelection();sel.removeAllRanges();sel.addRange(r);b.textContent="Selected";st.textContent="Text selected — copy it manually";}
  function legacy(){var a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;left:0;opacity:0";document.body.appendChild(a);a.select();var d=false;try{d=document.execCommand("copy")}catch(_){}a.remove();d?ok():manual();}
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(ok,legacy);else legacy();
});
</script>`;
  const multi = d.readings.length > 1;
  const sayPicker = !multi ? "" : `<div class="say-pick" aria-label="How do you say it?">
    <span class="say-q">How do you say it?</span>
    ${d.readings.map((r, i) => `<button class="say-b${i === 0 ? " on" : ""}" data-v="${i}">${esc((d.say && d.say[i]) || r.toks.join("-"))}<span class="ss">${esc(r.toks.join(" · "))}</span></button>`).join("\n    ")}
  </div>`;
  const sayScript = !multi ? "" : `<script>
document.addEventListener("click",function(e){
  var b=e.target.closest(".say-b");if(!b)return;
  document.querySelectorAll(".say-b").forEach(function(x){x.classList.toggle("on",x===b)});
  document.querySelectorAll(".vgrp").forEach(function(g){g.hidden=g.dataset.v!==b.dataset.v});
});
</script>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(d.Name)} in Japanese — Katakana, Hiragana &amp; Kanji | Kanji My Name</title>
<meta name="description" content="${esc(kata0 ? `${d.Name} in Japanese is written ${kata0} in katakana, the script for foreign names. See it in hiragana and as kanji art (${d.kanji}, "${mm}"), explore ${d.combos} kanji spellings, and download free calligraphy name art.` : `${d.Name} in Japanese kanji: ${d.kanji} ("${mm}"). Explore ${d.combos} kanji spellings with meanings and download free calligraphy name art.`)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(d.Name)} in Japanese — ${esc(kata0 ? kata0 + " · " : "")}${esc(d.kanji)}">
<meta property="og:description" content="${esc(`${d.kanji} means "${mm}". Choose your own meanings and download it as calligraphy art.`)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Kanji My Name">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${SITE}/image/og/${d.name}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/image/og/${d.name}.jpg">
${ICON}
${FONTS_LINK}
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${CF_BEACON_SNIPPET}
</head>
<body>
<div class="wrap">
  <div class="top"><div class="brand"><a href="../">Kanji My Name</a></div>${langSwitcher("../", "en")}</div>
  <h1>${esc(d.Name)} in Japanese</h1>
  <p class="sub"><b>${esc(d.Name)} in kanji: ${esc(d.kanji)}</b> — one way to write ${esc(d.Name)}, with meanings you choose yourself, in the Japanese <i>ateji</i> (当て字) tradition.${hasApprox ? ` Some sounds have no exact kanji; ateji tradition uses the closest reading — marked ≈ below (e.g. ヴァ → ba, フィ → hi).` : ""}</p>
  ${artNotes}
  ${sayPicker}
  ${d.readings.map(readingBlock).join("\n")}

  <h2>Tattoo, gift &amp; wall art ideas</h2>
  <p class="body-copy">${esc(d.kanji)} makes striking vertical calligraphy — a popular choice for a <b>kanji name tattoo</b>, a personalised <b>Japanese name gift</b>, or framed <b>wall art</b>. Because you can read this page, you (and your tattoo artist) know exactly what each character means — no mystery kanji.</p>

  <h2>Questions about ${esc(d.Name)} in kanji</h2>
  ${faq.map(([q, a, guideSlug]) => `<div class="qa"><b>${esc(q)}</b><p>${esc(a)}</p>${guideSlug ? `<p class="qa-more"><a href="../guide/${guideSlug}">Read the full guide →</a></p>` : ""}</div>`).join("\n  ")}

  <h2>More names in kanji</h2>
  <div class="rel">${rel.map((w) => `<a href="${w.name}">${esc(w.Name)} ${esc(w.kanji)}</a>`).join("")}<a href="./">All names →</a></div>

  <footer><a href="../" class="flogo" aria-label="Kanji My Name — home"><img src="../image/kanjilogo-footer.png" alt="Kanji My Name logo" width="84" height="84" loading="lazy"></a><div>Kanji My Name · © <a href="https://kugainc.com/en/" rel="noopener">KUGA Inc.</a> · <a href="../">Try your own name →</a> · <a href="../about">About</a> · <a href="../terms">Terms</a> · <a href="../tokushoho">Legal Notice</a></div><div style="margin-top:6px">Made in Japan by a native speaker &amp; Japanese-language teacher</div></footer>
</div>
${copyScript}
${sayScript}
</body>
</html>
`;
}

function hubHtml(all) {
  const groups = {};
  const totalCombos = all.reduce((total, d) => total + d.combos, 0).toLocaleString("en-US");
  const url = `${SITE}/names/`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", "@id": `${url}#webpage`, url,
        name: "Names in Japanese Kanji", inLanguage: "en",
        description: `Browse ${all.length} names and ${totalCombos} possible Japanese kanji spellings.`,
        isPartOf: { "@id": `${SITE}/#website` },
        mainEntity: { "@id": `${url}#names` },
      },
      {
        "@type": "ItemList", "@id": `${url}#names`, name: "Names in Japanese Kanji",
        numberOfItems: all.length,
        itemListElement: all.map((d, index) => ({
          "@type": "ListItem", position: index + 1, name: `${d.Name} in Kanji`, url: `${SITE}/names/${d.name}`,
        })),
      },
    ],
  };
  for (const d of all) (groups[d.Name[0]] ??= []).push(d);
  const letters = Object.keys(groups).sort();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Names in Kanji — ${all.length} Names with Meanings | Kanji My Name</title>
<meta name="description" content="Browse ${all.length} names and ${totalCombos} possible Japanese kanji spellings. Each page starts with one ateji option, then lets you explore alternatives and create free calligraphy name art.">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="Names in Japanese Kanji — ${all.length} Names with Meanings">
<meta property="og:description" content="Browse sound-based Japanese kanji options, meanings, and calligraphy art for a growing collection of names.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kanji My Name">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${SOCIAL_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
${ICON}
${FONTS_LINK}
<style>${CSS}${HUB_ART_CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${CF_BEACON_SNIPPET}
</head>
<body class="names-index">
<div class="list-watermark list-watermark-left" aria-hidden="true">名</div>
<div class="list-watermark list-watermark-right" aria-hidden="true">前</div>
<div class="wrap">
  <div class="top"><div class="brand"><a href="../">Kanji My Name</a></div>${langSwitcher("../", "en")}</div>
  <h1>Names in Japanese Kanji</h1>
  <p class="sub">${all.length} names · ${totalCombos} possible kanji spellings. Each kanji shown here is one sound-based <i>ateji</i> option — open a name to explore other combinations, or <a style="color:var(--gold)" href="../">create your own →</a></p>
  <div class="az-nav" aria-label="Browse by first letter">${letters.map((L) => `<a href="${L.toLowerCase()}">${L}</a>`).join("")}</div>
  <h2 class="pop-h">Most searched names</h2>
  <div class="rel">${popularOf(all).map((d) => `<a href="${d.name}">${esc(popLabel(d))}</a>`).join("")}</div>
  ${letters.map((L) => `<h2>${L}</h2><div class="rel">${groups[L].map((d) => `<a href="${d.name}">${esc(d.Name)} ${esc(d.kanji)}</a>`).join("")}</div>`).join("\n  ")}
  <footer><a href="../" class="flogo" aria-label="Kanji My Name — home"><img src="../image/kanjilogo-footer.png" alt="Kanji My Name logo" width="84" height="84" loading="lazy"></a><div>Kanji My Name · © <a href="https://kugainc.com/en/" rel="noopener">KUGA Inc.</a> · <a href="../">Try your own name →</a> · <a href="../about">About</a> · <a href="../terms">Terms</a> · <a href="../tokushoho">Legal Notice</a></div><div style="margin-top:6px">Made in Japan by a native speaker &amp; Japanese-language teacher</div></footer>
</div>
</body>
</html>
`;
}

// Task F: A-Z browse pages (/names/a … /names/z). Only letters with at least one
// name get a page and a link — no empty pages, no dead links (see hubHtml's az-nav).
function letterHtml(letter, items, all) {
  const sorted = items.slice().sort((a, b) => a.Name.localeCompare(b.Name));
  const url = `${SITE}/names/${letter.toLowerCase()}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage", "@id": `${url}#webpage`, url,
    name: `Names Starting with "${letter}" in Kanji`, inLanguage: "en",
    description: `Browse ${sorted.length} names starting with "${letter}" and their Japanese kanji spellings.`,
    isPartOf: { "@id": `${SITE}/#website` },
    mainEntity: {
      "@type": "ItemList", "@id": `${url}#names`, numberOfItems: sorted.length,
      itemListElement: sorted.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: `${d.Name} in Kanji`, url: `${SITE}/names/${d.name}` })),
    },
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Names Starting with "${esc(letter)}" in Kanji — ${sorted.length} Names | Kanji My Name</title>
<meta name="description" content="Browse ${sorted.length} names starting with &quot;${esc(letter)}&quot; and their Japanese kanji spellings, meanings, and free calligraphy name art.">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="Names Starting with &quot;${esc(letter)}&quot; in Kanji">
<meta property="og:description" content="Browse ${sorted.length} names starting with &quot;${esc(letter)}&quot; and their Japanese kanji spellings.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kanji My Name">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${SOCIAL_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
${ICON}
${FONTS_LINK}
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${CF_BEACON_SNIPPET}
</head>
<body>
<div class="wrap">
  <div class="top"><div class="brand"><a href="../">Kanji My Name</a></div>${langSwitcher("../", "en")}</div>
  <h1>Names Starting with "${esc(letter)}"</h1>
  <p class="sub">${sorted.length} name${sorted.length === 1 ? "" : "s"} in kanji, starting with "${esc(letter)}". <a style="color:var(--gold)" href="./">All letters →</a></p>
  <div class="rel">${sorted.map((d) => `<a href="${d.name}">${esc(d.Name)} ${esc(d.kanji)}</a>`).join("")}</div>
  <footer><a href="../" class="flogo" aria-label="Kanji My Name — home"><img src="../image/kanjilogo-footer.png" alt="Kanji My Name logo" width="84" height="84" loading="lazy"></a><div>Kanji My Name · © <a href="https://kugainc.com/en/" rel="noopener">KUGA Inc.</a> · <a href="../">Try your own name →</a> · <a href="../about">About</a> · <a href="../terms">Terms</a> · <a href="../tokushoho">Legal Notice</a></div><div style="margin-top:6px">Made in Japan by a native speaker &amp; Japanese-language teacher</div></footer>
</div>
</body>
</html>
`;
}

// Task F: build & write tools/site-stats.json, then patch the two hand-authored
// pages' stat spans in place. Numbers are always derived from `all` — never typed
// by hand — so index.html/about.html stay in sync with the dictionary and names.txt.
function writeStats(all) {
  const stats = {
    names: all.length,
    combos: all.reduce((total, d) => total + d.combos, 0),
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(ROOT, "tools", "site-stats.json"), JSON.stringify(stats, null, 2) + "\n");
  const combosFmt = stats.combos.toLocaleString("en-US");
  for (const file of ["index.html", "about.html"]) {
    const p = path.join(ROOT, file);
    let html = fs.readFileSync(p, "utf8");
    html = html.replace(/(id="statNames">)[\d,]+(<)/, `$1${stats.names}$2`);
    html = html.replace(/(id="statCombos">)[\d,]+(<)/, `$1${combosFmt}$2`);
    fs.writeFileSync(p, html);
  }
  // Homepage "Most searched names" row, between markers in index.html.
  const ip = path.join(ROOT, "index.html");
  const home = fs.readFileSync(ip, "utf8");
  const row = popularOf(all).slice(0, POPULAR_HOME_COUNT)
    .map((d) => `<a href="names/${d.name}">${esc(popLabel(d))}</a>`).join("");
  const re = /(<!-- popular-names:start -->)[\s\S]*?(<!-- popular-names:end -->)/;
  if (!re.test(home)) throw new Error("index.html: popular-names markers missing");
  fs.writeFileSync(ip, home.replace(re, `$1${row}<a href="names/" class="pop-all">All names →</a>$2`));
  return stats;
}

// Task F: image sitemap. og:image files already exist (tools/build-og.mjs, not run
// here) — this just references them, 500 <image:image> entries, one per name.
function imagesSitemapXml(all) {
  const entries = all.map((d) => {
    const title = `${d.Name} in kanji: ${d.kanji}`;
    const caption = d.meanings.join(" · ");
    return `  <url>\n    <loc>${SITE}/names/${d.name}</loc>\n    <image:image>\n      <image:loc>${SITE}/image/og/${d.name}.jpg</image:loc>\n      <image:title>${escXml(title)}</image:title>\n      <image:caption>${escXml(caption)}</image:caption>\n    </image:image>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join("\n")}\n</urlset>\n`;
}
const escXml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---- 生成 ----
const all = [];
for (const n of list) {
  const d = analyze(n);
  if (!d) { console.warn("skip (tokenize failed):", n); continue; }
  all.push(d);
}
const outDir = path.join(ROOT, "names");
fs.mkdirSync(outDir, { recursive: true });
let wrote = 0;
for (const d of all) {
  if (only && d.name !== only) continue;
  fs.writeFileSync(path.join(outDir, d.name + ".html"), pageHtml(d, all));
  wrote++;
}
if (!only) {
  fs.writeFileSync(path.join(outDir, "index.html"), hubHtml(all));

  // Task F: A-Z browse pages — one per letter that actually has names. No page,
  // no link, no sitemap entry for a letter with zero names (e.g. currently U, Y).
  const groups = {};
  for (const d of all) (groups[d.Name[0]] ??= []).push(d);
  const letters = Object.keys(groups).sort();
  for (const L of letters) {
    fs.writeFileSync(path.join(outDir, L.toLowerCase() + ".html"), letterHtml(L, groups[L], all));
  }

  // Task F: derived stats -> tools/site-stats.json + index.html/about.html spans.
  const stats = writeStats(all);

  // Task F: sitemap.xml is now a sitemap index over sitemap-pages.xml (every
  // crawlable page, including the new A-Z pages) and sitemap-images.xml (the 500
  // per-name OG images).
  const urls = [
    `${SITE}/`, `${SITE}/about`, `${SITE}/terms`, `${SITE}/tokushoho`,
    ...I18N_LANGS.map((l) => `${SITE}/${l}/`),
    ...localeNameUrls(ROOT, SITE),
    ...GUIDE_SLUGS.map((s) => `${SITE}/guide/${s}`),
    `${SITE}/names/`,
    ...letters.map((L) => `${SITE}/names/${L.toLowerCase()}`),
    ...all.map((d) => `${SITE}/names/${d.name}`),
  ];
  fs.writeFileSync(
    path.join(ROOT, "sitemap-pages.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
      `\n</urlset>\n`
  );
  fs.writeFileSync(path.join(ROOT, "sitemap-images.xml"), imagesSitemapXml(all));
  fs.writeFileSync(
    path.join(ROOT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <sitemap><loc>${SITE}/sitemap-pages.xml</loc></sitemap>\n` +
      `  <sitemap><loc>${SITE}/sitemap-images.xml</loc></sitemap>\n` +
      `</sitemapindex>\n`
  );
  console.log(`names analyzed: ${all.length} / pages written: ${wrote} + index + ${letters.length} A-Z pages + sitemap index (stats: ${stats.names} names, ${stats.combos.toLocaleString("en-US")} combos)`);
} else {
  console.log(`names analyzed: ${all.length} / pages written: ${wrote} (--only ${only})`);
}
