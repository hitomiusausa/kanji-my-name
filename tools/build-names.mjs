#!/usr/bin/env node
// build-names.mjs — 名前別SEOページ生成（設計: _local/DESIGN_NAMES_SEO.md）
// 当て字ロジックは持たない: 本体 index.html から NAME_DICT/ATEJI/toRomaji/tokenize を抽出して実行する。
// 使い方:  node tools/build-names.mjs [--only sophia]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Cloudflare Pages is the public, indexable site. Keep every generated
// canonical URL and the sitemap on this one host.
const SITE = "https://kanji.kugainc.com";
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// ---- 本体からロジック抽出（単一ソース原則）----
function extract(re, label) {
  const m = src.match(re);
  if (!m) throw new Error("extract failed: " + label);
  return m[0];
}
const code = [
  extract(/const NAME_DICT=\{.*?\};/s, "NAME_DICT"),
  extract(/const NAME_SAY=\{.*?\};/s, "NAME_SAY"),
  // Include the aliases immediately following the main dictionary too (for
  // example fi → hi). They are part of the generator's token vocabulary.
  extract(/const ATEJI\s*=\s*\{[\s\S]*?ATEJI\.ye=ATEJI\.e;/, "ATEJI + aliases"),
  extract(/function nameVariants\([^)]*\)\{[\s\S]*?\n\}/, "nameVariants"),
  extract(/function toRomaji\(name[^)]*\)\{[\s\S]*?\n\}/, "toRomaji"),
  extract(/function tokenize\(r\)\{[\s\S]*?\n\}/, "tokenize"),
].join("\n");
const { ATEJI, toRomaji, tokenize, NAME_SAY, nameVariants } = new Function(
  code + "\nreturn {ATEJI,toRomaji,tokenize,NAME_SAY,nameVariants};"
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

function analyze(name) {
  const toks = tokenize(toRomaji(name));
  if (!toks.length) return null;
  const def = toks.map((t) => ATEJI[t][0]);
  return {
    name,
    Name: cap(name),
    toks,
    kanji: def.map(([k]) => k).join(""),
    meanings: def.map(([, m]) => m),
    variants: toks.map((t) => ATEJI[t]),
    combos: toks.reduce((n, t) => n * ATEJI[t].length, 1),
  };
}

// ---- テンプレート（本体の和紙トーンを踏襲。本体CSSには触らない）----
const CSS = `
:root{--bg:#131310;--panel:#1a1a16;--line:#35332a;--ink:#e8e2d5;--head:#f0ead9;--gold:#b89250;--muted:#8f897b;--seal:#c73e2c;
--washi:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 .9 0 0 0 .05 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Inter',sans-serif;line-height:1.7;position:relative}
body::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 60% 40% at 78% 8%,rgba(232,226,213,.045),transparent 70%),var(--washi)}
.wrap{max-width:920px;margin:0 auto;padding:0 20px;position:relative;z-index:1}
.brand{font-family:'Space Grotesk',sans-serif;font-size:12px;letter-spacing:.5em;text-transform:uppercase;color:var(--gold);padding:34px 0 0;display:flex;align-items:center;gap:12px}
.brand::before{content:"印";font-family:'Yuji Syuku',serif;font-size:13px;color:#fdf6ea;background:var(--seal);width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:3px;transform:rotate(3deg);letter-spacing:0}
.brand a{color:inherit;text-decoration:none}
h1{font-family:'Shippori Mincho',serif;font-weight:700;font-size:clamp(30px,5vw,46px);line-height:1.25;margin:16px 0 6px;color:var(--head)}
h2{font-family:'Shippori Mincho',serif;font-size:24px;color:var(--head);margin:40px 0 12px}
.sub{color:var(--muted);max-width:640px;font-size:15px}
.hero{display:grid;grid-template-columns:280px 1fr;gap:34px;margin:30px 0;align-items:center}
@media(max-width:700px){.hero{grid-template-columns:1fr}}
.card{background:linear-gradient(160deg,#f6efdd,#efe6cf);padding:34px 22px;text-align:center;box-shadow:0 0 60px rgba(184,146,80,.12),0 24px 48px rgba(0,0,0,.45)}
.card .k{writing-mode:vertical-rl;font-family:'Yuji Syuku',serif;font-size:76px;line-height:1.15;color:#191713;margin:0 auto;display:inline-block}
.card .r{font-family:'Cormorant Garamond',serif;letter-spacing:.4em;color:#7c7462;font-size:14px;margin-top:16px;text-transform:uppercase}
.card .m{font-family:'Cormorant Garamond',serif;font-style:italic;color:#8d8570;font-size:13px;margin-top:4px}
table{border-collapse:collapse;width:100%;font-size:15px}
td,th{border:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top}
th{font-family:'Space Grotesk',sans-serif;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}
td .kj{font-family:'Yuji Syuku',serif;font-size:26px;color:var(--head)}
.alts{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 4px}
.alt{border:1px solid var(--line);background:var(--panel);padding:10px 14px;min-width:96px;text-align:center}
.alt .kj{font-family:'Yuji Syuku',serif;font-size:30px;color:var(--head);display:block}
.alt .mm{font-family:'Space Grotesk',sans-serif;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold)}
.syl{font-family:'Space Grotesk',sans-serif;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:22px 0 0}
.cta{display:inline-block;background:linear-gradient(120deg,#a8823f,#cca768);color:#131310;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;letter-spacing:.12em;text-transform:uppercase;padding:16px 30px;text-decoration:none;margin:26px 0 8px}
.note{font-size:12.5px;color:var(--muted)}
.qa{border-bottom:1px solid var(--line);padding:14px 0}
.qa b{display:block;color:var(--head);margin-bottom:4px}
.qa p{color:var(--muted);font-size:14.5px}
.rel{display:flex;flex-wrap:wrap;gap:8px}
.rel a{border:1px solid var(--line);color:var(--ink);text-decoration:none;padding:7px 14px;font-size:13px}
.rel a:hover{border-color:var(--gold)}
footer{border-top:1px solid var(--line);margin-top:56px;padding:24px 0 40px;color:var(--muted);font-size:13px;text-align:center}
footer a{color:var(--gold)}
p{margin:10px 0}
.body-copy{color:var(--ink);max-width:720px}
`;

// The name index has its own quiet, asymmetric background composition.
const HUB_ART_CSS = `
.names-index::before{background:radial-gradient(ellipse 60% 40% at 78% 8%,rgba(232,226,213,.05),transparent 70%),radial-gradient(ellipse 46% 34% at -6% 86%,rgba(199,62,44,.05),transparent 72%),var(--washi)}
.list-watermark{position:fixed;z-index:0;pointer-events:none;writing-mode:vertical-rl;font-family:'Yuji Syuku',serif;line-height:.82;letter-spacing:.1em;user-select:none}
.list-watermark-left{left:-.14em;top:56%;font-size:clamp(175px,22vw,350px);color:rgba(232,226,213,.03);transform:rotate(7deg)}
.list-watermark-right{right:-.08em;top:13%;font-size:clamp(150px,18vw,290px);color:rgba(232,226,213,.036);transform:rotate(-5deg)}
`;

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&family=Yuji+Syuku&family=Cormorant+Garamond:ital@0;1&family=Space+Grotesk:wght@400;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">`;
const ICON = `<link rel="icon" type="image/png" href="../image/kanji%20my%20name-favicon.png">`;
const SOCIAL_IMAGE = `${SITE}/image/kanji%20my%20name-favicon.png`;

function pageHtml(d, all) {
  const mm = d.meanings.join(" · ");
  const idx = all.findIndex((x) => x.name === d.name);
  const rel = [];
  for (let o = 1; rel.length < 8 && o < all.length; o++) {
    for (const j of [idx + o, idx - o]) {
      const w = all[(j + all.length) % all.length];
      if (w && w.name !== d.name && !rel.includes(w) && rel.length < 8) rel.push(w);
    }
  }
  const faq = [
    [`What is the kanji for ${d.Name}?`,
     `There is no single official kanji for ${d.Name}. This is one sound-based ateji (当て字) option: ${d.kanji}, read "${d.toks.join("-")}", with the meanings "${mm}". You can swap a character for another with the same sound: ${d.Name} has ${d.combos} possible kanji spellings in this generator.`],
    [`Is ${d.kanji} suitable for a tattoo?`,
     `Yes — ${d.kanji} is a phonetic ateji spelling of ${d.Name}, and each character's meaning is listed on this page, so you know exactly what your tattoo says. For stroke-accurate line work, generate the free art below and bring the high-resolution version to your artist.`],
    [`What does ${d.kanji} mean?`,
     `Character by character, ${d.kanji} reads ${d.toks.map((t, i) => `${d.variants[i][0][0]} ("${d.variants[i][0][1]}", read "${t}")`).join(", ")}. Together they sound like "${d.Name}" while carrying the meanings ${mm}.`],
  ];
  const url = `${SITE}/names/${d.name}`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url,
        name: `${d.Name} in Japanese Kanji`, inLanguage: "en",
        description: `${d.Name} in Japanese kanji: ${d.kanji}. One sound-based ateji option, with meanings ${mm}.`,
        isPartOf: { "@id": `${SITE}/#website` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Kanji My Name", item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: "Names in Kanji", item: SITE + "/names/" },
          { "@type": "ListItem", position: 3, name: `${d.Name} in Kanji`, item: url },
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
  const sylBlocks = d.toks
    .map((t, i) => `<p class="syl">“${esc(t)}” — ${d.variants[i].length} kanji to choose from</p>
<div class="alts">${d.variants[i].map(([k, m]) => `<div class="alt"><span class="kj">${esc(k)}</span><span class="mm">${esc(m)}</span></div>`).join("")}</div>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(d.Name)} in Kanji (${esc(d.kanji)}) — Meaning &amp; Name Art | Kanji My Name</title>
<meta name="description" content="${esc(`${d.Name} in Japanese kanji: ${d.kanji} ("${mm}"). See all ${d.combos} kanji spellings of ${d.Name} with meanings, and download free calligraphy name art — tattoo-ready, gift-worthy.`)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(d.Name)} in Kanji — ${esc(d.kanji)}">
<meta property="og:description" content="${esc(`${d.kanji} means "${mm}". Choose your own meanings and download it as calligraphy art.`)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Kanji My Name">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${SOCIAL_IMAGE}">
<meta name="twitter:card" content="summary">
${ICON}
${FONTS_LINK}
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<div class="wrap">
  <div class="brand"><a href="../">Kanji My Name</a></div>
  <h1>${esc(d.Name)} in Japanese Kanji</h1>
  <p class="sub">One way to write ${esc(d.Name)} in kanji — with meanings you choose yourself, in the Japanese <i>ateji</i> (当て字) tradition.</p>

  <div class="hero">
    <div class="card"><span class="k">${esc(d.kanji)}</span><div class="r">${esc(d.Name)}</div><div class="m">${esc(mm)}</div></div>
    <div>
      <h2 style="margin-top:0">${esc(d.kanji)} — “${esc(mm)}”</h2>
      <p class="body-copy">${esc(d.Name)} sounds like <b>${esc(d.toks.join(" · "))}</b> in Japanese. Matching each sound to a kanji gives <b>${esc(d.kanji)}</b> — one of <b>${d.combos} possible kanji spellings</b> of ${esc(d.Name)}. Every character below shares the sound but carries a different meaning, so the final choice is yours.</p>
      <a class="cta" href="../#${encodeURIComponent(d.Name)}">Create your ${esc(d.Name)} kanji art — free ✦</a>
      <p class="note">Instant download · your name never leaves your browser</p>
    </div>
  </div>

  <h2>How ${esc(d.Name)} becomes kanji</h2>
  <table>
    <tr><th>Sound</th><th>Kanji</th><th>Meaning</th></tr>
    ${d.toks.map((t, i) => `<tr><td>${esc(t)}</td><td><span class="kj">${esc(d.variants[i][0][0])}</span></td><td>${esc(d.variants[i][0][1])}</td></tr>`).join("\n    ")}
  </table>

  <h2>Every kanji choice for ${esc(d.Name)}</h2>
  <p class="body-copy">Pick a different character for any syllable — love, dreams, strength, light — and the art updates instantly in the <a style="color:var(--gold)" href="../#${encodeURIComponent(d.Name)}">generator</a>.</p>
  ${sylBlocks}

  <h2>Tattoo, gift &amp; wall art ideas</h2>
  <p class="body-copy">${esc(d.kanji)} makes striking vertical calligraphy — a popular choice for a <b>kanji name tattoo</b>, a personalised <b>Japanese name gift</b>, or framed <b>wall art</b>. Because you can read this page, you (and your tattoo artist) know exactly what each character means — no mystery kanji.</p>

  <h2>Questions about ${esc(d.Name)} in kanji</h2>
  ${faq.map(([q, a]) => `<div class="qa"><b>${esc(q)}</b><p>${esc(a)}</p></div>`).join("\n  ")}

  <h2>More names in kanji</h2>
  <div class="rel">${rel.map((w) => `<a href="${w.name}.html">${esc(w.Name)} ${esc(w.kanji)}</a>`).join("")}<a href="index.html">All names →</a></div>

  <footer>Kanji My Name · handcrafted with 愛 · <a href="../">Try your own name →</a></footer>
</div>
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
<meta property="og:description" content="Browse sound-based Japanese kanji options, meanings, and calligraphy art for 500 common names.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kanji My Name">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${SOCIAL_IMAGE}">
<meta name="twitter:card" content="summary">
${ICON}
${FONTS_LINK}
<style>${CSS}${HUB_ART_CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="names-index">
<div class="list-watermark list-watermark-left" aria-hidden="true">名</div>
<div class="list-watermark list-watermark-right" aria-hidden="true">前</div>
<div class="wrap">
  <div class="brand"><a href="../">Kanji My Name</a></div>
  <h1>Names in Japanese Kanji</h1>
  <p class="sub">${all.length} names · ${totalCombos} possible kanji spellings. Each kanji shown here is one sound-based <i>ateji</i> option — open a name to explore other combinations, or <a style="color:var(--gold)" href="../">create your own →</a></p>
  ${Object.keys(groups).sort().map((L) => `<h2>${L}</h2><div class="rel">${groups[L].map((d) => `<a href="${d.name}.html">${esc(d.Name)} ${esc(d.kanji)}</a>`).join("")}</div>`).join("\n  ")}
  <footer>Kanji My Name · handcrafted with 愛 · <a href="../">Try your own name →</a></footer>
</div>
</body>
</html>
`;
}

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
  const urls = [`${SITE}/`, `${SITE}/names/`, ...all.map((d) => `${SITE}/names/${d.name}`)];
  fs.writeFileSync(
    path.join(ROOT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
      `\n</urlset>\n`
  );
}
console.log(`names analyzed: ${all.length} / pages written: ${wrote}${only ? " (--only " + only + ")" : " + index + sitemap.xml"}`);
