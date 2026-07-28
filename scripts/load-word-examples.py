#!/usr/bin/env python3
"""
Load generated dictionary examples (scripts/out/examples/level*.jsonl) into
Supabase `word_examples`.

Re-runnable: upserts on (zh, py_norm, seq). Re-checks the level invariant at the
door — the generator already enforces it, but this table is the thing users read,
so nothing goes in unverified.

Usage: python3 scripts/load-word-examples.py [--dry-run] [files...]
"""

import glob
import json
import os
import sys

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHUNK = 500

COLUMNS = {"zh", "py_norm", "level", "seq", "ex_zh", "ex_py",
           "uz", "ru", "en", "max_level", "model"}


def env(name: str) -> str:
    if os.environ.get(name):
        return os.environ[name]
    with open(os.path.join(ROOT, ".env.local"), encoding="utf-8") as fh:
        for line in fh:
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit(f"missing {name}")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    files = args or sorted(glob.glob(os.path.join(ROOT, "scripts/out/examples/level*.jsonl")))

    # Dedupe on the table's unique key. The generator ran per level and was
    # resumable, so a headword can legitimately appear in two files; last wins.
    rows, skipped = {}, 0
    for path in files:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                r = json.loads(line)
                if r["max_level"] > r["level"]:
                    skipped += 1          # must never happen; loud if it does
                    print(f"  OVER-LEVEL, skipped: {r['zh']} -> {r['ex_zh']}", file=sys.stderr)
                    continue
                rows[(r["zh"], r["py_norm"], r["seq"])] = {k: v for k, v in r.items() if k in COLUMNS}

    # A headword can lose a sentence to the over-level check above, leaving a
    # gap (seq 2 with no seq 1). Re-densify so "first example" is always seq 1.
    by_word = {}
    for (zh, py, _), row in sorted(rows.items()):
        by_word.setdefault((zh, py), []).append(row)
    final = []
    for group in by_word.values():
        for i, row in enumerate(sorted(group, key=lambda r: r["seq"]), start=1):
            final.append({**row, "seq": i})

    print(f"{len(final)} sentences / {len(by_word)} headwords"
          f"{f' ({skipped} skipped)' if skipped else ''}")
    if dry:
        return

    url = env("NEXT_PUBLIC_SUPABASE_URL")
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    headers = {"apikey": key, "Authorization": f"Bearer {key}",
               "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}

    for i in range(0, len(final), CHUNK):
        batch = final[i:i + CHUNK]
        r = requests.post(f"{url}/rest/v1/word_examples?on_conflict=zh,py_norm,seq",
                          headers=headers, json=batch, timeout=120)
        if not r.ok:
            raise SystemExit(f"upsert failed {r.status_code}: {r.text[:400]}")
        print(f"  {i + len(batch)}/{len(final)}")
    print("loaded")


if __name__ == "__main__":
    main()
