# Kanji Name Atelier — CLAUDE.md

## プロジェクト概要
外国人の名前を「意味を選べる当て字（ateji）」で漢字化し、縦書き書道風アートPNGとしてダウンロードできる完全静的Webアプリ。全世界toC向け・英語UI。

- **URL**: https://hitomiusausa.github.io/kanji-name-atelier/
- **リポジトリ**: hitomiusausa/kanji-name-atelier（GitHub Pages配信）
- **構成**: `index.html` 1ファイル完結。サーバー・DB・ビルド一切なし
- **収益モデル**: 無料DL（クレジット入り）→ Premium Pack $9（Gumroadで解放コード販売、クライアントサイドでSHA-256照合してアンロック）

## 技術メモ
- フォント: Google Fonts（Yuji Syuku=筆文字, Shippori Mincho, Cormorant Garamond, Inter）
- 描画: Canvas 2D。無料=1200×1800、Premium=2400×3600(4K)・クレジットなし
- 当て字データ: `ATEJI` オブジェクト（音節→[漢字, 英語の意味]の配列）。-n結合音節（ken, shin等）を優先マッチ
- 名前→ローマ字: `NAME_DICT`（有名名辞書）→ フォールバックでルール変換（l→r, v→b, 子音クラスタに母音挿入）
- Premium解放: `PREMIUM_HASH` にコードのSHA-256。**コードとハッシュはHANDOVER.md参照**
- localStorage `kna_premium=1` で解放状態を保持

## 修正時の掟
- 1ファイル主義を維持（依存追加・ビルド導入は要相談）
- ATEJI追加時は「ポジティブな意味を先頭」に置く（デフォルト選択されるため）
- デプロイ = `git push` のみ（GitHub Pagesが自動配信）
- UI変更後はPC幅とSP幅375pxの両方でPlaywright確認（~/.claude/CLAUDE.md 共通ルール）
