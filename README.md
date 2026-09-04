# Kanji My Name ✦ 漢字

Turn a name into Japanese kanji calligraphy art, then choose the meaning behind every sound-based character.

**Live**: https://kanji.kugainc.com/

## What it does

- Browser-based phonetic *ateji* (当て字) options with curated positive meanings
- Alternative kanji choices for each matching sound
- 12 calligraphy fonts, vertical / horizontal / square layouts, art styles, and hanko seal options
- Free PNG download, direct image sharing, and copyable name links
- Premium Pack: 4K, clean edition, all fonts, exclusive styles, square layouts, and optional seal / meaning lines
- A growing collection of static name pages: https://kanji.kugainc.com/names/

Foreign names do not have one official kanji translation. Each result is one sound-based *ateji* option; visitors can explore alternatives and choose the meanings they prefer.

## Architecture

- `index.html` — static generator UI and client-side kanji logic
- `tools/build-names.mjs` + `tools/names.txt` — generates the growing name collection and `sitemap.xml`
- `names/` — generated, indexable pages; do not hand-edit them
- `worker/` — Cloudflare Worker for unique Premium unlock codes
- `llms.txt` — concise, machine-readable service summary (supplementary; not an SEO ranking mechanism)

No name input is sent to the application server, stored, or tracked.

## Regenerate names pages

```sh
node tools/build-names.mjs
```

## Publish to Cloudflare Pages

Deploy only the public assets: root HTML/text files, `image/`, and `names/`. Do not deploy project docs, local test artifacts, source-control files, or Worker source as Pages assets.

```sh
publish_dir=$(mktemp -d /private/tmp/kanji-my-name-pages.XXXXXX)
mkdir -p "$publish_dir/names" "$publish_dir/image"
cp index.html unlock-80b9aa.html robots.txt sitemap.xml llms.txt "$publish_dir/"
cp -R names/. "$publish_dir/names/"
cp -R image/. "$publish_dir/image/"
npx wrangler pages deploy "$publish_dir" --project-name kanji-my-name --branch main
```
