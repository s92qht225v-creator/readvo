'use client';

import { useState, useRef } from 'react';

type Question = { uz: string; zh: string; pinyin: string };
type Phase = 'idle' | 'recording' | 'processing' | 'result_correct' | 'result_wrong_retry' | 'result_wrong_final' | 'shadowing' | 'api_error';
type Screen = 'permission' | 'denied' | 'quiz' | 'complete';
type DeniedReason = 'blocked' | 'noDevice' | 'unsupported';
type Score = 'correct' | 'close' | 'wrong';

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

// Common traditional → simplified substitutions (HSK 1-relevant)
const TRAD_TO_SIMP: Record<string, string> = {
  '麼':'么','麽':'么','誰':'谁','嗎':'吗','嗯':'嗯',
  '學':'学','語':'语','漢':'汉','這':'这','個':'个',
  '們':'们','來':'来','時':'时','師':'师','國':'国',
  '東':'东','車':'车','書':'书','號':'号','電':'电',
  '話':'话','視':'视','歡':'欢','親':'亲','愛':'爱',
  '為':'为','對':'对','問':'问','題':'题','從':'从',
  '開':'开','關':'关','錢':'钱','買':'买','賣':'卖',
  '見':'见','層':'层','長':'长','兩':'两','點':'点',
  '邊':'边','過':'过','還':'还','說':'说','讀':'读',
  '寫':'写','聽':'听','讓':'让','覺':'觉','進':'进',
  '會':'会','後':'后','幾':'几','裡':'里',
};

function toSimplified(str: string): string {
  return str.split('').map(c => TRAD_TO_SIMP[c] ?? c).join('');
}

function normalizeChinese(str: string): string {
  return toSimplified(str.trim().replace(/[。？！，、""''「」《》\s]/g, '')).toLowerCase();
}

function scoreAnswer(expected: string, whisperText: string): Score {
  const a = normalizeChinese(expected);
  const b = normalizeChinese(whisperText);
  if (a === b) return 'correct';
  // Allow 1 edit only for longer sentences (≥8 chars); short sentences require exact match
  const maxEdits = a.length >= 10 ? 2 : a.length >= 8 ? 1 : 0;
  if (maxEdits > 0 && levenshtein(a, b) <= maxEdits) return 'close';
  return 'wrong';
}

function speak(text: string, rate = 0.85) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = rate; u.pitch = 1; u.volume = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

interface Props {
  questions: Question[];
  accentColor?: string;
  accentBg?: string;
}

export function SpeakingMashq({ questions, accentColor = '#be185d', accentBg = '#fce7f3' }: Props) {
  const [screen, setScreen]       = useState<Screen>('permission');
  const [qIndex, setQIndex]       = useState(0);
  const [phase, setPhase]         = useState<Phase>('idle');
  const [attempt, setAttempt]     = useState(1);
  const [heard, setHeard]         = useState('');
  const [scores, setScores]       = useState<Score[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [deniedReason, setDeniedReason] = useState<DeniedReason>('blocked');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = questions[qIndex];

  const requestPermission = async () => {
    setRequesting(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setDeniedReason('unsupported');
      setScreen('denied');
      setRequesting(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setScreen('quiz');
    } catch (err) {
      const name = (err as DOMException).name;
      setDeniedReason(name === 'NotFoundError' ? 'noDevice' : 'blocked');
      setScreen('denied');
    } finally {
      setRequesting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setPhase('processing');
        await submitAudio(mimeType);
      };
      recorder.start(100);
      setPhase('recording');
      timerRef.current = setTimeout(() => stopRecording(), 6000);
    } catch {
      setPhase('idle');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const submitAudio = async (mimeType: string) => {
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const formData = new FormData();
      formData.append('audio', blob, 'answer.webm');
      formData.append('expected', q.zh);
      const res  = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const data = await res.json() as { text?: string; error?: string };
      if (data.error) throw new Error(data.error);
      const whisperText = data.text ?? '';
      setHeard(whisperText);
      const result = scoreAnswer(q.zh, whisperText);
      if (result === 'correct' || result === 'close') {
        setScores(p => [...p, result]);
        setPhase('result_correct');
        speak(q.zh);
      } else {
        if (attempt === 1) {
          setPhase('result_wrong_retry');
        } else {
          setScores(p => [...p, 'wrong']);
          setPhase('result_wrong_final');
          speak(q.zh);
        }
      }
    } catch {
      setPhase('api_error');
    }
  };

  const nextQuestion = () => {
    if (qIndex + 1 >= questions.length) {
      setScreen('complete');
    } else {
      setQIndex(i => i + 1);
      setPhase('idle');
      setAttempt(1);
      setHeard('');
    }
  };

  const retryAfterWrong = () => { setAttempt(2); setPhase('idle'); };
  const startShadowing  = () => { speak(q.zh); setPhase('shadowing'); };

  const correctCount = scores.filter(s => s === 'correct' || s === 'close').length;
  const pct = Math.round((correctCount / questions.length) * 100);

  // ── Permission ────────────────────────────────────────────
  if (screen === 'permission') return (
    <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎤</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Gapirib o&apos;rganing</div>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>
        O&apos;zbek tarjimasini ko&apos;rasiz, keyin xitoycha aytasiz. Mikrofon ruxsati kerak.
      </div>
      <button onClick={requestPermission} disabled={requesting} style={{
        background: requesting ? '#aaa' : accentColor, border: 'none', borderRadius: 12,
        color: '#fff', fontSize: 15, fontWeight: 700,
        padding: '14px 32px', cursor: requesting ? 'wait' : 'pointer', fontFamily: 'inherit',
      }}>{requesting ? 'Tekshirilmoqda…' : 'Mikrofonni yoqish'}</button>
    </div>
  );

  // ── Denied ────────────────────────────────────────────────
  if (screen === 'denied') return (
    <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
        {deniedReason === 'unsupported' ? 'Brauzer qo\'llab-quvvatlamaydi' :
         deniedReason === 'noDevice'    ? 'Mikrofon topilmadi' :
                                          'Mikrofon ruxsati rad etildi'}
      </div>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8, marginBottom: 24 }}>
        {deniedReason === 'unsupported'
          ? 'Bu brauzer mikrofon API-ni qo\'llab-quvvatlamaydi. Iltimos, Chrome yoki Safari ishlating.'
          : deniedReason === 'noDevice'
          ? 'Qurilmangizda mikrofon topilmadi. Mikrofon ulanganligini tekshiring.'
          : <>Manzil satridagi <b>🔒</b> belgisini bosing → <b>Mikrofon</b> → <b>Ruxsat</b> → sahifani yangilang.</>}
      </div>
      {deniedReason !== 'unsupported' && (
        <button onClick={() => setScreen('permission')} style={{
          background: accentColor, border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 15, fontWeight: 700,
          padding: '14px 32px', cursor: 'pointer', fontFamily: 'inherit',
        }}>Qayta urinish</button>
      )}
    </div>
  );

  // ── Complete ──────────────────────────────────────────────
  if (screen === 'complete') return (
    <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{pct === 100 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{correctCount} / {questions.length}</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        {pct === 100 ? "Mukammal! Barchasini to'g'ri aytdingiz!" : pct >= 60 ? 'Yaxshi! Bir oz mashq qiling.' : "Darsni qayta ko'ring va qaytadan urining."}
      </div>
      <div style={{ textAlign: 'left', marginBottom: 24 }}>
        {questions.map((qq, i) => {
          const s = scores[i];
          const icon  = s === 'correct' ? '✓' : s === 'close' ? '≈' : '✗';
          const color = s === 'correct' || s === 'close' ? '#16a34a' : '#dc2626';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f5f5f8', borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16, color, fontWeight: 700, minWidth: 20 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 15, color: '#1a1a2e', fontWeight: 600 }}>{qq.zh}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{qq.uz}</div>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={() => { setQIndex(0); setPhase('idle'); setAttempt(1); setHeard(''); setScores([]); setScreen('quiz'); }}
        style={{ background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 28px', cursor: 'pointer', fontFamily: 'inherit' }}
      >Qayta urinish</button>
    </div>
  );

  // ── Quiz ──────────────────────────────────────────────────
  return (
    <div style={{ padding: '8px 0', maxWidth: 480, margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 4 }}>
          <span>{qIndex + 1} / {questions.length}</span>
          <span>{scores.filter(s => s === 'correct' || s === 'close').length} to&apos;g&apos;ri</span>
        </div>
        <div style={{ height: 4, background: '#e0e0e6', borderRadius: 4 }}>
          <div style={{ height: '100%', borderRadius: 4, background: accentColor, width: `${(qIndex / questions.length) * 100}%`, transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e0e0e6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 14 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: accentColor, fontWeight: 700, marginBottom: 14 }}>Xitoycha ayting</div>

        {/* Uzbek prompt */}
        <div style={{ background: accentBg, borderRadius: 10, padding: '14px 16px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Tarjima:</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.4 }}>{q.uz}</div>
        </div>

        {/* Hear example */}
        <button onClick={() => speak(q.zh)} style={{ width: '100%', padding: '10px 0', background: '#f5f5f8', border: '1px solid #e0e0e6', borderRadius: 8, fontSize: 13, color: '#555', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span>▶</span> Namunani eshiting
        </button>

        {/* idle */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            {attempt === 2 && <div style={{ fontSize: 12, color: '#d97706', marginBottom: 10, fontWeight: 600 }}>⚠️ Oxirgi urinish</div>}
            <button onClick={startRecording} style={{ width: '100%', padding: '16px 0', background: accentColor, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🎤 Gapiring</button>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>Bosing va xitoycha ayting</div>
          </div>
        )}

        {/* recording */}
        {phase === 'recording' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: accentColor, fontWeight: 700, marginBottom: 12 }}>🔴 Tinglayapman…</div>
            <button onClick={stopRecording} style={{ width: '100%', padding: '16px 0', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 12, color: '#dc2626', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', animation: 'smPulse 1s infinite' }}>⏹ To&apos;xtatish</button>
            <style>{`@keyframes smPulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>
          </div>
        )}

        {/* processing */}
        {phase === 'processing' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 13, color: '#888' }}>⏳ Tekshirilmoqda…</div>
          </div>
        )}

        {/* api error */}
        {phase === 'api_error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fee2e2', borderRadius: 10, padding: '12px 14px', border: '1px solid #fca5a5', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Server xatosi</div>
              <div style={{ fontSize: 12, color: '#888' }}>Ovoz serverga yetib bormadi. Internet aloqasini tekshiring.</div>
            </div>
            <button onClick={() => setPhase('idle')} style={{ width: '100%', padding: '13px 0', background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Qayta urinish
            </button>
          </div>
        )}

        {/* correct */}
        {phase === 'result_correct' && (
          <div>
            <div style={{ background: '#dcfce7', borderRadius: 10, padding: '12px 14px', border: '1px solid #86efac', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>✓ To&apos;g&apos;ri!</div>
              {heard && <div style={{ fontSize: 13, color: '#444' }}>Eshitildi: <b>{heard}</b></div>}
            </div>
            <div style={{ background: '#f5f5f8', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>To&apos;g&apos;ri javob:</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>{q.zh}</div>
              <div style={{ fontSize: 12, color: accentColor }}>{q.pinyin}</div>
            </div>
            <button onClick={nextQuestion} style={{ width: '100%', padding: '13px 0', background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {qIndex + 1 < questions.length ? 'Keyingisi →' : 'Natijalar'}
            </button>
          </div>
        )}

        {/* wrong — retry */}
        {phase === 'result_wrong_retry' && (
          <div>
            <div style={{ background: '#fff7ed', borderRadius: 10, padding: '12px 14px', border: '1px solid #fcd34d', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>Qayta urining</div>
              {heard && <div style={{ fontSize: 12, color: '#888' }}>Eshitildi: <b>{heard}</b></div>}
            </div>
            <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginBottom: 12 }}>Namunani yana bir marta eshiting, keyin qayta gapiring</div>
            <button onClick={retryAfterWrong} style={{ width: '100%', padding: '13px 0', background: '#d97706', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🎤 Qayta gapirish</button>
          </div>
        )}

        {/* wrong — final */}
        {phase === 'result_wrong_final' && (
          <div>
            <div style={{ background: '#fee2e2', borderRadius: 10, padding: '12px 14px', border: '1px solid #fca5a5', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Xato</div>
              {heard && <div style={{ fontSize: 12, color: '#888' }}>Eshitildi: <b>{heard}</b></div>}
            </div>
            <div style={{ background: '#f5f5f8', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>To&apos;g&apos;ri javob:</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{q.zh}</div>
              <div style={{ fontSize: 12, color: accentColor, marginBottom: 2 }}>{q.pinyin}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{q.uz}</div>
            </div>
            <button onClick={startShadowing} style={{ width: '100%', padding: '13px 0', background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🔁 Qaytarib ayting (shadowing)</button>
          </div>
        )}

        {/* shadowing */}
        {phase === 'shadowing' && (
          <div>
            <div style={{ background: accentBg, borderRadius: 10, padding: '14px 16px', marginBottom: 12, textAlign: 'center', border: `1px solid ${accentColor}33` }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Audio eshitildi. Endi o&apos;zingiz ayting:</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{q.zh}</div>
              <div style={{ fontSize: 13, color: accentColor, marginTop: 2 }}>{q.pinyin}</div>
            </div>
            <button onClick={() => speak(q.zh)} style={{ width: '100%', padding: '10px 0', background: '#f5f5f8', border: '1px solid #e0e0e6', borderRadius: 8, fontSize: 13, color: '#555', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>▶ Yana eshitish</button>
            <button onClick={nextQuestion} style={{ width: '100%', padding: '13px 0', background: '#6b7280', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {qIndex + 1 < questions.length ? 'Keyingisi →' : 'Natijalar'}
            </button>
          </div>
        )}
      </div>

      {/* Attempt dots */}
      {(phase === 'idle' || phase === 'recording') && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[1, 2].map(n => (
            <div key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: n <= (2 - attempt + 1) ? accentColor : '#e0e0e6', transition: 'background 0.2s' }} />
          ))}
        </div>
      )}
    </div>
  );
}
