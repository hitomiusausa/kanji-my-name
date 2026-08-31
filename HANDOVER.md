# HANDOVER.md — Kanji My Name

最終更新: 2026-08-31 v2（改名・書体8種・縦横切替・$1化）

## 現在地
- ✅ アプリ完成（`index.html` 1ファイル）: 名前→当て字漢字→意味選択→アートPNG DL
- ✅ **改名: Kanji Name Atelier → Kanji My Name**（SEO狙い。リポジトリもrename済み）
- ✅ 本番: https://hitomiusausa.github.io/kanji-my-name/ （repo: hitomiusausa/kanji-my-name）
- ✅ 書体8種（無料3＋Premium5）・名前全体で1書体統一・縦書き/横書き切替
- ✅ Premium $1: 解放コード入力→SHA-256照合→4K/クレジットなし/全書体/限定2スタイル
- ✅ Playwright検証: フォント切替・ロック挙動・解放コード・横1800×1200・PC/SP表示 全PASS

## 🔑 秘密情報（Gumroad商品に載せるもの）
- **Premium解放コード**: `KNA-GOLD-21868594`
- コード変更手順: `printf '%s' "新コード" | shasum -a 256` → `index.html` の `PREMIUM_HASH` 差し替え

## ひとみうさにやってほしいこと（合計30分・これで収益化ON）
1. **Gumroadで商品作成**（15分・無料）
   - 商品名: "Kanji My Name — Premium Pack" / 価格 **$1**
   - 商品内容（テキスト）: 上記の解放コード + "Enter this code on the site → Unlock"
   - 商品URLを `index.html` の `GUMROAD_URL` に貼って `git push`
   - ※$1の手取りは約$0.56/本（Gumroad 10%+決済2.9%+30¢）。本数勝負の価格設定
2. **動作確認**: サイトで名前→DL→コード入力→4K DL・全書体
3. （任意・$12/年）独自ドメイン（例: kanjimyname.com）→ GitHub Pagesに設定

## 収益ロードマップ（$10,000/年への道・正直版）
- $1×18,000本が必要（無施策なら年$500-2K相場観）。鍵は本数を稼ぐバイラル:
- **Phase 1（今月）**: Gumroad接続 + Reddit/Pinterestに数投稿
- **Phase 2**: TikTok/Reels「名前を漢字にしてみた」ショート動画（名前系ジェネレーターはバズ相性◎）
- **Phase 3**: Etsyで印刷版$25物販（同じ生成物の高単価化）
- **Phase 4**: 月1万PV超えでAdSense追加
- 転換率データが取れたら$2.99テストを提案予定（D-8参照）

## 次セッションのTODO候補
- [ ] GUMROAD_URL 差し替え（最優先）
- [ ] OG画像（シェア時サムネ）追加
- [ ] 当て字辞書の拡充（v/th系・女性名-a語尾バリエーション）
- [ ] 独自ドメイン + sitemap.xml + 「What is ateji?」SEOページ
- [ ] フォルダ名が旧名 `kanji-my-name` のまま（動作に影響なし・揃えるなら次回）
