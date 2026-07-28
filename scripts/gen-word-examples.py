#!/usr/bin/env python3
"""
Generate level-appropriate example sentences for the public dictionary.

WHY: the first cut mined examples out of the app's own dialogues. Good prose,
wrong pedagogy — 白天 is HSK 1, but the only dialogues using it are HSK 5/6, so a
beginner looking up "daytime" got 我现在都有点神经衰弱了. An example must never be
harder than the word it explains.

So: for a headword at level N, ask the model for sentences built only from
vocabulary at level <= N, then VERIFY that claim ourselves before storing. The
model is not trusted on the constraint — the validator is the gate. Sentences
that still contain an over-level word after a retry are dropped, not downgraded;
a missing example is better than a misleading one.

Levelling rule matches src/lib/hskWordLevels.ts exactly (word's own HSK level,
else the MAX of its characters' levels, else off-list) so the dictionary and the
progressive-pinyin reader can never disagree about what "HSK 2" means.

Usage:
  python3 scripts/gen-word-examples.py --level 1 [--limit 20] [--dry-run]
  python3 scripts/gen-word-examples.py --level 1 --words 白天,天天
"""

import argparse
import json
import os
import re
import sys
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from openai import OpenAI

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# This org has a 30k TPM cap on gpt-4o, which the bulk pass blows through in
# seconds. Generation runs on mini (cheap, high limit) and is policed by the two
# gates below; the proofreader stays on the stronger model because its prompts
# are small and catching bad Chinese is what it is for.
MODEL = os.environ.get("EXAMPLES_MODEL", "gpt-4o-mini")
PROOF_MODEL = os.environ.get("EXAMPLES_PROOF_MODEL", "gpt-4o")
BATCH = 8          # headwords per request — big enough to amortise the vocab list, small enough to stay coherent
WORKERS = 6

# Sentence length ceiling per level. Beginners need short; advanced words need
# room for the context that makes them meaningful.
MAX_CHARS = {1: 9, 2: 11, 3: 14, 4: 18, 5: 22, 6: 24, 7: 26}

TONE_FROM = "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ"
TONE_TO = "aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu"
_TONE = str.maketrans(TONE_FROM, TONE_TO)

HAN = re.compile(r"[一-鿿]")


def toneless(p: str) -> str:
    """Mirror of hsk_words.py_norm (a GENERATED column) — keep the two in step."""
    s = (p or "").translate(_TONE).lower()
    return re.sub(r"[\s'·・\-…]", "", s)


def env(name: str) -> str:
    """Read a var from the environment, falling back to .env.local (not exported by default)."""
    if os.environ.get(name):
        return os.environ[name]
    path = os.path.join(ROOT, ".env.local")
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit(f"missing {name}")


SB_URL = env("NEXT_PUBLIC_SUPABASE_URL")
SB_KEY = env("SUPABASE_SERVICE_ROLE_KEY")
SB_HEADERS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
}


def sb_get(table: str, params: dict) -> list:
    """Paged PostgREST read. ALWAYS ordered — LIMIT/OFFSET without ORDER BY gives
    an unstable window and silently skips rows (this bit us once already)."""
    out, offset = [], 0
    while True:
        p = dict(params, limit=1000, offset=offset)
        r = requests.get(f"{SB_URL}/rest/v1/{table}", headers=SB_HEADERS, params=p, timeout=60)
        r.raise_for_status()
        rows = r.json()
        out.extend(rows)
        if len(rows) < 1000:
            return out
        offset += 1000


# ---------------------------------------------------------------- level data

def load_levels() -> dict:
    """zh -> lowest HSK level the form appears at. Lowest, because if 打 is
    introduced at L1 an L2 learner already knows the form."""
    rows = sb_get("hsk_words", {"select": "zh,level", "order": "zh.asc"})
    lv = {}
    for r in rows:
        z, l = r["zh"], r["level"]
        if z not in lv or l < lv[z]:
            lv[z] = l
    return lv


def load_segwords() -> set:
    with open(os.path.join(ROOT, "content", "segwords.txt"), encoding="utf-8") as fh:
        return {w for w in fh.read().split("\n") if w}


# ---------------------------------------------------------------- validator

def segment(text: str, dic: set) -> list:
    """Greedy longest-match, same as the progressive-pinyin segmenter."""
    t, i, out = list(text), 0, []
    while i < len(t):
        if not HAN.match(t[i]):
            i += 1
            continue
        ln = 0
        for L in range(min(4, len(t) - i), 1, -1):
            if "".join(t[i:i + L]) in dic:
                ln = L
                break
        if not ln:
            ln = 1
        out.append("".join(t[i:i + ln]))
        i += ln
    return out


def grade(text: str, dic: set, lv: dict):
    """Return (max_level, offenders). max_level None => contains an off-list word.

    A word's level is its own HSK level; failing that, the MAX of its characters'
    levels (每天 = max(每 2, 天 1) = 2); failing that, off-list.
    """
    worst, bad, unknown = 0, [], []
    for w in segment(text, dic):
        if w in lv:
            l = lv[w]
        else:
            chars = [lv.get(c) for c in w]
            l = max(chars) if all(c is not None for c in chars) else None
        if l is None:
            unknown.append(w)
        else:
            worst = max(worst, l)
            bad.append((w, l))
    if unknown:
        return None, unknown
    return worst, [w for w, l in bad]


def check(sentence: str, head: str, level: int, dic: set, lv: dict):
    """None if the sentence is acceptable, else a human-readable reason (fed back
    to the model on retry — naming the offending word fixes it far more often
    than repeating the rule)."""
    if head not in sentence:
        return f"does not contain the headword {head}"
    if len(HAN.findall(sentence)) > MAX_CHARS.get(level, 20):
        return f"too long (max {MAX_CHARS.get(level, 20)} Chinese characters)"
    worst, offenders = grade(sentence, dic, lv)
    if worst is None:
        return f"uses words that are not in HSK 3.0 at all: {', '.join(offenders)}"
    if worst > level:
        over = [w for w in offenders if (lv.get(w) or 0) > level or
                (w not in lv and max([lv.get(c, 0) for c in w] or [0]) > level)]
        return f"uses vocabulary above HSK {level}: {', '.join(over) or 'unknown'}"
    return None


# ---------------------------------------------------------------- generation

SYSTEM = """You write example sentences for a Chinese dictionary used by beginner \
and intermediate learners whose native language is Uzbek, Russian or English.

Absolute rules:
1. Every sentence MUST contain the given headword, written exactly as given.
2. Every OTHER word in the sentence must be at or below the stated HSK 3.0 level. \
This is the most important rule. When in doubt, choose the simpler word.
3. Sentences must be natural, everyday Chinese that a real person would say. \
No textbook stiffness, no invented usage. Never coin a form that does not exist \
just to stay inside the level (there is no 星期七 — the day is 星期日/星期天). \
If the level makes a natural sentence impossible, write a shorter one instead.
3a. The two sentences for one headword must differ from each other.
4. Keep them short and concrete. Respect the character limit given.
5. Give tone-marked pinyin, spaced by word (not by character).
6. Translate into Uzbek (LATIN script only, never Cyrillic), Russian, and English. \
The translation must match the sentence exactly, not paraphrase it.

Reply with JSON only: {"items":[{"zh":"<headword>","examples":[\
{"s":"...","py":"...","uz":"...","ru":"...","en":"..."}]}]}"""


def build_prompt(words, level, vocab_hint):
    lines = [
        f"HSK 3.0 level: {level}. Maximum {MAX_CHARS.get(level, 20)} Chinese characters per sentence.",
        "Write 2 example sentences for EACH headword below.",
        "",
    ]
    for w in words:
        lines.append(f"- {w['zh']} ({w['pinyin']}) = {w.get('en') or w.get('uz') or ''}")
    if vocab_hint:
        lines += [
            "",
            f"You may use ONLY these words (plus the headword itself) — this is the complete HSK 1-{level} list:",
            " ".join(vocab_hint),
        ]
    return "\n".join(lines)


def call_model(client, words, level, vocab_hint, extra=""):
    msg = build_prompt(words, level, vocab_hint)
    if extra:
        msg += "\n\n" + extra
    r = client.chat.completions.create(
        model=MODEL,
        temperature=0.7,
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": msg}],
    )
    return json.loads(r.choices[0].message.content).get("items", [])


PROOF_SYSTEM = """You are a native Chinese proofreader checking example sentences \
for a learner's dictionary. For each numbered sentence, decide whether it is \
correct, idiomatic Chinese that a native speaker would actually say, and whether \
the translations match it.

Reject: invented or non-existent forms (星期七, 三本人), wrong grammar, wrong \
measure words, unnatural word order, meaning that does not match the translations, \
or a sentence that is merely a bare word with punctuation.
Accept simple, plain sentences — simple is the point. Do not reject for being easy.

Reply with JSON only: {"verdicts":[{"n":1,"ok":true,"why":""}]}"""


def proofread(client, rows):
    """Second gate: the level validator is mechanical and cannot tell that 星期七
    is not a word. Sentences the model itself won't vouch for are dropped —
    a dictionary that teaches wrong Chinese is worse than one with fewer examples."""
    if not rows:
        return rows
    listing = "\n".join(
        f'{i + 1}. {r["ex_zh"]} | {r["ex_py"]} | en: {r["en"]}' for i, r in enumerate(rows))
    try:
        resp = client.chat.completions.create(
            model=PROOF_MODEL, temperature=0, response_format={"type": "json_object"},
            messages=[{"role": "system", "content": PROOF_SYSTEM},
                      {"role": "user", "content": listing}],
        )
        verdicts = json.loads(resp.choices[0].message.content).get("verdicts", [])
    except Exception:
        return rows                      # proofreader down → keep the validated rows
    bad = {v.get("n") for v in verdicts if v.get("ok") is False}
    kept = [r for i, r in enumerate(rows) if (i + 1) not in bad]
    # seq is a UNIQUE key component, so it must stay dense after a drop.
    out, per = [], {}
    for r in kept:
        n = per.get(r["zh"], 0) + 1
        per[r["zh"]] = n
        out.append({**r, "seq": n})
    return out


def gen_batch(client, words, level, vocab_hint, dic, lv, log):
    """Generate, validate, retry the failures once, return accepted rows."""
    by_zh = {w["zh"]: w for w in words}
    accepted = {}

    def absorb(items):
        retry = []
        for it in items:
            head = it.get("zh")
            if head not in by_zh:
                continue
            good = accepted.setdefault(head, [])
            for ex in it.get("examples", []):
                s = (ex.get("s") or "").strip()
                if not s or len(good) >= 2:
                    continue
                if any(g["ex_zh"] == s for g in good):   # 上 came back with the same sentence twice
                    continue
                why = check(s, head, level, dic, lv)
                if why:
                    retry.append((head, s, why))
                    continue
                worst, _ = grade(s, dic, lv)
                good.append({
                    "zh": head, "py_norm": toneless(by_zh[head]["pinyin"]), "level": level,
                    "seq": len(good) + 1, "ex_zh": s, "ex_py": (ex.get("py") or "").strip(),
                    "uz": (ex.get("uz") or "").strip(), "ru": (ex.get("ru") or "").strip(),
                    "en": (ex.get("en") or "").strip(), "max_level": worst, "model": MODEL,
                })
        return retry

    rejects = absorb(call_model(client, words, level, vocab_hint))

    short = [w for w in words if len(accepted.get(w["zh"], [])) < 2]
    if short:
        notes = "\n".join(f'"{s}" for {h} was REJECTED: {why}. Write a different sentence.'
                          for h, s, why in rejects[:12])
        try:
            more = absorb(call_model(client, short, level, vocab_hint,
                                     "Your previous attempt had problems:\n" + notes))
            for h, s, why in more:
                log.append(f"  drop {h}: {s} — {why}")
        except Exception as e:      # a failed retry costs one word's examples, not the run
            log.append(f"  retry failed: {e}")

    return proofread(client, [row for rows in accepted.values() for row in rows])


def upsert(rows):
    if not rows:
        return
    r = requests.post(
        f"{SB_URL}/rest/v1/word_examples?on_conflict=zh,py_norm,seq",
        headers={**SB_HEADERS, "Prefer": "resolution=merge-duplicates"},
        json=rows, timeout=90,
    )
    if not r.ok:
        raise SystemExit(f"upsert failed {r.status_code}: {r.text[:400]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--level", type=int, help="HSK level to generate for (not needed with --load)")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--words", help="comma-separated headwords, for spot checks")
    ap.add_argument("--out", help="append JSONL here instead of writing to Supabase; reruns skip headwords already in the file")
    ap.add_argument("--dry-run", action="store_true", help="print JSONL to stdout instead of writing")
    ap.add_argument("--load", help="upsert a JSONL file produced by --dry-run, then exit")
    a = ap.parse_args()

    # Generation and loading are split so a long run can proceed before the table
    # exists (DDL on this project is applied by hand in the Supabase dashboard).
    if a.load:
        with open(a.load, encoding="utf-8") as fh:
            rows = [json.loads(l) for l in fh if l.strip()]
        for i in range(0, len(rows), 500):
            upsert(rows[i:i + 500])
            print(f"loaded {min(i + 500, len(rows))}/{len(rows)}", file=sys.stderr)
        return

    if not a.level:
        raise SystemExit("--level is required when generating")
    print(f"model={MODEL} level={a.level}", file=sys.stderr)
    lv, dic = load_levels(), load_segwords()
    print(f"levels={len(lv)} segwords={len(dic)}", file=sys.stderr)

    rows = sb_get("hsk_words", {"select": "zh,pinyin,level,uz,ru,en",
                                "level": f"eq.{a.level}", "order": "zh.asc"})
    # One entry per (zh, toneless pinyin): the table lists polysemous words once
    # per sense, and two senses of 打 dǎ do not need two sets of examples.
    seen, words = set(), []
    for r in rows:
        k = (r["zh"], toneless(r["pinyin"]))
        if k not in seen:
            seen.add(k)
            words.append(r)
    if a.words:
        want = set(a.words.split(","))
        words = [w for w in words if w["zh"] in want]
    # A rate-limited batch loses its words, so a rerun must pick up exactly what
    # is missing rather than paying to regenerate what already succeeded.
    if a.out and os.path.exists(a.out):
        with open(a.out, encoding="utf-8") as fh:
            have = {json.loads(l)["zh"] for l in fh if l.strip()}
        before = len(words)
        words = [w for w in words if w["zh"] not in have]
        print(f"resuming: {before - len(words)} headwords already done", file=sys.stderr)
    if a.limit:
        words = words[:a.limit]
    print(f"{len(words)} headwords", file=sys.stderr)

    # Below HSK 3 the allowed vocabulary is small enough to hand the model
    # outright, which lifts first-pass acceptance a long way. Above that the list
    # would dominate the prompt, so we lean on the validator + retry instead.
    vocab_hint = None
    if a.level <= 2:
        vocab_hint = sorted({z for z, l in lv.items() if l <= a.level})

    # Without an explicit timeout a single stalled request pins a worker forever
    # and the run looks hung. Fail the batch instead; the word just gets no examples.
    client = OpenAI(api_key=env("OPENAI_API_KEY"), timeout=90.0, max_retries=6)
    batches = [words[i:i + BATCH] for i in range(0, len(words), BATCH)]
    done, kept, lock = 0, 0, threading.Lock()

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futs = {pool.submit(gen_batch, client, b, a.level, vocab_hint, dic, lv, []): b for b in batches}
        for f in as_completed(futs):
            with lock:
                done += 1
                try:
                    out = f.result()
                except Exception as e:
                    print(f"[{done}/{len(batches)}] batch failed: {e}", file=sys.stderr)
                    continue
                kept += len(out)
                if a.dry_run:
                    for r in out:
                        print(json.dumps(r, ensure_ascii=False))
                elif a.out:
                    with open(a.out, "a", encoding="utf-8") as fh:
                        for r in out:
                            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
                else:
                    upsert(out)
                print(f"[{done}/{len(batches)}] +{len(out)} (total {kept})", file=sys.stderr)

    want = len(words) * 2
    print(f"\ndone: {kept}/{want} sentences ({kept * 100 // max(want, 1)}%)", file=sys.stderr)


if __name__ == "__main__":
    main()
