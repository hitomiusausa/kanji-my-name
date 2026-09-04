#!/usr/bin/env node
// build-og.mjs — 名前別OG画像 (1200×630) を全登録名ぶん生成する
// 本体 index.html を headless Chromium で開き、Classic Scroll・横レイアウト・意味行あり・
// フリー版クレジット入りで描画した canvas を 1200×630 に contain 合成して image/og/<name>.jpg へ保存。
// 画像は git 管理外（.gitignore: image/og/）— deploy-pages.sh の image/ コピーで本番に載る。
// 使い方:  cd tools/og && npm install   (初回のみ・playwright-core)
//          node tools/build-og.mjs [--only sophia]
// ⚠️ 当て字辞書や names.txt を変えたら build-names.mjs と一緒にこれも再実行すること（og:imageの絵とデフォルト表記を同期）
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "tools", "og", "noop.js"));
const { chromium } = require("playwright-core");

const MIME = { html: "text/html", png: "image/png", woff2: "font/woff2", txt: "text/plain", xml: "text/xml", css: "text/css", js: "text/javascript" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  try {
    const body = fs.readFileSync(p.endsWith("/") ? p + "index.html" : p);
    res.writeHead(200, { "content-type": MIME[p.split(".").pop()] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end("not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const list = fs.readFileSync(path.join(ROOT, "tools", "names.txt"), "utf8")
  .split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter((s) => /^[a-z]+$/.test(s));
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const names = only ? list.filter((n) => n === only) : list;

const outDir = path.join(ROOT, "image", "og");
fs.mkdirSync(outDir, { recursive: true });

// ms-playwright キャッシュの headless shell を使う（rev違いはCDP互換・無ければ npx playwright install chromium-headless-shell）
const shell = path.join(process.env.HOME, "Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell");
const browser = await chromium.launch(fs.existsSync(shell) ? { executablePath: shell } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
await page.evaluate(() => { window.scrollTo(0, 0); });

let done = 0;
for (const n of names) {
  const cap = n[0].toUpperCase() + n.slice(1);
  const dataUrl = await page.evaluate(async (nm) => {
    document.getElementById("nameIn").value = nm;
    if (!generate(false)) return null;
    currentOrient = "h"; // 1800×1200 horizontal art
    await render(false);
    const art = document.getElementById("art");
    const og = document.createElement("canvas");
    og.width = 1200; og.height = 630;
    const x = og.getContext("2d");
    const px = art.getContext("2d").getImageData(6, art.height >> 1, 1, 1).data; // paper tone from the art's left edge
    x.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`;
    x.fillRect(0, 0, 1200, 630);
    const s = 630 / art.height, w = Math.round(art.width * s);
    x.drawImage(art, Math.round((1200 - w) / 2), 0, w, 630);
    return og.toDataURL("image/jpeg", 0.82); // 紙テクスチャはJPEG向き（PNGだと1枚500KB超で500枚が重すぎる）
  }, cap);
  if (!dataUrl) { console.warn("skip (no art):", n); continue; }
  fs.writeFileSync(path.join(outDir, n + ".jpg"), Buffer.from(dataUrl.split(",")[1], "base64"));
  done++;
  if (done % 50 === 0) console.log(`  ${done}/${names.length}`);
}
await browser.close();
server.close();
console.log(`og images written: ${done}/${names.length} -> image/og/`);
