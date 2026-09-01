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
const code = [
  extract(/const NAME_DICT=\{.*?\};/s, "NAME_DICT"),
  extract(/const ATEJI\s*=\s*\{[\s\S]*?ATEJI\.ye=ATEJI\.e;/, "ATEJI + aliases"),
  extract(/function toRomaji\(name\)\{[\s\S]*?\n\}/, "toRomaji"),
  extract(/function tokenize\(r\)\{[\s\S]*?\n\}/, "tokenize"),
].join("\n");
const { ATEJI, toRomaji, tokenize } = new Function(
  code + "\nreturn {ATEJI,toRomaji,tokenize};"
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

// ---- chバグ回帰（2026-09-01 Fix A）: 母音前の ch を汎用 c→k が壊していた ----
eq(toRomaji("chai"), "chai", "chai keeps ch (was kuhai)");
eq(toRomaji("charles"), "charesu", "charles keeps ch");
eq(toRomaji("charlie"), "charie", "charlie keeps ch");
eq(toRomaji("richard"), "richarudo", "richard keeps ch");
eq(toRomaji("chase"), "chase", "chase keeps ch");
eq(toRomaji("nicholas"), "nichorasu", "nicholas keeps ch");
eq(toRomaji("malachi"), "marachi", "malachi keeps ch");
eq(toRomaji("zachary"), "zachari", "zachary keeps ch");
eq(toRomaji("archer"), "arucheru", "archer keeps ch");

// ---- 既存挙動が壊れていないこと ----
eq(toRomaji("cameron"), "kameron", "generic c -> k still works");
eq(toRomaji("cindy"), "sindi", "c before i -> s still works");
eq(toRomaji("christian"), "kurisutian", "ch before consonant -> k still works");
eq(toRomaji("beck"), "beku", "ck -> k still works");
eq(toRomaji("michael"), "maikeru", "NAME_DICT path untouched");
eq(toRomaji("felix"), "ferikusu", "NAME_DICT + macron norm untouched");

// ---- tokenize統合: ch+母音の名前は必ず ch系トークンを含む ----
for (const name of ["charles", "charlie", "richard", "chase", "nicholas", "malachi", "zachary", "archer"]) {
  const toks = tokenize(toRomaji(name));
  ok(toks.some((t) => t.startsWith("ch")), `${name} tokens include ch-syllable`, `got ${JSON.stringify(toks)}`);
}
// che/she エイリアス（je=ji と同じ近似音の前例）
ok(ATEJI.che === ATEJI.chi, "ATEJI.che alias exists");
ok(ATEJI.she === ATEJI.shi, "ATEJI.she alias exists");

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
