# Kanji My Name — CLAUDE.md

## プロジェクト概要
外国人の名前を「意味を選べる当て字（ateji）」で漢字化し、書道風アートPNGとしてダウンロードできる完全静的Webアプリ。全世界toC向け・英語UI。（旧名: Kanji Name Atelier → 2026-08-31改名）

- **URL**: https://hitomiusausa.github.io/kanji-my-name/
- **リポジトリ**: hitomiusausa/kanji-my-name（GitHub Pages配信）
- **構成**: `index.html` 1ファイル完結。サーバー・DB・ビルド一切なし
- **収益モデル**: 無料DL（クレジット入り）→ Premium Pack **$1**（Gumroadで解放コード販売、クライアントサイドでSHA-256照合してアンロック）

## 機能
- 当て字変換＋意味ピッカー（チップをタップして漢字の意味を選択）
- アートスタイル: 無料3（Classic/Midnight/Blossom）＋Premium2（Gold Leaf/Sumi Storm）
- **書体8種**（`FONTS`配列）: 無料3（Brush=Yuji Syuku / Mincho=Shippori / Round=Zen Maru）＋Premium5（Hina Mincho / Kaisei Decol / Yusei Magic / Hachi Maru Pop / DotGothic16）
- **縦書き/横書き切替**（縦=1200×1800、横=1800×1200。Premium DLは各2倍の4K）

## 技術メモ
- **フォントは名前全体に1書体を統一適用**（文字ごとに混ぜない設計。`fontCss()`が唯一の参照点）
- canvas描画前に `ensureFont()` で `document.fonts.load(サイズ + 書体, 実際の漢字文字列)` を必ずawait（未ロードだとfillTextが黙ってフォールバックする罠）
- 描画は `render()` 経由で呼ぶ（ensureFont→draw）。draw()直呼び禁止
- 当て字データ: `ATEJI`（音節→[漢字, 英語の意味]）。-n結合音節優先。si/ti/fi等の異表記エイリアスあり
- Premium解放: `PREMIUM_HASH` にコードのSHA-256。**コードはHANDOVER.md参照**。localStorage `kna_premium=1`

## 修正時の掟
- 1ファイル主義を維持（依存追加・ビルド導入は要相談）
- ATEJI追加時は「ポジティブな意味を先頭」（デフォルト選択されるため）
- 書体追加時は Google Fonts の`<link>`と`FONTS`配列の両方を更新
- デプロイ = `git push` のみ
- UI変更後はPC幅とSP幅375pxの両方でPlaywright確認（~/.claude/CLAUDE.md 共通ルール）
