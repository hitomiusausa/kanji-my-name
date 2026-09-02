#!/bin/bash
# deploy-pages.sh — Cloudflare Pages へ公開ファイルだけをデプロイする
# 使い方: bash tools/deploy-pages.sh
# 注意: リポジトリ丸ごとのデプロイは禁止（HANDOVER.md等の非公開ファイルを含むため）。
#       公開対象を増やしたら下の PUBLIC_* に追記すること。
set -euo pipefail
cd "$(dirname "$0")/.."

PUBLIC_FILES=(index.html effects.js unlock-80b9aa.html terms.html tokushoho.html about.html robots.txt sitemap.xml sitemap-pages.xml sitemap-images.xml llms.txt _headers googleba92e5e2e65ae807.html BingSiteAuth.xml)
PUBLIC_DIRS=(names guide image fonts)

DIST=".pages-dist"
rm -rf "$DIST"
mkdir "$DIST"
cp "${PUBLIC_FILES[@]}" "$DIST"/
for d in "${PUBLIC_DIRS[@]}"; do cp -R "$d" "$DIST/$d"; done

npx wrangler pages deploy "$DIST" --project-name kanji-my-name --branch main --commit-dirty=true
rm -rf "$DIST"
echo "✓ deployed. verify: https://kanji.kugainc.com/"
