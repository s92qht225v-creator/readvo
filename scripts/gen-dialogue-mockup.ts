/**
 * Generate the chat-bubble dialogue mockup HTML, pre-rendering ruby pinyin with
 * the app's REAL aligner (src/utils/rubyText.ts) so it matches production.
 * Reads two real dialogues (short + HSK6 long). Usage:
 *   OUT=/path/mock.html npx tsx scripts/gen-dialogue-mockup.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { alignPinyinToText } from '../src/utils/rubyText';

function rubyHtml(zh: string, py: string): string {
  return alignPinyinToText(zh, py)
    .map((p) => (p.pinyin ? `<ruby>${p.char}<rt>${p.pinyin}</rt></ruby>` : `<span class="punct">${p.char}</span>`))
    .join('');
}

function dataset(file: string): string {
  const d = JSON.parse(readFileSync(file, 'utf-8'));
  const rows = d.sections.flatMap((s: { sentences: Array<{ speaker?: string; text_original: string; pinyin: string; text_translation: string }> }) => s.sentences)
    .map((s: { speaker?: string; text_original: string; pinyin: string; text_translation: string }) =>
      [ (s.speaker || 'A').toLowerCase(), rubyHtml(s.text_original, s.pinyin), s.text_translation ]);
  return JSON.stringify(rows);
}

const SHORT = dataset('content/dialogues/hsk3/dialogue29.json');   // e-bike
const HSK6 = dataset('content/dialogues/hsk6/dialogue39.json');    // weather & moods

const html = `<title>Blim — Dialogue as chat bubbles (mockup)</title>
<div class="wrap">
  <div class="controls">
    <div class="seg" id="len">
      <button data-len="hsk6" class="on">HSK 6 · long</button>
      <button data-len="short">Short (HSK 3)</button>
    </div>
    <div class="seg" id="theme">
      <button data-theme="brand" class="on">Brand</button>
      <button data-theme="blue">iMessage</button>
      <button data-theme="neutral">Neutral</button>
    </div>
    <div class="chips">
      <button id="pyBtn" class="chip on">Pinyin</button>
      <button id="trBtn" class="chip on">Tarjima</button>
    </div>
  </div>

  <div class="phone t-brand" id="phone">
    <div class="chat-head">
      <span class="back">&lsaquo;</span>
      <div class="avatar" id="av">天</div>
      <div class="head-txt">
        <div class="head-title" id="ti">天气与心情</div>
        <div class="head-sub" id="su">Ob-havo va kayfiyat · Dialog</div>
      </div>
      <span class="dots">&#8943;</span>
    </div>
    <div class="msgs" id="msgs"></div>
    <div class="composer"><span class="play">&#9654;&#65038; Play all</span></div>
  </div>

  <p class="note">Faithful mock-up — ruby pinyin rendered with the app's real aligner. No audio. Toggle Pinyin / Tarjima and the three themes. The HSK 6 dialogue shows how long, multi-sentence turns wrap.</p>
</div>

<style>
  .wrap { font-family: "Noto Sans", system-ui, sans-serif; color: #1a1a1a; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; }
  .seg { display: inline-flex; background: #eceff3; border-radius: 999px; padding: 3px; }
  .seg button { border: none; background: transparent; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; color: #666; cursor: pointer; }
  .seg button.on { background: #fff; color: #dc2626; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .chips { display: inline-flex; gap: 8px; }
  .chip { border: 1px solid #dcdfe4; background: #fff; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; color: #888; cursor: pointer; }
  .chip.on { background: #dc2626; border-color: #dc2626; color: #fff; }

  .phone { width: 400px; max-width: 100%; height: 720px; max-height: 82vh; display: flex; flex-direction: column;
           border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.18); border: 1px solid #e3e6ea; background: #dfe4ea; }
  .chat-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #fff; border-bottom: 1px solid #ececec; }
  .chat-head .back { font-size: 26px; color: #dc2626; line-height: 1; margin-right: -2px; }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg,#dc2626,#b91c1c); color: #fff; display: grid; place-items: center; font-size: 15px; font-weight: 700; }
  .head-title { font-size: 15px; font-weight: 700; line-height: 1.1; }
  .head-sub { font-size: 11px; color: #9aa0a6; }
  .head-txt { flex: 1; }
  .dots { color: #b0b4b9; font-size: 20px; }

  .msgs { flex: 1; overflow-y: auto; padding: 16px 14px 20px; display: flex; flex-direction: column; gap: 12px;
          background: radial-gradient(circle at 20% 12%, rgba(255,255,255,.5), transparent 40%), #e7ebf0; }
  .row { display: flex; }
  .row.a { justify-content: flex-start; }
  .row.b { justify-content: flex-end; }
  .bubble { max-width: 85%; padding: 9px 13px 10px; border-radius: 18px; position: relative; box-shadow: 0 1px 1.5px rgba(0,0,0,.08); }
  .row.a .bubble { border-bottom-left-radius: 5px; }
  .row.b .bubble { border-bottom-right-radius: 5px; }

  .t-brand .row.a .bubble { background: #fff; color: #16181c; }
  .t-brand .row.b .bubble { background: #fbe4e4; color: #16181c; }
  .t-blue .row.a .bubble { background: #e9e9eb; color: #16181c; }
  .t-blue .row.b .bubble { background: #2f8bff; color: #fff; }
  .t-blue .row.b .zh { color: #fff; }
  .t-blue .row.b rt { color: #d8e8ff; }
  .t-blue .row.b .tr { color: rgba(255,255,255,.85); }
  .t-neutral .row.a .bubble { background: #fff; color: #16181c; }
  .t-neutral .row.b .bubble { background: #eaeef3; color: #16181c; }

  .zh { font-family: "PingFang SC","Hiragino Sans GB","Noto Sans SC",sans-serif; font-size: 21px; line-height: 2.0; color: #16181c; }
  .zh ruby { margin: 0 0.02em; }
  .zh rt { font-family: "Noto Sans",sans-serif; font-size: 0.5em; color: #5a83c4; font-weight: 500; padding-bottom: 0.18em; }
  /* width:0 + min-width:100% = fill the bubble but never stretch it, so the
     Chinese line defines the bubble width and a longer translation wraps
     underneath instead of widening the bubble and leaving the Chinese half-empty. */
  .tr { margin-top: 4px; font-size: 13.5px; line-height: 1.45; color: #6b7075; width: 0; min-width: 100%; overflow-wrap: break-word; }

  .hide-py rt { visibility: hidden; }
  .hide-tr .tr { display: none; }

  .composer { padding: 10px 14px calc(12px + env(safe-area-inset-bottom)); background: #fff; border-top: 1px solid #ececec; display: flex; justify-content: center; }
  .composer .play { font-size: 14px; font-weight: 700; color: #dc2626; }
  .note { font-size: 12.5px; color: #8a9097; max-width: 400px; text-align: center; line-height: 1.5; margin: 0; }
</style>

<script>
  const DATA = { short: ${SHORT}, hsk6: ${HSK6} };
  const HEAD = { short: ['电','电动车','Elektromoped · Dialog'], hsk6: ['天','天气与心情','Ob-havo va kayfiyat · Dialog'] };
  const msgs = document.getElementById('msgs');
  function render(which) {
    msgs.innerHTML = DATA[which].map(r =>
      '<div class="row ' + r[0] + '"><div class="bubble"><div class="zh">' + r[1] + '</div><div class="tr">' + r[2] + '</div></div></div>').join('');
    const h = HEAD[which];
    document.getElementById('av').textContent = h[0];
    document.getElementById('ti').textContent = h[1];
    document.getElementById('su').textContent = h[2];
    msgs.scrollTop = 0;
  }
  render('hsk6');
  const phone = document.getElementById('phone');
  document.querySelectorAll('#len button').forEach(b => b.onclick = () => {
    document.querySelectorAll('#len button').forEach(x => x.classList.remove('on')); b.classList.add('on'); render(b.dataset.len);
  });
  document.querySelectorAll('#theme button').forEach(b => b.onclick = () => {
    document.querySelectorAll('#theme button').forEach(x => x.classList.remove('on')); b.classList.add('on');
    phone.classList.remove('t-brand','t-blue','t-neutral'); phone.classList.add('t-' + b.dataset.theme);
  });
  const pyBtn = document.getElementById('pyBtn'), trBtn = document.getElementById('trBtn');
  pyBtn.onclick = () => { msgs.classList.toggle('hide-py'); pyBtn.classList.toggle('on'); };
  trBtn.onclick = () => { msgs.classList.toggle('hide-tr'); trBtn.classList.toggle('on'); };
</script>`;

writeFileSync(process.env.OUT!, html);
console.log('wrote', process.env.OUT);
