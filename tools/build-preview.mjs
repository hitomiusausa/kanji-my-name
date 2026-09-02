#!/usr/bin/env node
// build-preview.mjs — namesページ用の縦長作品プレビューを本体canvasから生成する。
//
// 本体 index.html をローカルの headless Chromium で開き、無料既定値
// (Classic Scroll / 縦 / 朱印あり / 背景・意味あり / Yuji) を明示して描画する。
// D-38 effects.js を含む本体の render() を利用するため、質感変更時は
// `node tools/build-names.mjs && node tools/build-preview.mjs` を実行すること。
//
// 初回のみ: cd tools/og && npm install
// 使い方: node tools/build-preview.mjs [--only maeve] [--variant 2] [--dry-run]
// 出力: image/preview/<name>.jpg（既定読み）および <name>--2.jpg（第2読み）。画像はgit管理外で、
// deploy-pages.sh が公開対象 image/ をステージしてCloudflare Pagesへ載せる。
// `--only abel --variant 2` は第2読みだけを安全に試作する。
//       `--variant` は `--only` と組み合わせてのみ使える。
// 各名前の実際の nameVariants() の件数からジョブを作るため、NAME_SAY の件数を別途複製しない。
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "tools", "og", "noop.js"));
const { chromium } = require("playwright-core");
const MIME = { html: "text/html", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", woff2: "font/woff2", txt: "text/plain", xml: "text/xml", css: "text/css", js: "text/javascript" };

const server = http.createServer((req, res) => {
  const requested = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const target = path.resolve(ROOT, requested);
  // The generator only serves files inside the checkout; reject traversal even on localhost.
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end("forbidden"); return; }
  try {
    const body = fs.readFileSync(target.endsWith(path.sep) ? target + "index.html" : target);
    res.writeHead(200, { "content-type": MIME[target.split(".").pop()] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end("not found");
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));

const list = fs.readFileSync(path.join(ROOT, "tools", "names.txt"), "utf8")
  .split(/\r?\n/).map(name => name.trim().toLowerCase()).filter(name => /^[a-z]+$/.test(name));
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex === -1 ? null : process.argv[onlyIndex + 1];
if (onlyIndex !== -1 && !only) throw new Error("--only requires a name, e.g. --only maeve");
const variantIndex = process.argv.indexOf("--variant");
const variantNumber = variantIndex === -1 ? null : Number(process.argv[variantIndex + 1]);
if (variantIndex !== -1 && (!only || !Number.isInteger(variantNumber) || variantNumber < 1)) {
  throw new Error("--variant requires --only and a 1-based positive integer, e.g. --only abel --variant 2");
}
const dryRun = process.argv.includes("--dry-run");
const names = only ? list.filter(name => name === only) : list;
if (!names.length) throw new Error(only ? `Name not found in tools/names.txt: ${only}` : "No names found");

const outDir = path.join(ROOT, "image", "preview");
fs.mkdirSync(outDir, { recursive: true });
const shell = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const browser = await chromium.launch(fs.existsSync(shell) ? { executablePath: shell } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let done = 0;
let jobCount = 0;

try {
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "load" });
  const variantsByName = await page.evaluate(inputNames => Object.fromEntries(
    // Names outside NAME_DICT still have one valid rule-derived default reading.
    inputNames.map(name => [name, Math.max(1, nameVariants(name).length)])
  ), names);
  const jobs = names.flatMap(name => {
    const count = variantsByName[name];
    if (variantNumber !== null) {
      if (variantNumber > count) throw new Error(`${name} has ${count} reading(s); --variant ${variantNumber} is invalid`);
      return [{ name, reading: variantNumber - 1, count }];
    }
    return Array.from({ length: count }, (_, reading) => ({ name, reading, count }));
  });
  const alternateCount = jobs.filter(job => job.reading > 0).length;
  jobCount = jobs.length;
  console.log(variantNumber === null
    ? `preview jobs: ${jobs.length} (${names.length} canonical + ${alternateCount} alternate reading(s))`
    : `preview jobs: ${jobs.length} (selected reading ${variantNumber} for ${only})`);
  if (dryRun) {
    console.log("dry run: no images written");
  } else {

    for (const { name, reading } of jobs) {
    const displayName = name[0].toUpperCase() + name.slice(1);
    const dataUrl = await page.evaluate(async ({ nm, selectedReading }) => {
      // Set the pronunciation before generate(): it determines syllables, kanji defaults,
      // and the name-derived D-38 texture seed. Reset avoids leaking a prior name's choice.
      variantSel = {};
      variantSel[wordKey(nm)] = selectedReading;
      document.getElementById("nameIn").value = nm;
      if (!generate(false)) return null;
      // Keep the generator independent of future UI-default changes.
      currentStyle = "classic";
      currentFont = "yuji";
      currentOrient = "v";
      sealOn = true;
      meaningsOn = true;
      bgOn = true;
      premium = false;
      await render(false);
      const art = document.getElementById("art"); // native portrait canvas: 1200×1800
      const preview = document.createElement("canvas");
      preview.width = 800; preview.height = 1200; // 1200px long edge; retains the 2:3 artwork ratio
      preview.getContext("2d").drawImage(art, 0, 0, preview.width, preview.height);
      return preview.toDataURL("image/jpeg", 0.80);
    }, { nm: displayName, selectedReading: reading });
    const suffix = reading === 0 ? "" : `--${reading + 1}`;
    if (!dataUrl) { console.warn("skip (no art):", `${name}${suffix}`); continue; }
    fs.writeFileSync(path.join(outDir, `${name}${suffix}.jpg`), Buffer.from(dataUrl.split(",")[1], "base64"));
    done++;
      if (done % 50 === 0) console.log(`  ${done}/${jobs.length}`);
    }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
console.log(`preview images written: ${done}/${jobCount} job(s) -> image/preview/`);
