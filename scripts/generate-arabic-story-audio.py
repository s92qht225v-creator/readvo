#!/usr/bin/env python3
"""
Generate ElevenLabs audio for a curated Arabic story and bake the public URLs
(with ?v cache-buster) back into the story JSON.

- Male voice   = Omar (xvhpbk8otnNHtT3fjCpr)      -> {slug}/omar/s{N}.mp3
- Female voice = Abrar Sabbah (VwC51uc4PUblWEJSPzeo) -> {slug}/female/s{N}.mp3
- Vocab        = Omar                              -> {slug}/omar/words/w{NN}.mp3
- Audio is synthesized from TANWEEN-STRIPPED text (natural spoken MSA); the
  displayed `ar` keeps full tashkeel. Model: eleven_v3.

Usage: python3 scripts/generate-arabic-story-audio.py content/arabic/stories/a2/at-the-market.json [--only-missing]
"""
import sys, os, re, json, hashlib, time, urllib.request

ENV = dict(re.findall(r'^(\w+)=(.*)$', open('.env.local').read(), re.M))
ELEVEN = ENV['ELEVENLABS_API_KEY']
SUPA = ENV['NEXT_PUBLIC_SUPABASE_URL']
SVC = ENV['SUPABASE_SERVICE_ROLE_KEY']
OMAR = 'xvhpbk8otnNHtT3fjCpr'
ABRAR = 'VwC51uc4PUblWEJSPzeo'
MODEL = 'eleven_v3'
TANWIN = re.compile('[ً-ٍ]')

strip = lambda t: TANWIN.sub('', t)

def tts(text, voice):
    body = json.dumps({"text": strip(text), "model_id": MODEL,
                       "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
        data=body, headers={"xi-api-key": ELEVEN, "Content-Type": "application/json"})
    for attempt in range(3):
        try:
            return urllib.request.urlopen(req, timeout=60).read()
        except urllib.error.HTTPError as e:
            print(f"    HTTP {e.code}: {e.read().decode()[:160]}")
            time.sleep(2)
    return None

def upload(path, data):
    req = urllib.request.Request(f"{SUPA}/storage/v1/object/audio/{path}", data=data, method='POST',
        headers={"Authorization": f"Bearer {SVC}", "apikey": SVC, "Content-Type": "audio/mpeg", "x-upsert": "true"})
    urllib.request.urlopen(req)
    v = hashlib.sha1(data).hexdigest()[:10]
    return f"{SUPA}/storage/v1/object/public/audio/{path}?v={v}"

def main():
    fpath = sys.argv[1]
    only_missing = '--only-missing' in sys.argv
    d = json.load(open(fpath))
    level, slug = d['level'], d['id']
    base = f"ar/stories/{level}/{slug}"

    for s in d['sentences']:
        sid = s['id']
        male_text = s.get('ar_m') or s.get('ar')
        female_text = s.get('ar_f') or s.get('ar')
        if not (only_missing and s.get('audio_url')):
            print(f"  [{sid}] omar   {strip(male_text)}")
            b = tts(male_text, OMAR); s['audio_url'] = upload(f"{base}/omar/{sid}.mp3", b)
        if not (only_missing and s.get('audio_url_f')):
            print(f"  [{sid}] female {strip(female_text)}")
            b = tts(female_text, ABRAR); s['audio_url_f'] = upload(f"{base}/female/{sid}.mp3", b)
        time.sleep(0.3)

    for i, w in enumerate(d.get('vocab', []), start=1):
        if only_missing and w.get('audio_url'):
            continue
        print(f"  [w{i:02d}] {strip(w['ar'])}")
        b = tts(w['ar'], OMAR); w['audio_url'] = upload(f"{base}/omar/words/w{i:02d}.mp3", b)
        time.sleep(0.2)

    json.dump(d, open(fpath, 'w'), ensure_ascii=False, indent=2)
    print("Done. JSON updated with audio URLs.")

main()
