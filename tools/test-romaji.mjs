#!/usr/bin/env node
// test-romaji.mjs — toRomaji/tokenize の回帰テスト
// 使い方: node tools/test-romaji.mjs
// ロジックは build-names.mjs と同じく本体 index.html から抽出（単一ソース原則）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

function extract(re, label) {
  const m = src.match(re);
  if (!m) throw new Error("extract failed: " + label);
  return m[0];
}
function extractOpt(re) {
  const m = src.match(re);
  return m ? m[0] : "";
}
const code = [
  extract(/const NAME_DICT=\{.*?\};/s, "NAME_DICT"),
  extract(/Object\.assign\(NAME_DICT,\{.*?\}\);/, "NAME_DICT special readings"),
  extract(/const PRESERVE_ART_LONG_VOWELS=.*?;/, "preserved art long vowels"),
  extractOpt(/const NAME_SAY=\{.*?\};/s),
  extract(/const ATEJI\s*=\s*\{[\s\S]*?ATEJI\.ye=ATEJI\.e;/, "ATEJI + aliases"),
  extract(/function pinyinTerminalNgReading\([^)]*\)\{[\s\S]*?\n\}/, "Pinyin terminal -ng rule"),
  extract(/function toRomaji\(name[^)]*\)\{[\s\S]*?\n\}/, "toRomaji"),
  extractOpt(/function nameVariants\([^)]*\)\{[\s\S]*?\n\}/),
  extract(/const KANA_MAP=\{[\s\S]*?\};/, "KANA_MAP"),
  extract(/function toKatakana\([^)]*\)\{[\s\S]*?\n\}/, "toKatakana"),
  extract(/function tokenize\(r\)\{[\s\S]*?\n\}/, "tokenize"),
].join("\n");
const { ATEJI, toRomaji, toKatakana, tokenize, NAME_SAY, nameVariants, pinyinTerminalNgReading } = new Function(
  code +
    "\nreturn {ATEJI,toRomaji,toKatakana,tokenize," +
    "NAME_SAY:typeof NAME_SAY==='undefined'?null:NAME_SAY," +
    "nameVariants:typeof nameVariants==='undefined'?null:nameVariants," +
    "pinyinTerminalNgReading:typeof pinyinTerminalNgReading==='undefined'?null:pinyinTerminalNgReading};"
)();

let pass = 0, fail = 0;
function eq(actual, expected, label) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) { pass++; }
  else { fail++; console.error(`✗ ${label}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`); }
}
function ok(cond, label, detail = "") {
  if (cond) { pass++; }
  else { fail++; console.error(`✗ ${label}${detail ? "  " + detail : ""}`); }
}

// ---- chバグ回帰（2026-09-01 Fix A・辞書に無い綴りで規則パスを検査）----
eq(toRomaji("chai"), "chai", "chai keeps ch (was kuhai)");
eq(toRomaji("chira"), "chira", "ch before i keeps ch");
eq(toRomaji("chose"), "chose", "ch before o keeps ch");
eq(toRomaji("archie"), "aruchie", "mid-word ch keeps ch");

// ---- 既存挙動が壊れていないこと（規則パス）----
eq(toRomaji("camron"), "kamuron", "generic c -> k still works");
eq(toRomaji("cindy"), "sindi", "c before i -> s still works");
eq(toRomaji("christa"), "kurisuta", "ch before consonant -> k still works");
eq(toRomaji("beck"), "beku", "ck -> k still works");
eq(toRomaji("michael"), "maikeru", "NAME_DICT path untouched");
eq(toRomaji("felix"), "feriku", "NAME_DICT + macron norm + final-kusu compression");

// ---- ch系の名前は辞書でカタカナ発音になっている（Fix Bで規則パスから卒業）----
eq(toRomaji("charles"), "charuzu", "charles = チャールズ (dict)");
eq(toRomaji("charlie"), "chari", "charlie = チャーリー (dict)");
eq(toRomaji("richard"), "richado", "richard = リチャード (dict)");
eq(toRomaji("archer"), "acha", "archer = アーチャー (dict)");
eq(toRomaji("nicholas"), "nikorasu", "nicholas = ニコラス ch=k音 (dict)");
eq(toRomaji("malachi"), "marakai", "malachi = マラカイ ch=k音 (dict)");
eq(toRomaji("zachary"), "zakari", "zachary = ザカリー ch=k音 (dict)");
eq(toRomaji("christian"), "kurisuchan", "christian = クリスチャン (dict)");
// che/she エイリアス（je=ji と同じ近似音の前例）
ok(ATEJI.che === ATEJI.chi, "ATEJI.che alias exists");
ok(ATEJI.she === ATEJI.shi, "ATEJI.she alias exists");

// ---- 子音+h綴り（2026-09-03）----
eq(toRomaji("jhon"), "jon", "Jhon = John-style jo+n");
eq(toRomaji("jhonny"), "joni", "Jhonny art reading = jo+ni");
eq(toRomaji("jhonatan"), "jonatan", "Jhonatan = jo-na-tan");
eq(toRomaji("jha"), "ja", "generic jha normalizes to ja");
eq(toRomaji("jhe"), "je", "generic jhe normalizes to je");
eq(toRomaji("jhi"), "ji", "generic jhi normalizes to ji");
eq(toRomaji("jho"), "jo", "generic jho normalizes to jo");
eq(toRomaji("jhu"), "ju", "generic jhu normalizes to ju");
eq(toRomaji("rhys"), "risu", "Rhys art reading = ri+su");
eq(toRomaji("hannah"), "hanna", "Hannah keeps syllabic n");
if (nameVariants) {
  eq(nameVariants("rhys"), ["rīsu"], "Rhys preserves long vowel in raw dictionary reading");
  eq(nameVariants("jhonny"), ["jonī"], "Jhonny preserves long vowel in raw dictionary reading");
}
eq(toKatakana(nameVariants("rhys")[0]), "リース", "Rhys practical katakana = リース");
eq(toKatakana(nameVariants("jhonny")[0]), "ジョニー", "Jhonny practical katakana = ジョニー");
eq(toKatakana(nameVariants("hannah")[0]), "ハンナ", "Hannah practical katakana = ハンナ");

// ---- 拼音由来の語末 -ng（2026-09-04 Phase 1）----
eq(nameVariants("yuying"), ["yūin", "yuingu"], "Yuying exposes Chinese then English readings");
eq(toRomaji("yuying"), "yūin", "Yuying art reading = yū+in (dictionary priority)");
eq(tokenize(toRomaji("yuying")), ["yū", "in"], "Yuying tokenizes as two kanji sounds");
eq(toKatakana(nameVariants("yuying")[0]), "ユーイン", "Yuying practical katakana = ユーイン");
eq(toRomaji("yuying", 1), "yuingu", "Yuying English art reading = yu+in+gu");
eq(tokenize(toRomaji("yuying", 1)), ["yu", "in", "gu"], "Yuying English reading tokenizes as three kanji sounds");
eq(toKatakana(nameVariants("yuying")[1]), "ユイング", "Yuying English practical katakana = ユイング");
eq(NAME_SAY.yuying, ["Chinese reading", "English reading"], "Yuying variant labels identify the reading origin");
ok(ATEJI.yū && ATEJI.yū[0][0] === "優", "yū has 優 as its regular reading without approximation");
eq(pinyinTerminalNgReading("yuying"), "yuin", "Pinyin yuying terminal -ng becomes final n");
eq(pinyinTerminalNgReading("meiling"), "meilin", "Pinyin meiling terminal -ng becomes final n");
eq(pinyinTerminalNgReading("king"), null, "King does not satisfy the Pinyin compound condition");
eq(pinyinTerminalNgReading("sterling"), null, "Sterling does not satisfy the Pinyin compound condition");
eq(pinyinTerminalNgReading("irving"), null, "Irving does not satisfy the Pinyin compound condition");
eq(toRomaji("king"), "kingu", "King rule-path reading is unchanged");
eq(toRomaji("sterling"), "suteringu", "Sterling rule-path reading is unchanged");
eq(toRomaji("irving"), "irubingu", "Irving rule-path reading is unchanged");

// ---- 発音バリアント（2026-09-01設計・NAME_DICT パイプ区切り）----
ok(typeof nameVariants === "function", "nameVariants() exists");
if (nameVariants) {
  eq(nameVariants("abel"), ["eiberu", "aberu"], "abel has two variants");
  eq(nameVariants("Abel "), ["eiberu", "aberu"], "nameVariants normalizes input");
  eq(nameVariants("emma"), ["ema"], "single-reading dict name -> one variant");
  eq(nameVariants("zzznotaname"), [], "unknown name -> no variants");
}
eq(toRomaji("abel"), "eiberu", "variant default = first (US-majority reading)");
eq(toRomaji("abel", 1), "aberu", "variant 1 selects second reading");
eq(toRomaji("abel", 99), "eiberu", "out-of-range variant falls back to default");
ok(NAME_SAY && Array.isArray(NAME_SAY.abel) && NAME_SAY.abel.length === 2,
  "NAME_SAY has labels for every multi-variant name (abel)");
if (nameVariants && NAME_SAY) {
  // 全バリアント名の整合性: ラベル数=読み数、全読みが完全分解できる
  for (const [n, say] of Object.entries(NAME_SAY)) {
    const vs = nameVariants(n);
    ok(vs.length === say.length, `NAME_SAY/${n}: labels match variant count`, `${vs.length} vs ${say.length}`);
  }
  const piped = Object.keys(NAME_SAY);
  for (const n of piped) {
    nameVariants(n).forEach((v, i) => {
      const r = toRomaji(n, i);
      const toks = tokenize(r);
      ok(toks.length > 0 && toks.join("") === r, `variant tokenizes fully: ${n}[${i}]`, `got ${JSON.stringify(toks)} from ${r}`);
    });
  }
}

// ---- Fix B マージ後のカナリア（2026-09-01・カタカナ発音由来辞書）----
eq(toRomaji("autumn"), "otamu", "autumn = オータム (was a-u-tu-mu-n)");
eq(toRomaji("tyler"), "taira", "tyler = タイラー (was chi-re-ru)");
eq(toRomaji("chase"), "cheisu", "chase = チェイス");
eq(toRomaji("caleb"), "keirebu", "caleb default = KAY-leb");
eq(toRomaji("caleb", 1), "karebu", "caleb variant 1 = KAH-leb");
eq(toRomaji("jesus"), "hesusu", "jesus default = hay-SOOS");

// ---- Task 2（2026-09-01 レビュー反映）: 長母音の同字連続を規則パスで圧縮 ----
eq(toRomaji("aaron"), "aron", "aa compresses to one vowel (Aaron != 愛愛…)");
eq(toRomaji("brooke"), "buroke", "oo compresses to one vowel");

// ---- x/ks→久 1字（2026-09-01 レビュー反映2: 語尾クスを圧縮・語中は保持）----
eq(toRomaji("alex"), "areku", "dict final kusu -> ku (Alex)");
eq(toRomaji("max"), "maku", "dict final kusu -> ku (Max)");
eq(toRomaji("knox"), "noku", "dict final kusu -> ku (Knox)");
eq(toRomaji("rex"), "reku", "rule-path final x -> ku");
eq(toRomaji("braxton"), "burakusuton", "mid-word kusu kept (Braxton)");

// ---- 全名前スモーク: names.txt 全員がトークン化でき、全トークンがATEJIに存在 ----
const list = fs
  .readFileSync(path.join(ROOT, "tools", "names.txt"), "utf8")
  .split(/\r?\n/)
  .map((s) => s.trim().toLowerCase())
  .filter((s) => /^[a-z]+$/.test(s));
for (const name of list) {
  const toks = tokenize(toRomaji(name));
  ok(toks.length > 0 && toks.every((t) => ATEJI[t]), `smoke: ${name}`, `got ${JSON.stringify(toks)}`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
