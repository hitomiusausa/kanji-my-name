# Kanji My Name — Project Handover

Last updated: 2026-09-01 (JST)

## Live service

- Primary URL: https://kanji-my-name.pages.dev/
- Name directory: https://kanji-my-name.pages.dev/names/
- GitHub repository: https://github.com/hitomiusausa/kanji-my-name
- Delivery: Cloudflare Pages project `kanji-my-name`, deployed from a staged public-assets directory.

## Current product state

- The generator runs in the browser. It creates sound-based Japanese *ateji* (当て字) name art; it does **not** claim to provide an official Japanese translation of a foreign name.
- Users can choose alternative kanji with the same sound and select the meanings they prefer.
- Free output is a full-size PNG with a small credit line. Premium offers 4K, a clean version, all fonts and exclusive styles, square layouts, plus optional seal / meaning lines.
- `Share image` invokes native sharing when supported and falls back to a downloaded PNG. `Copy share link` copies a generator URL that recreates the chosen name.
- The large favicon asset is `image/kanji my name-favicon.png`.

## Names directory and SEO

- `tools/names.txt` contains 500 English-language names.
- Run `node tools/build-names.mjs` after changing name data or the generator’s sound / kanji logic. It regenerates every `names/*.html` page, the names directory page, and `sitemap.xml`.
- `/names/` is the canonical directory URL; do not use `/names/index.html` in new internal links or the sitemap.
- The names directory has a deliberately asymmetric background: a large, subtle `名` at lower left and `前` at upper right, plus a faint vermilion wash. Keep this treatment on the directory page only, not individual name pages.
- Top page JSON-LD: WebSite, WebApplication, FAQPage. Names directory: CollectionPage + ItemList. Individual name pages: WebPage, BreadcrumbList, FAQPage. The markup must remain aligned with visible page content.
- `llms.txt` documents the service for AI agents, but it is supplemental. Crawlability, useful visible text, internal links, canonical URLs, and page quality remain the actual SEO foundation.

## Verification before publish

```sh
node --check tools/build-names.mjs
node tools/build-names.mjs
git diff --check
```

For UI changes, verify the home page and `/names/` at desktop and 375px width. Check the console, horizontal overflow, title, canonical URL, and the number of directory links.

After deployment, fetch the primary Pages URL and verify the changed markers, `robots.txt`, `sitemap.xml`, and `llms.txt` as applicable.

## Operational notes

- Keep credentials, unlock-code secrets, Stripe URLs, and Worker secrets out of Git. The local `HANDOVER.md` is deliberately ignored because it may contain operationally sensitive information.
- `.playwright-cli/` and `.wrangler/` are local caches / test artifacts and are ignored.
- Cloudflare Pages assets are staged for deployment; do not publish the full repository directory.
- Google Search Console setup and sitemap submission are still an external follow-up. Submit `https://kanji-my-name.pages.dev/sitemap.xml` after verifying ownership.
