#!/bin/bash
# subset-kouzan.sh — 衡山毛筆フォント行書を index.html で使う漢字だけにサブセット化して
# fonts/kouzan-gyosho-subset.woff2 を再生成する。
#
# ⚠️ ATEJI 辞書に漢字を追加したら必ず再実行すること（CLAUDE.md「修正時の掟」参照）。
#    サブセットに無い漢字は canvas で明朝フォールバックになり、書体「書」だけ字が化ける。
#
# 元フォント: _local/font-src/KouzanGyousho.ttf
#   （配布元: https://opentype.jp/kouzangyousho.htm 武蔵システム・商用利用制限なし）
# 使い方: bash tools/subset-kouzan.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="_local/font-src/KouzanGyousho.ttf"
OUT="fonts/kouzan-gyosho-subset.woff2"
[ -f "$SRC" ] || { echo "✗ 元フォントが無い: $SRC（opentype.jpのbin/KouzanGyousho.zipから展開して配置）"; exit 1; }

VENV=".fonttools-venv"
if [ ! -x "$VENV/bin/pyftsubset" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" -q install fonttools brotli
fi

python3 - << 'EOF'
import re
src = open('index.html', encoding='utf-8').read()
chars = sorted(set(re.findall(r'[㐀-䶿一-鿿豈-﫿]', src)))
open('.subset-chars.txt', 'w', encoding='utf-8').write(''.join(chars))
print(f'kanji to keep: {len(chars)}')
EOF

# gasp/mort/FFTM は元TTFの壊れテーブルなので落とす
"$VENV/bin/pyftsubset" "$SRC" --text-file=.subset-chars.txt --flavor=woff2 \
  --output-file="$OUT" --layout-features='*' --drop-tables+=gasp,mort,FFTM

# カバレッジ検証（欠けがあれば非0終了）
"$VENV/bin/python" - << 'EOF'
from fontTools.ttLib import TTFont
sub = TTFont('fonts/kouzan-gyosho-subset.woff2')
cov = set()
for t in sub['cmap'].tables:
    if t.isUnicode(): cov.update(t.cmap.keys())
want = {ord(c) for c in open('.subset-chars.txt', encoding='utf-8').read()}
missing = [chr(c) for c in sorted(want - cov)]
assert not missing, f"✗ サブセットに欠け: {''.join(missing)}"
print('✓ all kanji covered')
EOF
rm -f .subset-chars.txt
ls -la "$OUT"
echo "✓ done. 反映は git push + bash tools/deploy-pages.sh"
