# HANDOVER.md — Kanji My Name

最終更新: 2026-08-31 v3（決済をStripeに決定・サンクスページ実装）

## 現在地
- ✅ アプリ完成（`index.html` 1ファイル）: 名前→当て字漢字→意味選択→アートPNG DL
- ✅ **改名: Kanji Name Atelier → Kanji My Name**（SEO狙い。リポジトリもrename済み）
- ✅ 本番: https://hitomiusausa.github.io/kanji-my-name/ （repo: hitomiusausa/kanji-my-name）
- ✅ 書体8種（無料3＋Premium5）・名前全体で1書体統一・縦書き/横書き切替
- ✅ Premium $1: 解放コード入力→SHA-256照合→4K/クレジットなし/全書体/限定2スタイル
- ✅ Playwright検証: フォント切替・ロック挙動・解放コード・横1800×1200・PC/SP表示 全PASS

## 🔑 秘密情報
- **Premium解放コード**: `KNA-GOLD-21868594`（決済後に `unlock-80b9aa.html` で表示される）
- コード変更手順: `printf '%s' "新コード" | shasum -a 256` → `index.html` の `PREMIUM_HASH` と `unlock-80b9aa.html` の表示を差し替え
- 解放ページURLは非公開（noindex済み・robots.txtには載せない=パスがバレるので）

## ひとみうさにやってほしいこと（Stripe設定・30分で収益化ON）
1. **Stripeアカウント**（個人でOK・無料）: https://dashboard.stripe.com/register
2. **商品作成**: 商品名 "Kanji My Name — Premium Pack" / **$1（USD・一回払い）**
3. **Payment Link作成**: その商品でリンクを作り、**「支払い後」→「ウェブサイトにリダイレクト」**に
   `https://hitomiusausa.github.io/kanji-my-name/unlock-80b9aa.html` を設定（ここでコードが表示される仕組み）
4. できたPayment LinkのURLを `index.html` の `STRIPE_URL`（"#"の所）に貼って `git push`
5. **実買いテスト**: 自分で$1決済→リダイレクト→コード入力→4K/全書体を確認（テストは後で返金してOK。Stripe手数料分だけ消える）
- 手取り目安: $1あたり約$0.90（カード3.6%・海外カード+2%・手数料に消費税）。Gumroad比で約13倍
6. （任意・$12/年）独自ドメイン（例: kanjimyname.com）→ GitHub Pagesに設定

## 収益ロードマップ（$10,000/年への道・正直版）
- 手取り$0.90/本なら約11,000本で$10K（無施策なら年$500-2K相場観）。鍵は本数を稼ぐバイラル:
- **Phase 1（今月）**: Stripe接続 + Reddit/Pinterestに数投稿
- **Phase 2**: TikTok/Reels「名前を漢字にしてみた」ショート動画（名前系ジェネレーターはバズ相性◎）
- **Phase 3**: Etsyで印刷版$25物販（同じ生成物の高単価化）
- **Phase 4**: 月1万PV超えでAdSense追加
- 転換率データが取れたら$2.99テストを提案予定（D-8参照）

## 次セッションのTODO候補
- [ ] STRIPE_URL 差し替え（最優先・ひとみうさのPayment Link待ち）
- [ ] OG画像（シェア時サムネ）追加
- [ ] 当て字辞書の拡充（v/th系・女性名-a語尾バリエーション）
- [ ] 独自ドメイン + sitemap.xml + 「What is ateji?」SEOページ
- [ ] フォルダ名が旧名 `kanji-my-name` のまま（動作に影響なし・揃えるなら次回）
