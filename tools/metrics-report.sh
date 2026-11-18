#!/bin/bash
# Daily anonymous click totals (D-55). Usage: bash tools/metrics-report.sh [YYYY-MM]
# Events: gen=Create on home, hash_gen=arrived with #Name (name page/share/LP), dl_free, dl_4k (incl. locked taps),
#         share, buy_click, unlock_ok, np_cta=name-page CTA, lp_cta=FR/IT/ID form. Surface after the last colon.
cd "$(dirname "$0")/../worker/metrics" || exit 1
P="c:${1:-}"
npx wrangler kv key list --binding METRICS --remote --prefix "$P" 2>/dev/null \
 | python3 -c 'import json,sys;[print(k["name"]) for k in json.load(sys.stdin)]' \
 | while read -r k; do printf "%s\t%s\n" "$k" "$(npx wrangler kv key get "$k" --binding METRICS --remote 2>/dev/null)"; done \
 | sed 's/^c://' | sort
