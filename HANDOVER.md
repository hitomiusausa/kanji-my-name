# HANDOVER.md — Kanji Name Atelier

最終更新: 2026-08-31（20分チャレンジで v1 完成・公開）

## 現在地
- ✅ アプリ完成（`index.html` 1ファイル）: 名前入力→当て字漢字→意味選択→縦書きアートPNG DL
- ✅ GitHub公開: https://github.com/hitomiusausa/kanji-name-atelier
- ✅ GitHub Pages: https://hitomiusausa.github.io/kanji-name-atelier/
- ✅ Premium解放コードの仕組み実装済み（コード入力→SHA-256照合→4K/クレジットなし/限定スタイル解放）

## 🔑 秘密情報（Gumroad商品に載せるもの）
- **Premium解放コード**: `KNA-GOLD-21868594`
- コードを変えたいとき: `printf '%s' "新コード" | shasum -a 256` → `index.html` の `PREMIUM_HASH` を差し替え

## ひとみうさにやってほしいこと（合計30分・これで収益化ON）
1. **Gumroadアカウントで商品作成**（15分・無料）
   - 商品名: "Kanji Name Atelier — Premium Pack" / 価格 $9
   - 商品内容（テキスト）: 上記の解放コード + 使い方1行（"Enter this code on the site → Unlock"）
   - 商品URLを `index.html` の `GUMROAD_URL` に貼って `git push`
2. **動作確認**: サイトで自分の名前→DL→コード入力→4K DL
3. （任意・$12/年）独自ドメイン取得（例: kanjinameatelier.com）→ GitHub Pagesに設定。SEOに効く

## 収益ロードマップ（$10,000/年への道・正直版）
- **Phase 1（今月）**: Gumroad接続 + Reddit(r/japan系, r/languagelearning)・Pinterestに数投稿
- **Phase 2**: 「名前を漢字にしてみた」ショート動画（TikTok/Reels）。この手の名前系ジェネレーターはバズと相性◎
- **Phase 3**: Etsyで「カスタム漢字ネームアート印刷版」$25〜（同じ生成物を物販化）
- **Phase 4**: トラフィック月1万PV超えたらAdSense追加
- 見通し: 無施策なら年$500-2K / 動画バズ or Etsy併用が当たれば$10K圏。予算残$88はドメイン+Pinterest/Etsy広告テストに

## 次セッションのTODO候補
- [ ] GUMROAD_URL 差し替え（最優先）
- [ ] Playwright実機確認（PC幅/375px）— 20分制約でスクショ検証は未実施
- [ ] OG画像（シェア時のサムネ）追加
- [ ] 当て字辞書の拡充（特に v/f/th 系の音、女性名の -a 語尾バリエーション）
- [ ] 独自ドメイン + sitemap.xml + SEO用「What is ateji?」解説ページ
