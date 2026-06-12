import json, glob, unicodedata, os, collections

DIR = 'content/dialogues'
OUT = 'scripts/out'
os.makedirs(OUT, exist_ok=True)

def norm_py(py):
    return ' '.join(unicodedata.normalize('NFC', py).strip().split()).lower()

# 1. collect every current inline entry
by_key = collections.defaultdict(list)  # (zh, norm_py) -> list of (file, level, entry)
files = sorted(glob.glob(f'{DIR}/**/*.json', recursive=True))
for f in files:
    d = json.load(open(f, encoding='utf-8'))
    for v in d.get('vocab', []):
        if not isinstance(v, dict) or 'zh' not in v:  # already migrated (string ref) -> skip
            continue
        by_key[(v['zh'], norm_py(v.get('py','')))].append((f, d.get('level'), v))

# 2. build glossary rows + conflict report
rows, conflicts = [], []
for (zh, npy), occ in by_key.items():
    glosses = {(o[2].get('uz',''), o[2].get('ru',''), o[2].get('en','')) for o in occ}
    first = occ[0][2]
    hsk = min((o[1] for o in occ if o[1]), default=None)
    # store py in NFC so the DB's GENERATED py_norm matches the app's normPy(); do NOT
    # emit py_norm (it's a generated column — inserting into it errors).
    row = {'zh': zh, 'py': unicodedata.normalize('NFC', first.get('py','')), '_npy': npy,
           'uz': first.get('uz',''), 'ru': first.get('ru',''), 'en': first.get('en',''), 'hsk': hsk}
    rows.append(row)
    if len(glosses) > 1:
        conflicts.append({'zh': zh, 'py': first.get('py',''),
                          'variants': [{'file': o[0], 'uz': o[2].get('uz'), 'ru': o[2].get('ru'), 'en': o[2].get('en')} for o in occ]})

# 3. which zh are homographs (need py in refs)?
ambiguous = {zh for zh in {r['zh'] for r in rows}
             if len({r['_npy'] for r in rows if r['zh'] == zh}) > 1}

# 4. emit seed SQL — do NOT write py_norm (generated column); ON CONFLICT still
#    targets the unique (zh, py_norm) constraint.
def sql_str(s): return "'" + (s or '').replace("'", "''") + "'"
with open(f'{OUT}/glossary-seed.sql', 'w', encoding='utf-8') as out:
    out.write('insert into public.glossary (zh, py, uz, ru, en, hsk) values\n')
    vals = []
    for r in sorted(rows, key=lambda r: (r['hsk'] or 9, r['_npy'])):
        hsk = str(r['hsk']) if r['hsk'] else 'null'
        vals.append(f"  ({sql_str(r['zh'])}, {sql_str(r['py'])}, "
                    f"{sql_str(r['uz'])}, {sql_str(r['ru'])}, {sql_str(r['en'])}, {hsk})")
    out.write(',\n'.join(vals) + '\non conflict (zh, py_norm) do nothing;\n')

# 5. rewrite each dialogue's vocab -> reference list (appearance order preserved)
for f in files:
    d = json.load(open(f, encoding='utf-8'))
    if 'vocab' not in d: continue
    new = []
    for v in d['vocab']:
        if isinstance(v, str): new.append(v); continue
        zh = v['zh']
        new.append({'zh': zh, 'py': v.get('py','')} if zh in ambiguous else zh)
    d['vocab'] = new
    json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(f, 'a', encoding='utf-8').write('\n')

json.dump(conflicts, open(f'{OUT}/glossary-conflicts.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=2)
print(f'rows={len(rows)} conflicts={len(conflicts)} ambiguous_zh={len(ambiguous)}')
