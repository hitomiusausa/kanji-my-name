#!/usr/bin/env node
// audit-approx.mjs — Task C: ≈（近似読み）フラグの全辞書監査
// ATEJI の全エントリ（音節→漢字）について、その漢字の標準読み（音読み・訓読み・名乗り）に
// 音節が完全一致するかを KANJIDIC2（EDRDG・CC BY-SA）で判定し、
// ≈ フラグ（ATEJIエントリの第3要素 = trueSound）の漏れ・逆パターンを検出する。
// 使い方:
//   node tools/audit-approx.mjs            # 監査のみ・_local/approx_audit.md 出力
//   node tools/audit-approx.mjs --fix      # 漏れ/逆パターンを index.html に自動反映してから再監査
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = path.join(ROOT, "index.html");
const KANJIDIC = path.join(ROOT, "tools", "kanjidic2.xml");
const OUT_MD = path.join(ROOT, "_local", "approx_audit.md");
const FIX = process.argv.includes("--fix");

// ============ 1. index.html から ATEJI/APPROX_SYL/trueSound/KANA_MAP を抽出 ============
function extract(re, label, src) {
  const m = src.match(re);
  if (!m) throw new Error("extract failed: " + label);
  return m[0];
}
function loadLive() {
  const src = fs.readFileSync(INDEX, "utf8");
  const code = [
    extract(/const ATEJI\s*=\s*\{[\s\S]*?ATEJI\.ye=ATEJI\.e;/, "ATEJI + aliases", src),
    extract(/const APPROX_SYL=\{.*?\};/s, "APPROX_SYL", src),
    extract(/function trueSound\([^\n]*\}/, "trueSound", src),
    extract(/const KANA_MAP=\{[\s\S]*?\};/, "KANA_MAP", src),
  ].join("\n");
  const { ATEJI, APPROX_SYL, trueSound, KANA_MAP } = new Function(
    code + "\nreturn {ATEJI,APPROX_SYL,trueSound,KANA_MAP};"
  )();
  return { src, ATEJI, APPROX_SYL, trueSound, KANA_MAP };
}

// ============ 2. かな変換ヘルパー ============
// カタカナ→ひらがな（コードポイント -0x60。KANA_MAP の値の範囲では安全）
function kataToHira(s) {
  return s.replace(/[ァ-ヺ]/g, (c) => String.fromCodePoint(c.codePointAt(0) - 0x60));
}
const DEVOICE = {
  が: "か", ぎ: "き", ぐ: "く", げ: "け", ご: "こ",
  ざ: "さ", じ: "し", ず: "す", ぜ: "せ", ぞ: "そ",
  だ: "た", ぢ: "ち", づ: "つ", で: "て", ど: "と",
  ば: "は", び: "ひ", ぶ: "ふ", べ: "へ", ぼ: "ほ",
  ぱ: "は", ぴ: "ひ", ぷ: "ふ", ぺ: "へ", ぽ: "ほ",
};
function devoiceFirst(s) {
  if (!s) return s;
  const c = s[0];
  return (DEVOICE[c] || c) + s.slice(1);
}

function buildKanaTables(KANA_MAP) {
  // ROMAJI_TO_HIRA: KANA_MAP のローマ字キー→ひらがな
  const ROMAJI_TO_HIRA = {};
  for (const [k, v] of Object.entries(KANA_MAP)) ROMAJI_TO_HIRA[k] = kataToHira(v);
  // HIRA_TO_ROMAJI（逆引き・提案テキスト生成用）: 綴りバリアント（si/ti/tu/zi等）は除外して
  // 標準ヘボン式だけを候補にする
  const SPELLING_VARIANTS = new Set([
    "si", "ti", "tu", "zi", "du", "hu", "fa", "fi", "fe", "fo",
    "pa", "pi", "pu", "pe", "po", "wi", "we", "wo", "je", "che", "she", "ye",
  ]);
  const HIRA_TO_ROMAJI = {};
  for (const [k, v] of Object.entries(ROMAJI_TO_HIRA)) {
    if (SPELLING_VARIANTS.has(k)) continue;
    if (!(v in HIRA_TO_ROMAJI)) HIRA_TO_ROMAJI[v] = k;
  }
  return { ROMAJI_TO_HIRA, HIRA_TO_ROMAJI };
}

function makeConverter(table) {
  const keys = Object.keys(table).sort((a, b) => b.length - a.length);
  return function convert(s) {
    let out = "", i = 0;
    while (i < s.length) {
      let hit = null;
      for (const k of keys) {
        if (s.startsWith(k, i)) { hit = k; break; }
      }
      if (!hit) return null; // 変換不能
      out += table[hit];
      i += hit.length;
    }
    return out;
  };
}

// ============ 3. KANJIDIC2 パース ============
function loadKanjidic() {
  if (!fs.existsSync(KANJIDIC)) {
    console.error(`BLOCKED: ${KANJIDIC} が見つかりません。KANJIDIC2 のダウンロードが必要です。`);
    process.exit(2);
  }
  const xml = fs.readFileSync(KANJIDIC, "utf8");
  const map = new Map(); // kanji -> {on:Set, kunFull:Set, kunStem:Set, nanori:Set}
  const charRe = /<character>([\s\S]*?)<\/character>/g;
  let m;
  while ((m = charRe.exec(xml))) {
    const block = m[1];
    const lit = (block.match(/<literal>(.*?)<\/literal>/) || [])[1];
    if (!lit) continue;
    const on = new Set(), kunFull = new Set(), kunStem = new Set(), nanori = new Set();
    const readingRe = /<reading r_type="([^"]+)">(.*?)<\/reading>/g;
    let rm;
    while ((rm = readingRe.exec(block))) {
      const [, rtype, raw] = rm;
      let val = raw.replace(/^-/, "").replace(/-$/, ""); // 接頭・接尾の "-" は除去
      if (rtype === "ja_on") {
        on.add(kataToHira(val));
      } else if (rtype === "ja_kun") {
        const dot = val.indexOf(".");
        if (dot >= 0) {
          kunStem.add(val.slice(0, dot));
          kunFull.add(val.slice(0, dot) + val.slice(dot + 1));
        } else {
          kunFull.add(val);
          kunStem.add(val);
        }
      }
    }
    const nanoriRe = /<nanori>(.*?)<\/nanori>/g;
    let nm;
    while ((nm = nanoriRe.exec(block))) nanori.add(nm[1]);
    map.set(lit, { on, kunFull, kunStem, nanori });
  }
  return map;
}

// ============ 4. 判定ロジック ============
// tok のひらがな表記が、その漢字の標準読みに「完全一致」するか判定する。
// - on / nanori: 完全一致のみ
// - kun（stem・full）: 完全一致に加え、先頭一文字の清音化（連濁の逆）が一致すれば OK
//   （例: ba → は(kun) は連濁「言葉」の内部読みなので一致扱い。de → て(nanori) は
//   nanori には連濁を適用しないので不一致のまま = 近似）
function matchStandard(tokHira, kd) {
  if (!kd) return null;
  if (kd.on.has(tokHira)) return "on";
  if (kd.nanori.has(tokHira)) return "nanori";
  if (kd.kunFull.has(tokHira) || kd.kunStem.has(tokHira)) return "kun";
  const dv = devoiceFirst(tokHira);
  if (dv !== tokHira) {
    if (kd.kunFull.has(dv) || kd.kunStem.has(dv)) return "kun(rendaku)";
  }
  return null;
}

// 漏れ (missing flag) 時の提案テキストを決める: tokHira と一番近い（prefix関係が最短の）候補を
// 優先し、無ければ on > kun > nanori の優先順で先頭候補を使う。
function suggestReading(tokHira, kd, hiraToRomaji) {
  if (!kd) return null;
  const all = [
    ...[...kd.on].map((h) => ({ h, type: "on" })),
    ...[...kd.kunFull].map((h) => ({ h, type: "kun" })),
    ...[...kd.kunStem].map((h) => ({ h, type: "kun" })),
    ...[...kd.nanori].map((h) => ({ h, type: "nanori" })),
  ];
  let best = null, bestScore = Infinity;
  for (const c of all) {
    let score = null;
    if (c.h.startsWith(tokHira)) score = c.h.length - tokHira.length;
    else if (tokHira.startsWith(c.h) && c.h.length > 0) score = tokHira.length - c.h.length + 0.5;
    else if (c.h.endsWith(tokHira)) score = c.h.length - tokHira.length + 1;
    if (score !== null && score < bestScore) { bestScore = score; best = c; }
  }
  if (!best) {
    const pri = [...kd.on, ...kd.kunFull, ...kd.nanori];
    if (pri.length) best = { h: pri[0] };
  }
  if (!best) return null;
  return hiraToRomaji(best.h);
}

// ============ メイン ============
function run() {
  const { src, ATEJI, APPROX_SYL, trueSound } = loadLive();
  const { ROMAJI_TO_HIRA, HIRA_TO_ROMAJI } = buildKanaTables(loadLive().KANA_MAP);
  const tokToHira = makeConverter(ROMAJI_TO_HIRA);
  const hiraToRomaji = makeConverter(HIRA_TO_ROMAJI);
  const kanjidic = loadKanjidic();
  const approxSylKeys = new Set(Object.keys(APPROX_SYL));

  // 配列参照 -> 最初に見つかったキー（canonical owner）。エイリアス検出用。
  const owner = new Map();
  for (const tok of Object.keys(ATEJI)) {
    const arr = ATEJI[tok];
    if (!owner.has(arr)) owner.set(arr, tok);
  }

  const rows = [];
  const fixes = []; // {tok, kanji, meaning, action:'add'|'remove', value}
  let missing = 0, reverse = 0, ok = 0, skippedSpelling = 0, skippedAlias = 0, unknown = 0;

  for (const tok of Object.keys(ATEJI)) {
    const entries = ATEJI[tok];
    const isAlias = owner.get(entries) !== tok;
    const isSpellingVariant = approxSylKeys.has(tok);
    const tokHira = tokToHira(tok);
    entries.forEach((entry, idx) => {
      const [kanji, meaning] = entry;
      const kd = kanjidic.get(kanji);
      const currentFlag = trueSound(tok, entry) !== tok;
      const currentVal = entry.length > 2 ? entry[2] : null;

      if (isSpellingVariant) {
        rows.push({ tok, kanji, meaning, std: "(APPROX_SYL管轄・対象外)", current: currentVal || `via APPROX_SYL(${APPROX_SYL[tok]})`, verdict: "SKIP(spelling)" });
        skippedSpelling++;
        return;
      }
      if (!kd) {
        rows.push({ tok, kanji, meaning, std: "(KANJIDIC2に無し)", current: currentVal || (currentFlag ? "flagged" : "(none)"), verdict: "SKIP(unknown-kanji)" });
        unknown++;
        return;
      }
      if (tokHira === null) {
        rows.push({ tok, kanji, meaning, std: "(かな変換不能)", current: currentVal || (currentFlag ? "flagged" : "(none)"), verdict: "SKIP(no-kana)" });
        return;
      }
      const matchType = matchStandard(tokHira, kd);
      const exact = matchType !== null;
      const stdList = [...kd.on].map((r) => `on:${r}`)
        .concat([...kd.kunFull].map((r) => `kun:${r}`))
        .concat([...kd.nanori].map((r) => `nanori:${r}`)).join(" / ") || "(読みなし)";

      if (exact && !currentFlag) {
        rows.push({ tok, kanji, meaning, std: stdList, current: "(none)", verdict: `OK 一致(${matchType})` });
        ok++;
      } else if (!exact && currentFlag) {
        rows.push({ tok, kanji, meaning, std: stdList, current: currentVal || `via APPROX_SYL`, verdict: "OK 近似(既にフラグ済み)" });
        ok++;
      } else if (!exact && !currentFlag) {
        // 漏れ
        if (isAlias) {
          rows.push({ tok, kanji, meaning, std: stdList, current: "(none)", verdict: "NEEDS-MANUAL-REVIEW(alias配列・漏れ)" });
        } else {
          const suggestion = suggestReading(tokHira, kd, hiraToRomaji) || tok;
          rows.push({ tok, kanji, meaning, std: stdList, current: "(none)", verdict: `MISSING → add "${suggestion}"` });
          fixes.push({ tok, kanji, meaning, action: "add", value: suggestion });
        }
        missing++;
      } else {
        // exact && currentFlag => 逆パターン
        if (isAlias) {
          rows.push({ tok, kanji, meaning, std: stdList, current: currentVal || "via APPROX_SYL", verdict: "NEEDS-MANUAL-REVIEW(alias配列・逆パターン)" });
        } else if (currentVal === null) {
          // entry[2] が無いのに currentFlag=true になるのは APPROX_SYL 由来だが
          // isSpellingVariant=false のケース → 想定外。手動確認。
          rows.push({ tok, kanji, meaning, std: stdList, current: "via APPROX_SYL(想定外)", verdict: "NEEDS-MANUAL-REVIEW(逆パターン・非alias)" });
        } else {
          rows.push({ tok, kanji, meaning, std: stdList, current: currentVal, verdict: `REVERSE → remove "${currentVal}"` });
          fixes.push({ tok, kanji, meaning, action: "remove", value: currentVal });
        }
        reverse++;
      }
    });
  }

  // ============ 5. --fix: index.html を書き換え ============
  if (FIX && fixes.length) {
    let newSrc = src;
    for (const f of fixes) {
      const km = JSON.stringify(f.kanji);
      const mm = JSON.stringify(f.meaning);
      if (f.action === "add") {
        const before = `[${km},${mm}]`;
        const after = `[${km},${mm},${JSON.stringify(f.value)}]`;
        const count = newSrc.split(before).length - 1;
        if (count === 0) {
          console.error(`WARN: pattern not found for ADD ${f.tok}/${f.kanji}: ${before}`);
          continue;
        }
        if (count > 1) {
          console.error(`WARN: pattern ambiguous (${count}x) for ADD ${f.tok}/${f.kanji}: ${before} — skipped, needs manual fix`);
          continue;
        }
        newSrc = newSrc.split(before).join(after);
      } else if (f.action === "remove") {
        const before = `[${km},${mm},${JSON.stringify(f.value)}]`;
        const after = `[${km},${mm}]`;
        const count = newSrc.split(before).length - 1;
        if (count === 0) {
          console.error(`WARN: pattern not found for REMOVE ${f.tok}/${f.kanji}: ${before}`);
          continue;
        }
        if (count > 1) {
          console.error(`WARN: pattern ambiguous (${count}x) for REMOVE ${f.tok}/${f.kanji}: ${before} — skipped, needs manual fix`);
          continue;
        }
        newSrc = newSrc.split(before).join(after);
      }
    }
    fs.writeFileSync(INDEX, newSrc, "utf8");
    console.log(`--fix: index.html に ${fixes.length} 件の変更を適用しました（詳細は再監査結果を参照）`);
  }

  // ============ 6. レポート出力 ============
  const lines = [];
  lines.push("# ≈（近似読み）フラグ監査結果");
  lines.push("");
  lines.push(`生成: node tools/audit-approx.mjs${FIX ? " --fix" : ""}`);
  lines.push("");
  lines.push(`- 総エントリ数: ${rows.length}`);
  lines.push(`- OK（一致/近似とも現状と整合）: ${ok}`);
  lines.push(`- 漏れ（MISSING、≈が必要なのに付いていない）: ${missing}`);
  lines.push(`- 逆パターン（REVERSE、≈が不要なのに付いている）: ${reverse}`);
  lines.push(`- APPROX_SYL管轄で対象外（綴りバリアント si/ti/tu等）: ${skippedSpelling}`);
  lines.push(`- KANJIDIC2に見つからない漢字: ${unknown}`);
  lines.push("");
  lines.push("| 音節 | 漢字 | 意味 | 標準読み(KANJIDIC2) | 現状フラグ | 判定 |");
  lines.push("|---|---|---|---|---|---|");
  for (const r of rows) {
    lines.push(`| ${r.tok} | ${r.kanji} | ${r.meaning} | ${r.std} | ${r.current} | ${r.verdict} |`);
  }
  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_MD, lines.join("\n") + "\n", "utf8");

  console.log(`total=${rows.length} ok=${ok} missing=${missing} reverse=${reverse} skip(spelling)=${skippedSpelling} skip(unknown-kanji)=${unknown}`);
  console.log(`report: ${OUT_MD}`);
  if (!FIX && (missing > 0 || reverse > 0)) {
    console.log(`\n差分あり。修正するには: node tools/audit-approx.mjs --fix`);
  }
  return { missing, reverse, rows };
}

run();
