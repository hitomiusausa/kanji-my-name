#!/usr/bin/env node
// build-locale-names.mjs — FR/IT/ID name pages read the way that country says them (D-56).
// Spec: _local/locale-names-spec-20261118.md  (data format §1, generator §2, pages §3, gates §4)
//
// BUILD ORDER (after editing tools/locales/*.json or tools/i18n-strings.mjs):
//   1. node tools/build-locale-names.mjs   validates the JSON, rewrites the LOCALE_NAMES block in
//                                          index.html, writes /fr/prenoms/ /it/nomi/ /id/nama/
//                                          (+ list pages) and re-runs tools/build-i18n.mjs so the
//                                          /fr/ /it/ /id/ landing grids link to the local pages.
//   2. node tools/build-names.mjs          the ONLY sitemap owner: sitemap-pages.xml picks up the
//                                          locale URLs from the same JSON (locale-names-lib.mjs).
//   3. node tools/test-romaji.mjs          0 failed.
// English /names/* pages are not touched by step 1 (step 2 regenerates them byte-identically).
//
// Single-source rule: no dictionary is copied here — ATEJI/tokenize/pickDefaults are extracted from
// index.html (locale-names-lib.mjs → extractEngine), so page kanji == generator kanji for #Name@lc.
// Optional per-name field: "defaults": ["天","伊"] = one kanji per token of tokenize(art), each an
// existing ATEJI option for that token; replaces pickDefaults on the page AND in the generator (p).
// Usage: node tools/build-locale-names.mjs [--check]   (--check = validate only, write nothing)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { STRINGS, LOCALE_NAME_STRINGS } from "./i18n-strings.mjs";
import {
  LOCALES, LOCALE_DIRS, loadLocaleNames, loadLocaleMeanings, extractEngine, analyzeLocaleName,
  foldName, I18N_CSS, I18N_FONTS_LINK, CF_BEACON_SNIPPET,
} from "./locale-names-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://kanji.kugainc.com";
const SOCIAL_IMAGE = `${SITE}/image/kanjimyname.png?v=2`;
const METRICS = "https://kanji-my-name-metrics.hitomiusausa.workers.dev/e";
const RELATED_COUNT = 8;
const CHECK_ONLY = process.argv.includes("--check");

const INDEX = path.join(ROOT, "index.html");
const src = fs.readFileSync(INDEX, "utf8");
const ENGINE = extractEngine(src);
const { ATEJI, tokenize, trueSound } = ENGINE;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stripTags = (s) => String(s).replace(/<[^>]+>/g, "");

// ---- 1. load + validate (fail loudly, listing every offender) ----
const KATAKANA = /^[ァ-ヺー]+$/; // ァ–ヺ + ー (no ・, no hiragana, no Latin)
const data = {};
const errors = [];
const missingGloss = {};
for (const lc of LOCALES) {
  const names = loadLocaleNames(ROOT, lc);
  const meanings = loadLocaleMeanings(ROOT, lc);
  const seen = new Set();
  names.forEach((n, i) => {
    const where = `${lc}-names.json[${i}] ${n && n.slug}`;
    const bad = (msg) => errors.push(`${where}: ${msg}`);
    if (!n || typeof n !== "object") return bad("not an object");
    if (!/^[a-z]+$/.test(n.slug || "")) bad(`slug must be a–z only (got ${JSON.stringify(n.slug)})`);
    else if (seen.has(n.slug)) bad("duplicate slug");
    seen.add(n.slug);
    if (!n.display || typeof n.display !== "string") bad("display missing");
    else if (foldName(n.display).toLowerCase() !== n.slug) bad(`display "${n.display}" does not fold to the slug (generator hash would not match)`);
    if (!KATAKANA.test(n.kana || "")) bad(`kana must be katakana only (got ${JSON.stringify(n.kana)})`);
    if (!/^[a-zāīūēō]+$/.test(n.romaji || "")) bad(`romaji must be Hepburn a–z with macrons (got ${JSON.stringify(n.romaji)})`);
    if (!/^[a-z]+$/.test(n.art || "")) bad(`art must be a–z only, no long vowels (got ${JSON.stringify(n.art)})`);
    else {
      const t = tokenize(n.art);
      if (t.join("") !== n.art) bad(`art "${n.art}" does not tokenize fully (got ${t.join("-") || "nothing"})`);
      else if (t.length > 8) bad(`art "${n.art}" needs ${t.length} kanji (generator MAX_KANJI is 8)`);
      else {
        for (const tok of t) for (const [, en] of ATEJI[tok]) if (!meanings[en]) (missingGloss[lc] ??= new Set()).add(en);
        // optional "defaults": one kanji per token, each an existing option of that token
        if (n.defaults !== undefined) {
          if (!Array.isArray(n.defaults) || n.defaults.length !== t.length) bad(`defaults must list ${t.length} kanji (one per token ${t.join("-")}), got ${JSON.stringify(n.defaults)}`);
          else n.defaults.forEach((k, j) => {
            if (!ATEJI[t[j]].some(([kk]) => kk === k)) bad(`defaults[${j}] "${k}" is not an option for "${t[j]}" (options: ${ATEJI[t[j]].map(([kk]) => kk).join(" ")})`);
          });
        }
      }
    }
    if (!["f", "m", "u"].includes(n.gender)) bad(`gender must be "f" | "m" | "u" (got ${JSON.stringify(n.gender)})`);
  });
  data[lc] = { names, meanings };
}
if (errors.length) {
  console.error(`✗ locale name data has ${errors.length} problem(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
for (const [lc, set] of Object.entries(missingGloss)) {
  console.warn(`WARN ${lc}: ${set.size} English gloss(es) without a ${lc} translation (shown in English with a note): ${[...set].join(" | ")}`);
}
if (CHECK_ONLY) {
  console.log("locale data OK: " + LOCALES.map((lc) => `${lc} ${data[lc].names.length}`).join(", "));
  process.exit(0);
}

// ---- 2. index.html: LOCALE_NAMES block (generator data, never hand-edited) ----
const block = {};
for (const lc of LOCALES) {
  block[lc] = Object.fromEntries(data[lc].names.map((n) => {
    const e = { d: n.display, k: n.kana, r: n.romaji, a: n.art };
    if (n.defaults) { const t = tokenize(n.art); e.p = n.defaults.map((k, i) => ATEJI[t[i]].findIndex(([kk]) => kk === k)); }
    return [n.slug, e];
  }));
}
const MARK = /(\/\* locale-names:start \*\/\n)[\s\S]*?(\n\/\* locale-names:end \*\/)/;
if (!MARK.test(src)) throw new Error("index.html: locale-names markers missing");
const newSrc = src.replace(MARK, (_, a, b) => `${a}const LOCALE_NAMES=${JSON.stringify(block)};${b}`);
if (newSrc !== src) fs.writeFileSync(INDEX, newSrc);

// ---- 3. pages ----
const PAGE_CSS = I18N_CSS + `
.crumbs{font-size:12.5px;color:var(--muted);margin:22px 0 0;display:flex;flex-wrap:wrap;gap:2px 8px}
.crumbs a{color:var(--muted);text-decoration:none;border-bottom:1px solid var(--line)}
.crumbs a:hover{color:var(--ink)}
.hero{display:grid;grid-template-columns:200px minmax(0,1fr);gap:32px;align-items:start;margin:30px 0 0}
.kcard{position:relative;aspect-ratio:2/3;width:100%;background:radial-gradient(ellipse 90% 70% at 30% 18%,#f7efdf,#e7dbc1 78%);color:#1b1812;box-shadow:0 0 50px rgba(184,146,80,.12),0 20px 40px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:20px 0;overflow:hidden}
.kcard-k{writing-mode:vertical-rl;font-family:'Yuji Syuku',serif;font-size:var(--ks,60px);line-height:1.05;letter-spacing:.06em}
.kcard-seal{position:absolute;left:14px;bottom:14px;width:24px;height:24px;background:var(--seal);color:#fdf6ea;font-family:'Yuji Syuku',serif;font-size:14px;display:flex;align-items:center;justify-content:center;border-radius:3px;transform:rotate(-4deg)}
.kcard-name{position:absolute;right:12px;bottom:12px;font-family:'Space Grotesk',sans-serif;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(27,24,18,.55)}
@media(max-width:640px){.hero{grid-template-columns:1fr;gap:24px}.kcard{width:180px;margin:0 auto}}
.sc-copy{font-family:'Space Grotesk',sans-serif;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);background:transparent;border:1px solid var(--line);min-height:28px;padding:4px 10px;margin-right:.7em;vertical-align:.35em;cursor:pointer}
.sc-copy:hover,.sc-copy:focus-visible{border-color:var(--gold)}
.sc-copy.done{color:var(--ink);border-color:var(--gold)}
.cta-row{margin:30px 0 0}
.cta-note{font-size:12.5px;color:var(--muted);margin:10px 0 0}
table{border-collapse:collapse;width:100%;max-width:760px;font-size:15px;margin:14px 0 0}
td,th{border:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:middle}
th{font-family:'Space Grotesk',sans-serif;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}
td .kj{font-family:'Yuji Syuku',serif;font-size:26px;color:var(--head)}
.apx{color:var(--muted);font-size:.85em;letter-spacing:.04em}
.small-note{font-size:12.5px;color:var(--muted);max-width:720px}
.syl{font-family:'Space Grotesk',sans-serif;font-size:12px;letter-spacing:.12em;color:var(--muted);margin:22px 0 0}
.alts{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 4px}
.alt{position:relative;border:1px solid var(--line);background:var(--panel);padding:10px 14px;min-width:96px;max-width:100%;text-align:center}
.alt .kj{font-family:'Yuji Syuku',serif;font-size:30px;color:var(--head);display:block}
.alt .mm{font-size:11.5px;line-height:1.4;color:var(--gold);display:block}
.alt .apx{display:block;font-size:10px;margin-top:2px}
.alt.sel{border:2px solid var(--gold);background:rgba(184,146,80,.08);padding:9px 13px}
.seal-sel{font-style:normal;font-family:'Yuji Syuku',serif;font-size:11px;color:var(--seal);background:#e8e2d5;border:1px solid var(--seal);width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;border-radius:2px;transform:rotate(-6deg);position:absolute;top:6px;right:6px}
.selline{display:block;font-family:'Space Grotesk',sans-serif;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-top:4px}
.rel{display:flex;flex-wrap:wrap;gap:8px}
.rel a{border:1px solid var(--line);color:var(--ink);text-decoration:none;padding:7px 14px;font-size:13px}
.rel a:hover{border-color:var(--gold)}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
`;

const ICON = `<link rel="icon" type="image/png" href="../../image/kanjimyname-icon.png?v=2">`;
const FOOTER = `<footer><a href="../../" class="flogo" aria-label="Kanji My Name"><img src="../../image/kanjilogo-footer.png" alt="Kanji My Name logo" width="84" height="84" loading="lazy"></a><div>Kanji My Name · © <a href="https://kugainc.com/en/" rel="noopener">KUGA Inc.</a> · <a href="../../about" hreflang="en">About</a> · <a href="../../terms" hreflang="en">Terms</a> · <a href="../../tokushoho" hreflang="en">Legal Notice</a></div><div style="margin-top:6px" lang="en">Made in Japan by a native speaker &amp; Japanese-language teacher</div></footer>`;

// French typography (same rule as build-i18n.mjs): no-break space before : ; ? ! » and after «.
const finish = (lc, html) => (lc === "fr" ? html.replace(/ ([:;?!»])(?=[\s<"])/g, " $1").replace(/« /g, "« ") : html);

function head(lc, { title, description, url, ogTitle, ld, ogType }) {
  const S = STRINGS[lc];
  return `<!DOCTYPE html>
<html lang="${S.htmlLang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${url}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Kanji My Name">
<meta property="og:locale" content="${S.ogLocale}">
<meta property="og:image" content="${SOCIAL_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
${ICON}
${I18N_FONTS_LINK}
<style>${PAGE_CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${CF_BEACON_SNIPPET}
</head>`;
}

const meanHtml = (ms) => ms.map((m) => (m.en ? `<span lang="en">${esc(m.text)}</span>` : esc(m.text))).join(" · ");

function namePage(lc, a, all) {
  const S = STRINGS[lc], LS = LOCALE_NAME_STRINGS[lc];
  const dir = LOCALE_DIRS[lc];
  const url = `${SITE}/${lc}/${dir}/${a.slug}`;
  const listUrl = `${SITE}/${lc}/${dir}/`;
  // raw values for text/JSON-LD, escaped values for HTML
  const raw = {
    D: a.display, K: a.kana, R: a.romaji, H: a.hira, kanji: a.kanji,
    mean: a.meaningsLoc.map((m) => m.text).join(" · "), combos: a.combos.toLocaleString("en-US"),
    n: a.toks.length, toks: a.toks.join(" · "),
  };
  const h = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, esc(v)]));
  const faqRaw = LS.faq(raw), faqHtml = LS.faq(h);
  const genHref = `../../#${encodeURIComponent(foldName(a.display))}@${lc}`;
  const anyApprox = a.toks.some((t, i) => a.variants[i].some((e) => trueSound(t, e) !== t));
  const anyFallback = a.toks.some((t, i) => a.variants[i].some(([, en]) => a.locMeaning(en).en));
  const idx = all.findIndex((x) => x.slug === a.slug);
  const rel = [];
  for (let o = 1; rel.length < Math.min(RELATED_COUNT, all.length - 1) && o < all.length; o++) {
    for (const j of [idx + o, idx - o]) {
      const w = all[(j + all.length) % all.length];
      if (w && w.slug !== a.slug && !rel.includes(w) && rel.length < RELATED_COUNT) rel.push(w);
    }
  }
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: LS.h1(raw), inLanguage: S.htmlLang,
        description: LS.description(raw), isPartOf: { "@id": `${SITE}/#website` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Kanji My Name", item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: S.breadcrumbName, item: `${SITE}/${lc}/` },
          { "@type": "ListItem", position: 3, name: LS.listH1, item: listUrl },
          { "@type": "ListItem", position: 4, name: LS.nameCrumb(raw), item: url },
        ],
      },
      {
        "@type": "FAQPage", "@id": `${url}#faq`, inLanguage: S.htmlLang,
        mainEntity: faqRaw.map(([q, ans]) => ({ "@type": "Question", name: stripTags(q), acceptedAnswer: { "@type": "Answer", text: stripTags(ans) } })),
      },
    ],
  };
  const ks = Math.min(60, Math.floor(250 / Math.max(1, a.toks.length)));
  const copyBtn = (script, label) =>
    `<button type="button" class="sc-copy" data-copy="${esc(script)}" aria-label="${esc(LS.copyAria(raw, label))}">${esc(LS.copy)}</button>`;
  const soundCell = (t, e) => {
    const ts = trueSound(t, e);
    return ts === t ? esc(t) : `${esc(t)} <span class="apx">(≈ ${esc(ts)})</span>`;
  };
  const html = `${head(lc, { title: LS.title(raw), description: LS.description(raw), url, ogTitle: LS.ogTitle(raw), ld, ogType: "article" })}
<body>
<div class="wrap">
  <div class="top"><div class="brand"><a href="../../">Kanji My Name</a></div></div>
  <nav class="crumbs" aria-label="Breadcrumb"><a href="../">${esc(S.breadcrumbName)}</a><span aria-hidden="true">›</span><a href="./">${esc(LS.listH1)}</a></nav>

  <h1>${esc(LS.h1(raw))}</h1>
  <p class="lead">${LS.sub(h)}</p>

  <div class="hero">
    <div class="kcard" role="img" aria-label="${esc(LS.cardAria(raw))}" style="--ks:${ks}px"><span class="kcard-k" lang="ja">${esc(a.kanji)}</span><span class="kcard-seal" aria-hidden="true">名</span><span class="kcard-name" aria-hidden="true">${esc(a.display)}</span></div>
    <div>
      <h2 style="margin-top:0">${LS.scriptsH2(h)}</h2>
      <dl class="scripts">
        <div class="sc-row"><dt>Katakana</dt><dd><span class="sc-script" lang="ja">${h.K}</span>${copyBtn(a.kana, "katakana")}<span class="romaji">(${h.R})</span><span class="sc-why">${LS.kataWhy(h)}</span></dd></div>
        <div class="sc-row"><dt>Hiragana</dt><dd><span class="sc-script" lang="ja">${h.H}</span>${copyBtn(a.hira, "hiragana")}<span class="sc-why">${LS.hiraWhy}</span></dd></div>
        <div class="sc-row"><dt>Kanji</dt><dd><span class="sc-script sc-kanji" lang="ja">${h.kanji}</span><span class="sc-why">${LS.kanjiWhy(h)}</span></dd></div>
      </dl>
    </div>
  </div>

  <div class="cta-row">
    <a class="cta" href="${genHref}" onclick="try{navigator.sendBeacon&&navigator.sendBeacon('${METRICS}?k=np_cta&s=${lc}')}catch(e){}">${esc(LS.cta(raw))}</a>
    <p class="cta-note">${esc(LS.ctaNote)}</p>
  </div>

  <h2>${LS.breakdownH2(h)}</h2>
  <p class="body-copy">${LS.breakdownIntro(h)}</p>
  <table>
    <tr><th>${esc(LS.th[0])}</th><th>${esc(LS.th[1])}</th><th>${esc(LS.th[2])}</th></tr>
    ${a.toks.map((t, j) => { const e = a.variants[j][a.picks[j]]; return `<tr><td>${soundCell(t, e)}</td><td><span class="kj" lang="ja">${esc(e[0])}</span></td><td>${meanHtml([a.meaningsLoc[j]])}</td></tr>`; }).join("\n    ")}
  </table>
  ${anyApprox ? `<p class="small-note">${esc(LS.approxNote)}</p>` : ""}
  ${anyFallback ? `<p class="small-note">${esc(LS.fallbackNote)}</p>` : ""}

  <h2>${LS.choicesH2(h)}</h2>
  <p class="body-copy">${LS.choicesIntro}</p>
  ${a.toks.map((t, i) => `<p class="syl">${esc(LS.sylLine(t, a.variants[i].length))}</p>
  <div class="alts">${a.variants[i].map((e, o) => {
    const sel = o === a.picks[i], ts = trueSound(t, e);
    return `<div class="alt${sel ? " sel" : ""}">${sel ? `<i class="seal-sel" aria-label="${esc(LS.selAria)}">選</i>` : ""}<span class="kj" lang="ja">${esc(e[0])}</span><span class="mm">${meanHtml([a.locMeaning(e[1])])}</span>${ts !== t ? `<span class="apx">≈ ${esc(ts)}</span>` : ""}${sel ? `<span class="selline">${esc(LS.selLabel)}</span>` : ""}</div>`;
  }).join("")}</div>`).join("\n  ")}

  <h2>${LS.faqH2(h)}</h2>
  ${faqHtml.map(([q, ans]) => `<div class="qa"><h3>${q}</h3><p>${ans}</p></div>`).join("\n  ")}

  <h2>${esc(LS.relatedH2)}</h2>
  <div class="rel">${rel.map((w) => `<a href="${w.slug}">${esc(w.display)} <span lang="ja">${esc(w.kana)}</span></a>`).join("")}<a href="./">${esc(LS.allLink)}</a></div>

  <p class="trust">${esc(S.trust)} <a href="../">${esc(S.breadcrumbName)}</a> · <a href="../../about" hreflang="en">${esc(S.about)}</a> · <a href="../../" hreflang="en">${esc(S.toolLink)}</a></p>

  ${FOOTER}
</div>
<span class="sr-only" role="status" aria-live="polite" id="copyStatus"></span>
<script>
document.addEventListener("click",function(e){
  var b=e.target.closest(".sc-copy");if(!b)return;
  var t=b.dataset.copy,st=document.getElementById("copyStatus");
  function ok(){b.textContent=${JSON.stringify(LS.copied)};b.classList.add("done");st.textContent=t;clearTimeout(b._t);b._t=setTimeout(function(){b.textContent=${JSON.stringify(LS.copy)};b.classList.remove("done");st.textContent="";},1600);}
  function manual(){var s=b.parentNode.querySelector(".sc-script"),r=document.createRange();r.selectNodeContents(s);var sel=getSelection();sel.removeAllRanges();sel.addRange(r);}
  function legacy(){var x=document.createElement("textarea");x.value=t;x.setAttribute("readonly","");x.style.cssText="position:fixed;top:0;left:0;opacity:0";document.body.appendChild(x);x.select();var d=false;try{d=document.execCommand("copy")}catch(_){}x.remove();if(d){ok()}else{manual()}}
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(ok,legacy)}else{legacy()}
});
</script>
</body>
</html>
`;
  return finish(lc, html);
}

function listPage(lc, all) {
  const S = STRINGS[lc], LS = LOCALE_NAME_STRINGS[lc];
  const dir = LOCALE_DIRS[lc];
  const url = `${SITE}/${lc}/${dir}/`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", "@id": `${url}#webpage`, url, name: LS.listH1, inLanguage: S.htmlLang,
        description: LS.listDescription(all.length), isPartOf: { "@id": `${SITE}/#website` },
        mainEntity: { "@id": `${url}#names` },
      },
      {
        "@type": "ItemList", "@id": `${url}#names`, name: LS.listH1, numberOfItems: all.length,
        itemListElement: all.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: LS.nameCrumb({ D: a.display }), url: url + a.slug })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Kanji My Name", item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: S.breadcrumbName, item: `${SITE}/${lc}/` },
          { "@type": "ListItem", position: 3, name: LS.listH1, item: url },
        ],
      },
    ],
  };
  const card = (g) => `<a class="nc" href="${g.slug}"><span class="nc-name">${esc(g.display)}</span><span class="nc-kana" lang="ja">${esc(g.kana)}</span><span class="nc-kanji" lang="ja">${esc(g.kanji)}</span><span class="nc-mean">${meanHtml(g.meaningsLoc)}</span></a>`;
  const groups = ["f", "m", "u"].map((gk) => [gk, all.filter((a) => a.gender === gk)]).filter(([, xs]) => xs.length);
  const html = `${head(lc, { title: LS.listTitle, description: LS.listDescription(all.length), url, ogTitle: LS.listH1, ld, ogType: "website" })}
<body>
<div class="wrap">
  <div class="top"><div class="brand"><a href="../../">Kanji My Name</a></div></div>
  <nav class="crumbs" aria-label="Breadcrumb"><a href="../">${esc(S.breadcrumbName)}</a></nav>

  <h1>${esc(LS.listH1)}</h1>
  <p class="lead">${esc(LS.listLead(all.length))}</p>

  ${groups.map(([gk, xs]) => `<h2>${esc(LS.groups[gk])}</h2>
  <div class="ngrid">
    ${xs.map(card).join("\n    ")}
  </div>`).join("\n\n  ")}

  <p class="trust">${esc(S.trust)} <a href="../">${esc(S.breadcrumbName)}</a> · <a href="../../about" hreflang="en">${esc(S.about)}</a> · <a href="../../" hreflang="en">${esc(S.toolLink)}</a></p>

  ${FOOTER}
</div>
</body>
</html>
`;
  return finish(lc, html);
}

const summary = [];
for (const lc of LOCALES) {
  const { names, meanings } = data[lc];
  if (!names.length) { summary.push(`${lc}: no data (skipped)`); continue; }
  const all = names.map((n) => analyzeLocaleName(ENGINE, n, meanings));
  const outDir = path.join(ROOT, lc, LOCALE_DIRS[lc]);
  fs.mkdirSync(outDir, { recursive: true });
  for (const a of all) fs.writeFileSync(path.join(outDir, a.slug + ".html"), namePage(lc, a, all));
  fs.writeFileSync(path.join(outDir, "index.html"), listPage(lc, all));
  summary.push(`${lc}: ${all.length} pages + list → /${lc}/${LOCALE_DIRS[lc]}/`);
}
console.log("locale name pages written —", summary.join("; "));

// ---- 4. landing pages (their grid now lists the locale names) ----
execFileSync(process.execPath, [path.join(ROOT, "tools", "build-i18n.mjs")], { stdio: "inherit" });
console.log("next: node tools/build-names.mjs (sitemap) → node tools/test-romaji.mjs");
