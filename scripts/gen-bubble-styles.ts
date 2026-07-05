/**
 * Generate a showcase of DIFFERENT chat-bubble styles for the dialogue reader.
 * Uses the real HSK6 dialogue + the app's real pinyin aligner. A style switcher
 * swaps the whole bubble look so the designs can be compared side by side.
 *   OUT=/path/mock.html npx tsx scripts/gen-bubble-styles.ts
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
      [(s.speaker || 'A').toLowerCase(), rubyHtml(s.text_original, s.pinyin), s.text_translation]);
  return JSON.stringify(rows);
}
const HSK6 = dataset('content/dialogues/hsk6/dialogue39.json');

const STYLES = [
  ['s-brand', 'Brand soft'],
  ['s-ios', 'iMessage'],
  ['s-outline', 'Outline'],
  ['s-avatar', 'Avatars'],
  ['s-bar', 'Accent bar'],
  ['s-tail', 'Pointer tail'],
];

const html = `<title>Blim — Dialogue bubble styles</title>
<div class="wrap">
  <div class="controls">
    <div class="seg" id="style">
      ${STYLES.map((s, i) => `<button data-s="${s[0]}"${i === 0 ? ' class="on"' : ''}>${s[1]}</button>`).join('\n      ')}
    </div>
    <div class="chips">
      <button id="pyBtn" class="chip on">Pinyin</button>
      <button id="trBtn" class="chip on">Tarjima</button>
    </div>
  </div>

  <div class="phone s-brand" id="phone">
    <div class="chat-head">
      <span class="back">&lsaquo;</span>
      <div class="avatar">天</div>
      <div class="head-txt">
        <div class="head-title">天气与心情</div>
        <div class="head-sub">Ob-havo va kayfiyat · Dialog</div>
      </div>
      <span class="dots">&#8943;</span>
    </div>
    <div class="msgs" id="msgs"></div>
    <div class="composer"><span class="play">&#9654;&#65038; Play all</span></div>
  </div>
  <p class="note">Six bubble styles on the real HSK 6 dialogue (real pinyin aligner). Switch styles above; toggle Pinyin / Tarjima. No audio.</p>
</div>

<style>
  .wrap { font-family: "Noto Sans", system-ui, sans-serif; color: #1a1a1a; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; }
  .seg { display: inline-flex; flex-wrap: wrap; background: #eceff3; border-radius: 999px; padding: 3px; }
  .seg button { border: none; background: transparent; padding: 6px 13px; border-radius: 999px; font-size: 13px; font-weight: 600; color: #666; cursor: pointer; }
  .seg button.on { background: #fff; color: #dc2626; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .chips { display: inline-flex; gap: 8px; }
  .chip { border: 1px solid #dcdfe4; background: #fff; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; color: #888; cursor: pointer; }
  .chip.on { background: #dc2626; border-color: #dc2626; color: #fff; }

  .phone { width: 400px; max-width: 100%; height: 720px; max-height: 82vh; display: flex; flex-direction: column;
           border-radius: 28px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.18); border: 1px solid #e3e6ea; background: #dfe4ea; }
  .chat-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #fff; border-bottom: 1px solid #ececec; }
  .chat-head .back { font-size: 26px; color: #dc2626; line-height: 1; }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg,#dc2626,#b91c1c); color: #fff; display: grid; place-items: center; font-size: 15px; font-weight: 700; }
  .head-title { font-size: 15px; font-weight: 700; line-height: 1.1; }
  .head-sub { font-size: 11px; color: #9aa0a6; }
  .head-txt { flex: 1; }
  .dots { color: #b0b4b9; font-size: 20px; }

  .msgs { flex: 1; overflow-y: auto; padding: 16px 14px 20px; display: flex; flex-direction: column; gap: 12px;
          background: radial-gradient(circle at 20% 12%, rgba(255,255,255,.5), transparent 40%), #e7ebf0; }
  .row { display: flex; align-items: flex-end; gap: 7px; }
  .row.a { justify-content: flex-start; }
  .row.b { justify-content: flex-end; }
  .avatar-sm { display: none; width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; place-items: center; font-size: 12px; font-weight: 700; color: #fff; }
  .row.a .avatar-sm { background: #8a93a0; }
  .row.b .avatar-sm { background: #dc2626; }

  .bubble { max-width: 82%; padding: 9px 13px 10px; border-radius: 18px; box-shadow: 0 1px 1.5px rgba(0,0,0,.08); }
  .zh { font-family: "PingFang SC","Hiragino Sans GB","Noto Sans SC",sans-serif; font-size: 21px; line-height: 2.0; color: #16181c; }
  .zh ruby { margin: 0 0.02em; }
  .zh rt { font-family: "Noto Sans",sans-serif; font-size: 0.5em; color: #5a83c4; font-weight: 500; padding-bottom: 0.18em; }
  .tr { margin-top: 4px; font-size: 13.5px; line-height: 1.45; color: #6b7075; width: 0; min-width: 100%; overflow-wrap: break-word; }
  .hide-py rt { visibility: hidden; }
  .hide-tr .tr { display: none; }

  /* 1 — Brand soft */
  .s-brand .row.a .bubble { background: #fff; border-bottom-left-radius: 5px; }
  .s-brand .row.b .bubble { background: #fbe4e4; border-bottom-right-radius: 5px; }

  /* 2 — iMessage */
  .s-ios .bubble { box-shadow: none; }
  .s-ios .row.a .bubble { background: #e9e9eb; border-bottom-left-radius: 5px; }
  .s-ios .row.b .bubble { background: #3797f0; border-bottom-right-radius: 5px; }
  .s-ios .row.b .zh { color: #fff; }
  .s-ios .row.b rt { color: #cfe3ff; }
  .s-ios .row.b .tr { color: rgba(255,255,255,.85); }

  /* 3 — Outline (minimal, no fill) */
  .s-outline .bubble { box-shadow: none; background: transparent; border: 1.5px solid #d7dce2; border-radius: 16px; }
  .s-outline .row.b .bubble { border-color: #f0b6b6; }

  /* 4 — Avatars */
  .s-avatar .avatar-sm { display: grid; }
  .s-avatar .row.b { flex-direction: row-reverse; }
  .s-avatar .bubble { box-shadow: none; }
  .s-avatar .row.a .bubble { background: #f1f4f7; border-bottom-left-radius: 5px; }
  .s-avatar .row.b .bubble { background: #fdeeee; border-bottom-right-radius: 5px; }

  /* 5 — Accent bar (flat, side stripe) */
  .s-bar .bubble { box-shadow: none; border-radius: 10px; }
  .s-bar .row.a .bubble { background: #f5f8fb; border-left: 4px solid #6b9bd8; }
  .s-bar .row.b .bubble { background: #fdf1f1; border-right: 4px solid #dc2626; }

  /* 6 — Pointer tail (classic speech bubble) */
  .s-tail .bubble { position: relative; border-radius: 16px; }
  .s-tail .row.a .bubble { background: #fff; }
  .s-tail .row.b .bubble { background: #fbe4e4; }
  .s-tail .row.a .bubble::after { content: ""; position: absolute; left: -6px; bottom: 8px; width: 0; height: 0; border: 7px solid transparent; border-right-color: #fff; border-left: 0; }
  .s-tail .row.b .bubble::after { content: ""; position: absolute; right: -6px; bottom: 8px; width: 0; height: 0; border: 7px solid transparent; border-left-color: #fbe4e4; border-right: 0; }

  .composer { padding: 10px 14px calc(12px + env(safe-area-inset-bottom)); background: #fff; border-top: 1px solid #ececec; display: flex; justify-content: center; }
  .composer .play { font-size: 14px; font-weight: 700; color: #dc2626; }
  .note { font-size: 12.5px; color: #8a9097; max-width: 400px; text-align: center; line-height: 1.5; margin: 0; }
</style>

<script>
  const DATA = ${HSK6};
  const msgs = document.getElementById('msgs');
  msgs.innerHTML = DATA.map(r =>
    '<div class="row ' + r[0] + '"><div class="avatar-sm">' + (r[0] === 'a' ? 'A' : 'B') + '</div><div class="bubble"><div class="zh">' + r[1] + '</div><div class="tr">' + r[2] + '</div></div></div>').join('');
  const phone = document.getElementById('phone');
  document.querySelectorAll('#style button').forEach(b => b.onclick = () => {
    document.querySelectorAll('#style button').forEach(x => x.classList.remove('on')); b.classList.add('on');
    phone.className = 'phone ' + b.dataset.s;
  });
  const pyBtn = document.getElementById('pyBtn'), trBtn = document.getElementById('trBtn');
  pyBtn.onclick = () => { msgs.classList.toggle('hide-py'); pyBtn.classList.toggle('on'); };
  trBtn.onclick = () => { msgs.classList.toggle('hide-tr'); trBtn.classList.toggle('on'); };
</script>`;

writeFileSync(process.env.OUT!, html);
console.log('wrote', process.env.OUT);
