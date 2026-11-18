#!/usr/bin/env node
// test-app-i18n.mjs — checks for the localized generator pages (tools/build-app-i18n.mjs).
// Usage: node tools/test-app-i18n.mjs   (after the build order in tools/build-app-i18n.mjs)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { APP_STRINGS, SAME_AS_EN_OK } from "./app-strings.mjs";
import { STRINGS, I18N_LANGS } from "./i18n-strings.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (c, label, extra) => { if (c) pass++; else { fail++; console.log("FAIL", label, extra === undefined ? "" : JSON.stringify(extra)); } };
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const count = (s, needle) => s.split(needle).length - 1;
const index = read("index.html");

// 1. the build validates en == index.html, every key in every locale, placeholders, element ids,
//    and that fr/it/id/index.html are up to date
let buildOk = true;
try { execFileSync(process.execPath, [path.join(ROOT, "tools", "build-app-i18n.mjs"), "--check"], { stdio: "pipe" }); }
catch (e) { buildOk = false; console.log(String(e.stdout), String(e.stderr)); }
ok(buildOk, "build-app-i18n --check (strings consistent, pages up to date)");

// 2. keys: every key used by index.html exists in every locale table
const keys = new Set([
  ...[...index.matchAll(/\sdata-i18n="([^"]+)"/g)].map((m) => m[1]),
  ...[...index.matchAll(/\sdata-i18n-attr="([^"]+)"/g)].flatMap((m) => m[1].split(";").map((p) => p.split(":")[1])),
  ...Object.keys(JSON.parse(index.match(/^const UI=(\{.*\});$/m)[1])),
]);
ok(keys.size > 100, "index.html exposes the UI keys", keys.size);
for (const lc of ["en", ...I18N_LANGS]) for (const k of keys) ok(typeof APP_STRINGS[lc][k] === "string" && APP_STRINGS[lc][k].length > 0, `${lc} has "${k}"`);

// 3. no English UI leftovers in fr (except brand/proper nouns listed in SAME_AS_EN_OK)
const leftovers = [...keys].filter((k) => APP_STRINGS.fr[k] === APP_STRINGS.en[k] && !SAME_AS_EN_OK.includes(k));
ok(leftovers.length === 0, "fr: no key left in English", leftovers);
const EN_WORDS = /\b(the|your|and|with|download|tap|choose|sealed|share|unlock|meaning|free|create)\b/i;
const frWords = [...keys].filter((k) => !SAME_AS_EN_OK.includes(k) && !k.endsWith("_href") && EN_WORDS.test(APP_STRINGS.fr[k].replace(/<[^>]+>/g, "").replace(/Kanji My Name|Premium|Stripe/g, "")));
ok(frWords.length === 0, "fr: no English words in the French strings", frWords.map((k) => [k, APP_STRINGS.fr[k]]));

// 4. each locale page: generator once, landing sections once, head, assets
for (const lc of I18N_LANGS) {
  const p = `${lc}/index.html`, html = read(p), S = STRINGS[lc];
  ok(html.includes(`<html lang="${S.htmlLang}">`), `${p}: html lang`);
  ok(html.includes(`<link rel="canonical" href="https://kanji.kugainc.com/${lc}/">`), `${p}: canonical`);
  // fr: the title gets French typography (no-break space before : ; ? !), like the body text
  const title = lc === "fr" ? S.title.replace(/ ([:;?!»])/g, "\u00a0$1") : S.title;
  ok(html.includes(`<title>${title.replace(/&/g, "&amp;")}</title>`), `${p}: landing title`);
  // price shown the local way (display only); Stripe link untouched
  const [, pw, pc] = index.match(/const PRICE = "\$(\d+)\.(\d{2})";/);
  const price = { fr: `${pw},${pc}\u00a0$`, it: `${pw},${pc}\u00a0$`, id: `US$${pw},${pc}` }[lc];
  ok(html.includes(`<span id="priceVal">${price}</span>`) && html.includes(`const PRICE = ${JSON.stringify(price)};`), `${p}: local price display`);
  ok(count(html, '<link rel="alternate" hreflang=') === 5, `${p}: 5 hreflang links`);
  ok(count(html, "<h1>") === 1, `${p}: one h1`);
  ok(count(html, 'id="nameIn"') === 1 && count(html, '<canvas id="art"') === 1, `${p}: the generator once`);
  ok(count(html, 'id="premium"') === 1, `${p}: premium section once`);
  ok(count(html, '<section class="lp"') === 1 && count(html, '<dl class="scripts">') === 1 && count(html, '<div class="ngrid">') === 1, `${p}: landing sections once`);
  ok(count(html, '<div class="qa"><h3>') === S.faq.length, `${p}: landing FAQ (${S.faq.length})`);
  ok(!html.includes("en-only:") && !html.includes("About kanji names") && !html.includes("popular-names:start"), `${p}: English FAQ removed`);
  ok(!html.includes('id="nf"'), `${p}: old landing form (hand-off to the English generator) removed`);
  ok(html.includes(`const PAGE_LC="${lc}";`), `${p}: PAGE_LC`);
  ok(html.includes(`&s="+(PAGE_LC||"home")`), `${p}: metrics surface = page language`);
  ok(html.includes(`aria-current="page">${{ fr: "Français", it: "Italiano", id: "Bahasa Indonesia" }[lc]}</a>`), `${p}: language switcher marks ${lc}`);
  const gloss = JSON.parse(html.match(/^const GLOSS=(\{.*\});$/m)[1]);
  ok(Object.keys(gloss).length === Object.keys(JSON.parse(read(`tools/locales/${lc}-meanings.json`))).length, `${p}: GLOSS = ${lc}-meanings.json`);
  // payment / unlock untouched
  for (const re of [/const STRIPE_URL = "[^"]+";/, /const PREMIUM_HASHES = \[[^\]]+\]/, /const WORKER_URL = "[^"]+";/]) ok(html.match(re)?.[0] === index.match(re)?.[0], `${p}: ${re.source.slice(6, 20)} identical to index.html`);
  // every relative URL resolves to a file in the repo
  const urls = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]).concat([...html.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]));
  const bad = [];
  for (const u of urls) {
    if (/^(https?:|#|mailto:|data:)/.test(u) || u === "") continue;
    const rel = path.normalize(path.join(lc, u.split(/[?#]/)[0]));
    const cand = [rel, rel + ".html", path.join(rel, "index.html")].map((c) => path.join(ROOT, c));
    // image/*.png is git-ignored (lives only in the main checkout): accept a path index.html uses itself
    const sameAsEnglish = index.includes(`"${rel.split(path.sep).join("/")}${u.includes("?") ? "?" + u.split("?")[1] : ""}"`);
    if (!cand.some((c) => fs.existsSync(c) && fs.statSync(c).isFile()) && !sameAsEnglish) bad.push(u);
  }
  ok(bad.length === 0, `${p}: all relative links/assets resolve`, bad);
}
// fr: glosses complete, French text present
{
  const fr = read("fr/index.html");
  ok(fr.includes("Créer mes kanji") && fr.includes("Le Pack Premium") && fr.includes("Trois façons d'écrire"), "fr: French generator + landing text present");
  ok(!/>Download PNG<|>Create my kanji|>Surprise me</.test(fr), "fr: no English button labels in the HTML");
  ok(fr.includes('href="prenoms/"') && fr.includes('href="prenoms/chloe"'), "fr: links to /fr/prenoms/");
}

// 5. English index.html: no build artefacts leaked in
ok(index.includes("const PAGE_LC=null;") && index.includes("const GLOSS={};"), "index.html: English defaults in the app-ui block");
ok(index.includes('<html lang="en">') && index.includes("<title>Kanji Name Generator — Create Japanese Kanji Name Art | Kanji My Name</title>"), "index.html: English title unchanged");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
