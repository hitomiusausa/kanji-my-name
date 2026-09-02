/* effects.js — Kanji My Name 後処理エフェクト（D-38 質感改善）
   方針:
   - すべてブラウザ内・Canvas 2D のピクセル処理のみ（SVGフィルタ／ctx.filter は Safari の canvas で効かないため不使用）
   - 乱数は全て「名前由来のシード」(fxRng) → 等倍・Premium 4K・再ダウンロードで同じ見た目
   - 座標は「アート単位」(scale=1 の px) で扱い、scale で追従させる（4K は等倍の忠実な拡大になる）
   - 各エフェクトは FX の定数で ON/OFF・強度を切替。FX を全部オフにすると従来描画と同じ結果になる
*/
"use strict";

// ===== 調整パラメータ（すべてここに集約） =====
const KFX = {
  INK_LEVEL: 1,      // 文字の墨質感 0=off / 1=控えめ(既定) / 2 / 3
  SEAL_LEVEL: 1,     // 落款の押しムラ・かすれ 0=off / 1(既定) / 2 / 3
  STROKE_LEVEL: 1,   // 円相・払いの筆表現 0=従来のスタンプ描画 / 1=毛束ストローク(既定)
  ENSO_ALPHA: 0.6,   // 円相の濃さ（ひとみうさ裁定 2026-09-02: .82→.6 主張を抑える）
  SWEEP_ALPHA: 2.4,  // Sumi Storm 払いの濃さ倍率（3.4→2.4）
  PAPER: {
    enabled: true,
    tint: "kinari",              // "kinari"(生成り=現行色) | "kohshi"(古紙・黄味強め)
    texture: null,               // 紙スキャン(CC0)のパス。**既定 null=手続き生成のみ**（ひとみうさ裁定 2026-09-02）。古紙版は次のバージョンアップで _local/textures/washi-*.webp を使う予定
    textureAlpha: 0.5,           // スキャン乗算の強さ 0..1（既定）
    textureAlphaByStyle: { blossom: 0.42 }, // スキャン使用時のスタイル別強度
    plainStyles: ["shiro"],      // 紙処理を一切かけないスタイル（Pure White は完全な白地）
    byStyle: { blossom: { fibers: 0.45, mottle: 0.025 } }, // Blossom はくすみを抑える（繊維少なめ・ムラ弱め）
    fibers: 1,                   // 手続き生成の繊維・微粒 0=off / 1=既定 / 2=強め
    mottle: 0.05,                // 低周波の明度ムラ（乗算の最大暗さ）
    vignette: 0.03               // 四隅ビネット（旧 0.09）
  },
  STARS: { enabled: true, spacing: 12.5, density: 0.6 }, // spacing=最小星間隔(360px基準単位)。裁定で星数を約4割減（11/.8→12.5/.6）
  LATIN: {                       // 欧文タイポ（Task 4）
    style: "B",                  // "A"=従来(字間スペース+italic) / "B"=トラッキング+スモールキャップス
    family: "'Cormorant Garamond'", weight: 500,
    nameSize: 36, nameTrack: 0.34, meanSize: 20, meanTrack: 0.2,
    color: "#2b2620", nameAlpha: 0.82, meanAlpha: 0.66
  }
};
// レベル→実パラメータ（art px 単位）
const FX_INK_LEVELS = [
  null,
  { disp: 1.0, bleed: 0.28, bleedR: 1.5, kasure: 0.25, mottle: 0 },
  { disp: 1.6, bleed: 0.36, bleedR: 2.0, kasure: 0.40, mottle: 0.04 },
  { disp: 2.2, bleed: 0.45, bleedR: 2.6, kasure: 0.55, mottle: 0.08 }
];
const FX_SEAL_LEVELS = [
  null,
  { disp: 0.7, bleed: 0.22, bleedR: 1.6, kasure: 0.40, mottle: 0.22 },
  { disp: 1.0, bleed: 0.38, bleedR: 2.0, kasure: 0.70, mottle: 0.38 },
  { disp: 1.4, bleed: 0.45, bleedR: 2.4, kasure: 0.85, mottle: 0.45 }
];

// ===== シード付き乱数・ノイズ =====
function fxHash(str){ let h = 2166136261 >>> 0; for (const c of String(str)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
// mulberry32。rng(lo,hi) で [lo,hi) の一様乱数。引数なしで [0,1)
function fxRng(seed){
  let a = (typeof seed === "string" ? fxHash(seed) : seed) >>> 0;
  return function (lo = 0, hi = 1) {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return lo + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (hi - lo);
  };
}
// 2D バリューノイズ（格子ハッシュ・smoothstep 補間）。戻り値 n(x,y) ∈ [0,1]
function fxNoise2D(seed){
  const s = seed >>> 0;
  const lat = (ix, iy) => { let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + s) | 0; h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  return function (x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = lat(ix, iy), b = lat(ix + 1, iy), c = lat(ix, iy + 1), d = lat(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}
function fxFbm(noise, x, y, oct = 3){ let v = 0, a = 1, sum = 0; for (let i = 0; i < oct; i++) { v += noise(x, y) * a; sum += a; x *= 2; y *= 2; a *= .5; } return v / sum; }
// ノイズ場を格子(cell art px)で前計算。ox,oy=アート座標の原点、aw,ah=アート単位の大きさ
function fxField(noise, aw, ah, ox, oy, cell, freq, oct){
  const cw = Math.ceil(aw / cell) + 1, ch = Math.ceil(ah / cell) + 1, d = new Float32Array(cw * ch);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) d[j * cw + i] = fxFbm(noise, (ox + i * cell) / freq, (oy + j * cell) / freq, oct);
  return { d, cw, cell };
}
const fxClamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
function fxIsLight(st){ const h = st.bg1.replace("#", ""); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return (r * .299 + g * .587 + b * .114) / 255 > .5; }
const fxCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };

// ===== 墨処理（文字・落款共通）=====
// layer: 透過キャンバスに墨色で描かれたもの。bbox: デバイスpx。
// o: {scale, seed, disp(art px), bleed(alpha), bleedR(art px), kasure(0..1), mottle(0..1)}
// 1) ノイズ変位で輪郭の機械的な直線を崩す 2) 端・細部ほどかすれ（ブラー被覆率で重み付け）
// 3) 押しムラ(mottle) 4) 縮小→拡大の極薄ハローを下に敷いてにじみ
function fxInkify(layer, bbox, o){
  const S = o.scale, L = layer.getContext("2d");
  const x0 = Math.max(0, Math.floor(bbox.x)), y0 = Math.max(0, Math.floor(bbox.y));
  const x1 = Math.min(layer.width, Math.ceil(bbox.x + bbox.w)), y1 = Math.min(layer.height, Math.ceil(bbox.y + bbox.h));
  const w = x1 - x0, h = y1 - y0; if (w <= 0 || h <= 0) return;
  const img = L.getImageData(x0, y0, w, h), src = img.data;
  const aw = Math.ceil(w / S), ah = Math.ceil(h / S), ox = x0 / S, oy = y0 / S;
  const base = (o.seed * 7919) >>> 0;
  const fD = o.disp > 0 ? [fxField(fxNoise2D(base + 1), aw, ah, ox, oy, 2, 14, 3), fxField(fxNoise2D(base + 2), aw, ah, ox, oy, 2, 14, 3)] : null;
  const fG = o.kasure > 0 ? fxField(fxNoise2D(base + 3), aw, ah, ox, oy, 1, 2.6, 2) : null;
  const fM = o.mottle > 0 ? fxField(fxNoise2D(base + 4), aw, ah, ox, oy, 4, 9, 3) : null;
  // 被覆率（4 art px 相当のぼかし）: 端や細い払いほど低い
  let blur = null, bw = 0, bcell = 4 * S;
  if (o.kasure > 0) {
    bw = Math.ceil(w / bcell); const bh = Math.ceil(h / bcell);
    const bc = fxCanvas(bw, bh), bx = bc.getContext("2d"); bx.drawImage(layer, x0, y0, w, h, 0, 0, bw, bh);
    blur = bx.getImageData(0, 0, bw, bh).data;
  }
  const out = new Uint8ClampedArray(src.length), amp = o.disp * S;
  for (let y = 0; y < h; y++) {
    const ay = (y / S) | 0;
    const rD = fD ? ((ay / 2) | 0) * fD[0].cw : 0, rG = fG ? ay * fG.cw : 0, rM = fM ? ((ay / 4) | 0) * fM.cw : 0, rB = blur ? ((y / bcell) | 0) * bw : 0;
    for (let x = 0; x < w; x++) {
      const ax = (x / S) | 0;
      let sx = x, sy = y;
      if (fD) { const i = rD + ((ax / 2) | 0); sx = Math.round(x + (fD[0].d[i] - .5) * 2 * amp); sy = Math.round(y + (fD[1].d[i] - .5) * 2 * amp); if (sx < 0) sx = 0; else if (sx >= w) sx = w - 1; if (sy < 0) sy = 0; else if (sy >= h) sy = h - 1; }
      const si = (sy * w + sx) * 4, a = src[si + 3]; if (!a) continue;
      const di = (y * w + x) * 4;
      out[di] = src[si]; out[di + 1] = src[si + 1]; out[di + 2] = src[si + 2];
      let f = 1;
      if (fG) { const edge = 1 - blur[(rB + ((x / bcell) | 0)) * 4 + 3] / 255; const g = fG.d[rG + ax]; if (g > .5) f -= o.kasure * edge * (g - .5) * 2; }
      if (fM) { f -= o.mottle * (1 - fxClamp01((fM.d[rM + ((ax / 4) | 0)] - .25) / .5)); }
      out[di + 3] = f >= 1 ? a : a * (f < 0 ? 0 : f);
    }
  }
  img.data.set(out); L.putImageData(img, x0, y0);
  if (o.bleed > 0) {
    const k = Math.max(1, o.bleedR * S), sw = Math.max(1, Math.round(w / k)), sh = Math.max(1, Math.round(h / k));
    const tmp = fxCanvas(sw, sh); tmp.getContext("2d").drawImage(layer, x0, y0, w, h, 0, 0, sw, sh);
    L.save(); L.globalCompositeOperation = "destination-over"; L.globalAlpha = o.bleed; L.imageSmoothingEnabled = true;
    L.drawImage(tmp, 0, 0, sw, sh, x0, y0, w, h); L.restore();
  }
}
function fxInkOpts(level, table, scale, seed){ const p = table[Math.max(0, Math.min(3, level | 0))]; return p ? Object.assign({ scale, seed }, p) : null; }

// ===== 紙（和紙）=====
let fxPaperImg = null, fxPaperSrc = null, fxPaperPromise = null;
// テクスチャ画像の読み込み（同一オリジンの静的ファイルのみ。失敗時は手続き生成のみで続行）
function fxReady(){
  const src = KFX.PAPER.enabled ? KFX.PAPER.texture : null;
  if (src === fxPaperSrc && fxPaperPromise) return fxPaperPromise;
  fxPaperSrc = src; fxPaperImg = null;
  fxPaperPromise = new Promise(res => {
    if (!src) return res();
    const im = new Image(); im.onload = () => { fxPaperImg = im; res(); }; im.onerror = () => res(); im.src = src;
  });
  return fxPaperPromise;
}
// 紙地: ベースの色 → スキャン乗算（cover配置・繰り返しなし）→ 低周波ムラ → 繊維・微粒 → 弱いビネット
function fxPaper(x, W, H, scale, st, rng, styleId){
  const P = Object.assign({}, KFX.PAPER, (KFX.PAPER.byStyle || {})[styleId] || {}), S = scale, aw = W / S, ah = H / S;
  const g = x.createRadialGradient(W * .35, H * .25, 80 * S, W * .5, H * .5, Math.max(W, H) * .95);
  g.addColorStop(0, st.bg1); g.addColorStop(1, fxMix(st.bg1, st.bg2, .55));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (P.tint === "kohshi") { x.save(); x.globalCompositeOperation = "multiply"; x.globalAlpha = .38; x.fillStyle = "#e6d3a6"; x.fillRect(0, 0, W, H); x.restore(); }
  if (fxPaperImg && P.textureAlpha > 0) {
    const im = fxPaperImg, k = Math.max(W / im.width, H / im.height), dw = im.width * k, dh = im.height * k;
    x.save(); x.globalCompositeOperation = "multiply"; x.globalAlpha = (P.textureAlphaByStyle || {})[styleId] ?? P.textureAlpha;
    x.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh); x.restore();
  }
  if (P.mottle > 0) {
    const cell = 6, n = fxNoise2D(fxHash("mottle") ^ (rng(0, 1e9) | 0));
    const cw = Math.ceil(aw / cell), ch = Math.ceil(ah / cell), mc = fxCanvas(cw, ch), mx = mc.getContext("2d"), id = mx.createImageData(cw, ch), d = id.data;
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
      const v = fxClamp01((fxFbm(n, i * cell / 210, j * cell / 210, 3) - .25) / .5), gv = Math.round(255 * (1 - P.mottle * (1 - v))), p = (j * cw + i) * 4;
      d[p] = d[p + 1] = d[p + 2] = gv; d[p + 3] = 255;
    }
    mx.putImageData(id, 0, 0);
    x.save(); x.globalCompositeOperation = "multiply"; x.imageSmoothingEnabled = true; x.drawImage(mc, 0, 0, W, H); x.restore();
  }
  if (P.fibers > 0) {
    const nF = Math.round(650 * P.fibers), nS = Math.round(900 * P.fibers), dark = fxMix(st.bg2, "#3a2e1e", .55); // 繊維色は紙色から導出
    x.save(); x.lineCap = "round";
    for (let i = 0; i < nF; i++) {
      const px = rng(0, aw), py = rng(0, ah), len = rng(5, 34), ang = rng(0, Math.PI * 2), bend = rng(-.7, .7);
      x.globalAlpha = rng(.03, .085); x.strokeStyle = rng() < .62 ? dark : "#ffffff"; x.lineWidth = rng(.5, 1.1) * S;
      x.beginPath(); x.moveTo(px * S, py * S);
      x.quadraticCurveTo((px + Math.cos(ang + bend) * len * .5) * S, (py + Math.sin(ang + bend) * len * .5) * S, (px + Math.cos(ang) * len) * S, (py + Math.sin(ang) * len) * S);
      x.stroke();
    }
    for (let i = 0; i < nS; i++) {
      x.globalAlpha = rng(.03, .08); x.fillStyle = rng() < .5 ? dark : "#ffffff";
      x.beginPath(); x.arc(rng(0, aw) * S, rng(0, ah) * S, rng(.4, 1.2) * S, 0, 7); x.fill();
    }
    x.restore();
  }
  if (P.vignette > 0) {
    const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .42, W / 2, H / 2, Math.max(W, H) * .74);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(35,26,12,${P.vignette})`);
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
  }
}
function fxMix(h1, h2, t){ const c = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const a = c(h1), b = c(h2); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join(""); }

// ===== 星空（Midnight）=====
// ポアソンディスク配置 × 低周波密度ムラ × 月・文字周りの減衰。85% 微光星 / 12% 中 / 3% 明星（光条つき）
function fxPoisson(rng, w, h, r, k = 12){
  const cell = r / Math.SQRT2, gw = Math.ceil(w / cell), gh = Math.ceil(h / cell), grid = new Int32Array(gw * gh).fill(-1), pts = [], active = [];
  const add = p => { pts.push(p); active.push(pts.length - 1); grid[((p[1] / cell) | 0) * gw + ((p[0] / cell) | 0)] = pts.length - 1; };
  add([rng(0, w), rng(0, h)]);
  while (active.length) {
    const ai = rng(0, active.length) | 0, p = pts[active[ai]]; let found = false;
    for (let i = 0; i < k; i++) {
      const a = rng(0, Math.PI * 2), d = rng(r, 2 * r), qx = p[0] + Math.cos(a) * d, qy = p[1] + Math.sin(a) * d;
      if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue;
      const gx = (qx / cell) | 0, gy = (qy / cell) | 0; let ok = true;
      for (let yy = Math.max(0, gy - 2); yy <= Math.min(gh - 1, gy + 2) && ok; yy++) for (let xx = Math.max(0, gx - 2); xx <= Math.min(gw - 1, gx + 2); xx++) {
        const j = grid[yy * gw + xx]; if (j >= 0) { const q = pts[j]; if ((q[0] - qx) ** 2 + (q[1] - qy) ** 2 < r * r) { ok = false; break; } }
      }
      if (ok) { add([qx, qy]); found = true; break; }
    }
    if (!found) { active[ai] = active[active.length - 1]; active.pop(); }
  }
  return pts;
}
// moon:{x,y,r}(device px) / avoid:[{x,y,w,h}](device px) 内は輝度を大きく落とす
function fxStars(x, W, H, scale, rng, moon, avoid){
  const S = scale, aw = W / S, ah = H / S, u = aw / 360, C = KFX.STARS;
  const pts = fxPoisson(rng, aw, ah, C.spacing * u), n = fxNoise2D(rng(0, 1e9) | 0);
  const COL = [["#dfe8ff", .3], ["#fbf8f2", .5], ["#ffe9c9", .2]];
  x.save();
  for (const [ax, ay] of pts) {
    const px = ax * S, py = ay * S;
    if (ax < 66 || ay < 66 || ax > aw - 66 || ay > ah - 66) continue; // 額縁の内側だけ
    const dens = fxClamp01((fxFbm(n, ax / 240, ay / 240, 3) - .3) / .45) * (1 - .55 * Math.pow(ay / ah, 2.2)); // 下ほど疎
    if (rng() > dens * C.density + .08) continue;
    let fade = 1 - .35 * Math.pow(ay / ah, 2); // 下ほど暗く
    if (moon) { const d = Math.hypot(px - moon.x, py - moon.y); if (d < moon.r * 1.08) continue; fade = Math.min(1, Math.pow((d - moon.r) / (2.6 * moon.r), 1.6)); }
    for (const r of avoid || []) if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) fade *= .12;
    if (fade < .03) continue;
    const c = rng(); let rad, al, bright = false;
    if (c < .015) { rad = rng(2, 3); al = rng(.85, 1); bright = true; } else if (c < .15) { rad = rng(1, 1.8); al = rng(.5, .85); } else { rad = rng(.5, 1); al = rng(.22, .55); }
    rad *= u * S; al *= fade;
    const t = rng(); const col = t < COL[0][1] ? COL[0][0] : t < COL[0][1] + COL[1][1] ? COL[1][0] : COL[2][0];
    const gr = x.createRadialGradient(px, py, 0, px, py, rad * 2.6);
    gr.addColorStop(0, col); gr.addColorStop(.32, col + "80"); gr.addColorStop(1, col + "00");
    x.globalAlpha = al; x.fillStyle = gr; x.beginPath(); x.arc(px, py, rad * 2.6, 0, 7); x.fill();
    x.fillStyle = col; x.beginPath(); x.arc(px, py, rad * .72, 0, 7); x.fill();
    if (bright) {
      const len = rad * rng(3, 5); x.lineWidth = Math.max(.6, .55 * u * S); x.globalAlpha = al * rng(.2, .4);
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2, ex = px + Math.cos(a) * len, ey = py + Math.sin(a) * len;
        const lg = x.createLinearGradient(px, py, ex, ey); lg.addColorStop(0, col); lg.addColorStop(1, col + "00");
        x.strokeStyle = lg; x.beginPath(); x.moveTo(px, py); x.lineTo(ex, ey); x.stroke();
      }
    }
  }
  x.restore(); x.globalAlpha = 1;
}

// ===== 毛束ブラシストローク（円相・払い）=====
// path(t)->[x,y] (device px)。毛束 K 本をパスに沿った連続ポリラインとして描く（スタンプ粒なし）。
// 幅・濃度は筆圧プロファイル、かすれは毛ごとの「浮き」(進行方向に平行な筋)で表現。
// o: {w(最大幅 device px), color, alpha(全体), rng, scale, kind:"sweep"|"enso", blend}
function fxBrush(x, path, o){
  const S = o.scale, rng = o.rng, N = 400, raw = [];
  for (let i = 0; i <= N; i++) raw.push(path(i / N));
  let len = 0; const cum = [0];
  for (let i = 1; i <= N; i++) { len += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]); cum.push(len); }
  const step = Math.max(1, o.w / 12), M = Math.max(24, Math.ceil(len / step)), pts = [];
  for (let m = 0, i = 0; m <= M; m++) {
    const target = len * m / M; while (i < N - 1 && cum[i + 1] < target) i++;
    const f = cum[i + 1] > cum[i] ? (target - cum[i]) / (cum[i + 1] - cum[i]) : 0;
    const px = raw[i][0] + (raw[i + 1][0] - raw[i][0]) * f, py = raw[i][1] + (raw[i + 1][1] - raw[i][1]) * f;
    pts.push([px, py]);
  }
  const nrm = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(M, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  // 筆圧プロファイル: 幅倍率 wf(t) と濃度 af(t)
  const wf = t => o.kind === "enso"
    ? (t < .05 ? .95 + .05 * t / .05 : 1 - .16 * t) * (t > .86 ? 1 - (t - .86) / .14 * .7 : 1)
    : (t < .05 ? .55 + .45 * t / .05 : 1) * Math.pow(1 - t, .85) * (t > .9 ? (1 - t) / .1 * .7 + .3 : 1);
  const af = t => (t < .08 ? 1.18 : 1) * (o.kind === "enso" ? (t > .8 ? 1 - (t - .8) / .2 * .45 : 1) : 1 - t * .35);
  // 毛束
  const K = o.kind === "enso" ? 36 : 36, hairs = [];
  for (let k = 0; k < K; k++) { const sgn = rng(-1, 1); hairs.push({ u: Math.sign(sgn) * Math.pow(Math.abs(sgn), .8), tw: rng(.8, 1.6) * o.w / K * 2.6, al: rng(.5, 1), ph: rng(0, 1000), fq: rng(.6, 1.4) }); }
  const gn = fxNoise2D(rng(0, 1e9) | 0);
  const layer = fxCanvas(x.canvas.width, x.canvas.height), L = layer.getContext("2d");
  L.fillStyle = o.color;
  const lift0 = o.kind === "enso" ? .20 : .18;
  const headT = o.kind === "enso" ? .12 : .08; // 起筆区間（全毛接地・墨が乗った実線）
  const wetT = .28;                              // ここまでにかすれが徐々に現れる（序盤は湿った実線）
  {
    // 起筆の「押さえ」: 穂先が斜めに入って丸く押さえられた塊。輪郭は滑らか（低周波の僅かな揺らぎのみ）、後縁は斜めの入筆線
    const p0 = pts[0], p1 = pts[Math.min(M, 3)], tx = p1[0] - p0[0], ty = p1[1] - p0[1], tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
    const w0 = o.w * wf(0), cx = p0[0] + ux * w0 * .30, cy = p0[1] + uy * w0 * .30, ra = w0 * .56, rb = w0 * .54, ph = rng(0, 100), slant = rng(.18, .3) * w0;
    const P = (ex, ey) => [cx + ux * ex - uy * ey, cy + uy * ex + ux * ey];
    L.globalAlpha = 1; L.beginPath();
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), j = 1 + .05 * (gn(ph + c * 1.2, ph + sn * 1.2) - .5) * 2;
      const back = c < 0 ? -c : 0;                       // 後ろ側ほど
      const ex = c * ra * (1 - .22 * back) * j, ey = sn * rb * j + back * slant; // 後縁を平らに＋斜めにずらす＝斜め入筆
      const q = P(ex, ey); L[i ? "lineTo" : "moveTo"](q[0], q[1]);
    }
    L.closePath(); L.fill();
  }
  // 1本の毛 = 浮いていない連続区間ごとのリボン（左右の縁を結んだ多角形）。区間内は一定アルファ
  const ribbon = (run) => {
    if (run.length < 2) return;
    const mid = run[run.length >> 1];
    L.globalAlpha = Math.min(1, mid.al);
    L.beginPath();
    for (let i = 0; i < run.length; i++) { const r = run[i], e = Math.pow(Math.min(1, i / 8, (run.length - 1 - i) / 8), .7), hw = r.tw * r.wn * (.12 + .88 * e) / 2; L[i ? "lineTo" : "moveTo"](r.x + r.nx * (r.off + hw), r.y + r.ny * (r.off + hw)); }
    for (let i = run.length - 1; i >= 0; i--) { const r = run[i], e = Math.pow(Math.min(1, i / 8, (run.length - 1 - i) / 8), .7), hw = r.tw * r.wn * (.12 + .88 * e) / 2; L.lineTo(r.x + r.nx * (r.off - hw), r.y + r.ny * (r.off - hw)); }
    L.closePath(); L.fill();
  };
  for (const hz of hairs) {
    let run = [];
    for (let m = 0; m <= M; m++) {
      const t = m / M, w = o.w * wf(t);
      const g = gn(hz.ph + t * hz.fq * (len / (o.w * 1.6) + 4), hz.u * 2.2); // 1周期≈筆幅1.6本分
      const wet = fxClamp01((t - headT) / (wetT - headT)); // 起筆直後は0（浮かない）→ wetT で通常
      const lift = (lift0 + .42 * t * t + .30 * hz.u * hz.u) * wet; // 終端・外側の毛ほど浮く
      const head = t < headT ? 1 - t / headT : 0; // 起筆: 全毛接地
      if (m * step < o.w * wf(0) * .25) continue; // 毛は押さえの塊の内側（弧長で筆幅の1/4）から走り出す
      if (w <= .2 || (!head && g < lift)) { ribbon(run); run = []; continue; }
      const p = pts[m], nn = nrm[m];
      const al = Math.min(1, (hz.al * af(t) * (.7 + .3 * (g - lift) / (1 - lift))) * (1 + .35 * (1 - wet))); // 序盤は墨が乗って濃い
      if (run.length > 1 && Math.abs(al - run[0].al) > .25) { ribbon(run); run = [run[run.length - 1]]; }
      run.push({ x: p[0], y: p[1], nx: nn[0], ny: nn[1], off: hz.u * w / 2 * (1 + .12 * head), tw: hz.tw * (w / o.w) * (1 + .5 * (1 - wet)), wn: .75 + .5 * gn(hz.ph + 500 + t * 60, hz.u), al });
    }
    ribbon(run);
  }
  // 起筆の飛沫（控えめ）
  L.fillStyle = o.color; const p0 = pts[1], nsp = rng(0, 4) | 0;
  for (let i = 0; i < nsp; i++) { L.globalAlpha = rng(.2, .45); L.beginPath(); L.arc(p0[0] + rng(-1, 1) * o.w * 1.3, p0[1] + rng(-1, 1) * o.w * 1.3, rng(.3, 1.1) * S * (o.w / 20 / S + .5), 0, 7); L.fill(); }
  // 湿潤エッジ（にじみ）
  const bx0 = Math.max(0, Math.min(...pts.map(p => p[0])) - o.w), by0 = Math.max(0, Math.min(...pts.map(p => p[1])) - o.w);
  const bx1 = Math.min(layer.width, Math.max(...pts.map(p => p[0])) + o.w), by1 = Math.min(layer.height, Math.max(...pts.map(p => p[1])) + o.w);
  if (bx1 > bx0 && by1 > by0) {
    const k = 1.6 * S, sw = Math.max(1, Math.round((bx1 - bx0) / k)), sh = Math.max(1, Math.round((by1 - by0) / k)), tmp = fxCanvas(sw, sh);
    tmp.getContext("2d").drawImage(layer, bx0, by0, bx1 - bx0, by1 - by0, 0, 0, sw, sh);
    L.save(); L.globalCompositeOperation = "destination-over"; L.globalAlpha = .3; L.drawImage(tmp, 0, 0, sw, sh, bx0, by0, bx1 - bx0, by1 - by0); L.restore();
  }
  x.save(); x.globalCompositeOperation = o.blend || "source-over"; x.globalAlpha = o.alpha; x.drawImage(layer, 0, 0); x.restore();
}

// ===== 欧文タイポ（Task 4）=====
function fxTracked(x, text, cx, y, track){
  const cs = [...text], ws = cs.map(c => x.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + track * (ws.length - 1);
  let px = cx - tot / 2; const ta = x.textAlign; x.textAlign = "left";
  cs.forEach((c, i) => { x.fillText(c, px, y); px += ws[i] + track; }); x.textAlign = ta;
}
// name: 表示名 / meanings: 意味の配列(空なら意味行なし) / light: 紙が明色か
function fxLatin(x, W, H, scale, st, name, meanings, baseY, light){
  const T = KFX.LATIN, S = scale;
  if (T.style !== "B") {
    x.fillStyle = st.romaji; x.font = `${34 * S}px 'Cormorant Garamond',serif`;
    x.fillText(name.toUpperCase().split("").join(" "), W / 2, baseY);
    if (meanings.length) { x.font = `italic ${25 * S}px 'Cormorant Garamond',serif`; x.fillText(meanings.join("  ·  "), W / 2, baseY + 52 * S); }
    return;
  }
  x.save(); x.fillStyle = light ? T.color : st.ink;
  x.globalAlpha = T.nameAlpha; x.font = `${T.weight} ${T.nameSize * S}px ${T.family},serif`;
  fxTracked(x, name.toUpperCase(), W / 2, baseY - 2 * S, T.nameSize * S * T.nameTrack);
  if (meanings.length) {
    x.globalAlpha = T.meanAlpha; x.font = `${T.weight} ${T.meanSize * S}px ${T.family},serif`;
    fxTracked(x, meanings.map(m => m.toUpperCase()).join("   ·   "), W / 2, baseY + 48 * S, T.meanSize * S * T.meanTrack);
  }
  x.restore();
}
