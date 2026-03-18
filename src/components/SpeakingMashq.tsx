'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Language = 'uz' | 'ru' | 'en';
type Question = { uz: string; zh: string; pinyin: string };
type Phase = 'idle' | 'recording' | 'processing' | 'result_correct' | 'result_close' | 'result_wrong_retry' | 'result_wrong_final' | 'result_no_speech' | 'shadowing' | 'api_error' | 'limit_reached';
type Screen = 'permission' | 'denied' | 'quiz' | 'complete';
type DeniedReason = 'blocked' | 'noDevice' | 'unsupported';
export type Score = 'correct' | 'close' | 'wrong';

type T = Record<Language, string>;
const t = (obj: T, lang: Language) => obj[lang];
const UI = {
  title:        { uz: "Gapirib o'rganing",          ru: 'Учитесь говорить',          en: 'Speaking Practice'        } as T,
  desc:         { uz: "O'zbek tarjimasini ko'rasiz, keyin xitoycha aytasiz. Mikrofon ruxsati kerak.", ru: 'Вы видите перевод, затем произносите по-китайски. Нужен микрофон.', en: 'See the translation, then say it in Chinese. Microphone access required.' } as T,
  enableMic:    { uz: 'Mikrofonni yoqish',           ru: 'Включить микрофон',          en: 'Enable Microphone'        } as T,
  checking:     { uz: 'Tekshirilmoqda…',             ru: 'Проверка…',                  en: 'Checking…'                } as T,
  unsupported:  { uz: "Brauzer qo'llab-quvvatlamaydi", ru: 'Браузер не поддерживается', en: 'Browser not supported'   } as T,
  noDevice:     { uz: 'Mikrofon topilmadi',           ru: 'Микрофон не найден',         en: 'No microphone found'      } as T,
  blocked:      { uz: 'Mikrofon ruxsati rad etildi',  ru: 'Доступ к микрофону отклонён',en: 'Microphone access denied' } as T,
  blockedHint:  { uz: <>Manzil satridagi <b>🔒</b> belgisini bosing → <b>Mikrofon</b> → <b>Ruxsat</b> → sahifani yangilang.</>, ru: <><b>🔒</b> в адресной строке → <b>Микрофон</b> → <b>Разрешить</b> → обновите страницу.</>, en: <><b>🔒</b> in the address bar → <b>Microphone</b> → <b>Allow</b> → reload the page.</> } as Record<Language, React.ReactNode>,
  noDeviceHint: { uz: "Qurilmangizda mikrofon topilmadi. Mikrofon ulanganligini tekshiring.", ru: 'Микрофон не найден. Проверьте подключение.', en: 'No microphone found. Check your device connection.' } as T,
  retry:        { uz: 'Qayta urinish',               ru: 'Повторить попытку',          en: 'Try again'                } as T,
  correct:      { uz: "To'g'ri!",                    ru: 'Правильно!',                 en: 'Correct!'                 } as T,
  close:        { uz: "Deyarli to'g'ri",              ru: 'Почти правильно',            en: 'Almost correct'           } as T,
  closeHint:    { uz: "Talaffuz to'g'ri, lekin so'z noto'g'ri", ru: 'Произношение верное, но слово неправильное', en: 'Pronunciation OK, but wrong word' } as T,
  heard:        { uz: 'Eshitildi:',                  ru: 'Услышано:',                  en: 'Heard:'                   } as T,
  correctAns:   { uz: "To'g'ri javob:",              ru: 'Правильный ответ:',          en: 'Correct answer:'          } as T,
  next:         { uz: 'Keyingisi →',                 ru: 'Следующий →',                en: 'Next →'                   } as T,
  results:      { uz: 'Natijalar',                   ru: 'Результаты',                 en: 'Results'                  } as T,
  retrySpeak:   { uz: 'Qayta gapirish',              ru: 'Говорить снова',             en: 'Speak again'              } as T,
  retryPrompt:  { uz: 'Qayta urining',               ru: 'Попробуйте снова',           en: 'Try again'                } as T,
  retryHint:    { uz: 'Namunani yana bir marta eshiting, keyin qayta gapiring', ru: 'Послушайте образец ещё раз, затем повторите', en: 'Listen to the example once more, then try again' } as T,
  wrong:        { uz: 'Xato',                        ru: 'Неправильно',                en: 'Wrong'                    } as T,
  shadowing:    { uz: "Qaytarib ayting (shadowing)",  ru: 'Повторите (shadowing)',      en: 'Repeat (shadowing)'       } as T,
  shadowHint:   { uz: "Audio eshitildi. Endi o'zingiz ayting:", ru: 'Аудио воспроизведено. Теперь скажите сами:', en: 'Audio played. Now say it yourself:' } as T,
  listenAgain:  { uz: 'Yana eshitish',               ru: 'Послушать снова',            en: 'Listen again'             } as T,
  sayInChinese: { uz: 'Xitoycha ayting',             ru: 'Скажите по-китайски',        en: 'Say it in Chinese'        } as T,
  translation:  { uz: 'Tarjima:',                    ru: 'Перевод:',                   en: 'Translation:'             } as T,
  listenEx:     { uz: 'Namunani eshiting',            ru: 'Послушать пример',           en: 'Listen to example'        } as T,
  speakBtn:     { uz: '🎤 Gapiring',                  ru: '🎤 Говорите',                en: '🎤 Speak'                 } as T,
  tapSpeak:     { uz: 'Bosing va xitoycha ayting',    ru: 'Нажмите и говорите по-китайски', en: 'Tap and speak in Chinese' } as T,
  listening:    { uz: 'Tinglayapman…',               ru: 'Слушаю…',                   en: 'Listening…'               } as T,
  stop:         { uz: "⏹ To'xtatish",                ru: '⏹ Стоп',                    en: '⏹ Stop'                   } as T,
  processing:   { uz: 'Tekshirilmoqda…',             ru: 'Обрабатывается…',            en: 'Processing…'              } as T,
  serverError:  { uz: 'Server xatosi',               ru: 'Ошибка сервера',             en: 'Server error'             } as T,
  serverHint:   { uz: 'Ovoz serverga yetib bormadi. Internet aloqasini tekshiring.', ru: 'Аудио не дошло до сервера. Проверьте интернет.', en: "Audio didn't reach the server. Check your connection." } as T,
  limitReached: { uz: "Bugungi limit tugadi (100 ta). Ertaga davom eting!", ru: 'Дневной лимит исчерпан (100). Продолжите завтра!', en: "Daily limit reached (100). Continue tomorrow!" } as T,
  noSpeech:     { uz: 'Ovoz eshitilmadi. Balandroq gapiring.', ru: 'Голос не распознан. Говорите громче.', en: 'No speech detected. Please speak louder.' } as T,
  lastAttempt:  { uz: '⚠️ Oxirgi urinish',           ru: '⚠️ Последняя попытка',       en: '⚠️ Last attempt'          } as T,
  correct_count:{ uz: "to'g'ri",                     ru: 'правильно',                  en: 'correct'                  } as T,
  perfect:      { uz: "Mukammal! Barchasini to'g'ri aytdingiz!", ru: 'Отлично! Всё правильно!', en: 'Perfect! All correct!' } as T,
  done:         { uz: 'Tayyor ✓',                          ru: 'Готово ✓',                  en: 'Done ✓'                   } as T,
  good:         { uz: "Yaxshi! Bir oz mashq qiling.",ru: 'Хорошо! Немного практики.',  en: 'Good! Keep practising.'   } as T,
  review:       { uz: "Darsni qayta ko'ring va qaytadan urining.", ru: 'Повторите урок и попробуйте снова.', en: 'Review the lesson and try again.' } as T,
};


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


function speak(text: string) {
  const url = `/audio/hsk1/grammar/${encodeURIComponent(text)}.mp3`;
  const audio = new Audio(url);
  audio.onerror = () => {
    // fallback to TTS if local file not found
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = 0.85; u.pitch = 1; u.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };
  audio.play().catch(() => { /* onerror handles TTS fallback */ });
}

interface Props {
  questions: Question[];
  accentColor?: string;
  accentBg?: string;
  language?: Language;
  onComplete?: (result: { scores: Score[]; shadowingUsed: boolean }) => void;
  onDone?: () => void;
}

export function SpeakingMashq({ questions, accentColor = '#be185d', accentBg = '#fce7f3', language = 'uz', onComplete, onDone }: Props) {
  const { getAccessToken } = useAuth();
  const [screen, setScreen]       = useState<Screen>('permission');
  const [qIndex, setQIndex]       = useState(0);
  const [phase, setPhase]         = useState<Phase>('idle');
  const [attempt, setAttempt]     = useState(1);
  const [heard, setHeard]         = useState('');
  const [feedback, setFeedback]   = useState('');
  const [scores, setScores]       = useState<Score[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [deniedReason, setDeniedReason] = useState<DeniedReason>('blocked');
  const [recordingProgress, setRecordingProgress] = useState(0);
  const shadowingUsedRef = useRef(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fire onComplete when quiz finishes (scores state is settled by the time screen changes)
  useEffect(() => {
    if (screen === 'complete' && scores.length > 0) {
      onComplete?.({ scores, shadowingUsed: shadowingUsedRef.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => {
    if (phase !== 'recording') {
      setRecordingProgress(0);
      return;
    }
    setRecordingProgress(0);
    const duration = 6000;
    const interval = 50;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const filled = Math.min(100, (elapsed / duration) * 100);
      setRecordingProgress(filled);
      if (filled >= 100) clearInterval(id);
    }, interval);
    return () => clearInterval(id);
  }, [phase]);

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
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
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

      // Client-side silence guard: very small blobs are silence before even hitting the server
      if (blob.size < 3000) {
        setHeard('');
        setFeedback('');
        setPhase('result_no_speech');
        return;
      }

      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const formData = new FormData();
      formData.append('audio', blob, `answer.${ext}`);
      formData.append('expected', q.zh);
      formData.append('language', language);
      const token = await getAccessToken();
      const res  = await fetch('/api/transcribe', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json() as { text?: string; result?: string; feedback?: string; error?: string };
      if (data.error === 'limit_reached') {
        setPhase('limit_reached');
        return;
      }
      if (data.error) throw new Error(data.error);
      setHeard(data.text ?? '');
      setFeedback(data.feedback ?? '');
      if (data.result === 'no_speech') {
        setHeard('');
        setFeedback('');
        setPhase('result_no_speech');
        return;
      }
      const result = (data.result ?? 'wrong') as Score;
      if (result === 'correct') {
        setScores(p => [...p, result]);
        setPhase('result_correct');
        speak(q.zh);
      } else if (result === 'close') {
        setScores(p => [...p, result]);
        setPhase('result_close');
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
      setFeedback('');
    }
  };

  const retryAfterWrong = () => { setAttempt(2); startRecording(); };
  const startShadowing  = () => { shadowingUsedRef.current = true; speak(q.zh); setPhase('shadowing'); };

  const correctCount = scores.filter(s => s === 'correct' || s === 'close').length;
  const pct = Math.round((correctCount / questions.length) * 100);

  const L = (obj: T) => t(obj, language);

  // ── Permission ────────────────────────────────────────────
  if (screen === 'permission') return (
    <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎤</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{L(UI.title)}</div>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>{L(UI.desc)}</div>
      <button onClick={requestPermission} disabled={requesting} style={{
        background: requesting ? '#aaa' : accentColor, border: 'none', borderRadius: 12,
        color: '#fff', fontSize: 15, fontWeight: 700,
        padding: '14px 32px', cursor: requesting ? 'wait' : 'pointer', fontFamily: 'inherit',
      }}>{requesting ? L(UI.checking) : L(UI.enableMic)}</button>
    </div>
  );

  // ── Denied ────────────────────────────────────────────────
  if (screen === 'denied') return (
    <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
        {deniedReason === 'unsupported' ? L(UI.unsupported) : deniedReason === 'noDevice' ? L(UI.noDevice) : L(UI.blocked)}
      </div>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8, marginBottom: 24 }}>
        {deniedReason === 'unsupported' ? L(UI.unsupported) : deniedReason === 'noDevice' ? L(UI.noDeviceHint) : UI.blockedHint[language]}
      </div>
      {deniedReason !== 'unsupported' && (
        <button onClick={() => setScreen('permission')} style={{
          background: accentColor, border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 15, fontWeight: 700,
          padding: '14px 32px', cursor: 'pointer', fontFamily: 'inherit',
        }}>{L(UI.retry)}</button>
      )}
    </div>
  );

  // ── Complete ──────────────────────────────────────────────
  if (screen === 'complete') return (
    <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{pct === 100 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{correctCount} / {questions.length}</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        {pct === 100 ? L(UI.perfect) : pct >= 60 ? L(UI.good) : L(UI.review)}
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
      {pct === 100 && onDone ? (
        <button
          onClick={onDone}
          style={{ background: '#16a34a', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 28px', cursor: 'pointer', fontFamily: 'inherit' }}
        >{L(UI.done)}</button>
      ) : (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => { setQIndex(0); setPhase('idle'); setAttempt(1); setHeard(''); setScores([]); shadowingUsedRef.current = false; setScreen('quiz'); }}
            style={{ background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 28px', cursor: 'pointer', fontFamily: 'inherit' }}
          >{L(UI.retry)}</button>
          {onDone && (
            <button
              onClick={onDone}
              style={{ background: '#6b7280', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 28px', cursor: 'pointer', fontFamily: 'inherit' }}
            >{L(UI.done)}</button>
          )}
        </div>
      )}
    </div>
  );

  // ── Quiz ──────────────────────────────────────────────────
  return (
    <div style={{ padding: '8px 0', maxWidth: 480, margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 4 }}>
          <span>{qIndex + 1} / {questions.length}</span>
          <span>{scores.filter(s => s === 'correct' || s === 'close').length} {L(UI.correct_count)}</span>
        </div>
        <div style={{ height: 4, background: '#e0e0e6', borderRadius: 4 }}>
          <div style={{ height: '100%', borderRadius: 4, background: accentColor, width: `${(qIndex / questions.length) * 100}%`, transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e0e0e6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 14 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: accentColor, fontWeight: 700, marginBottom: 14 }}>{L(UI.sayInChinese)}</div>

        {/* Prompt */}
        <div style={{ background: accentBg, borderRadius: 10, padding: '14px 16px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.4 }}>{q.uz}</div>
        </div>

        {/* Hear example — only before answer is revealed */}
        {(phase === 'idle' || phase === 'recording' || phase === 'processing' || phase === 'result_no_speech') && (
          <button onClick={() => speak(q.zh)} style={{ width: '100%', padding: '10px 0', background: '#f5f5f8', border: '1px solid #e0e0e6', borderRadius: 8, fontSize: 13, color: '#555', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>▶</span> {L(UI.listenEx)}
          </button>
        )}

        {/* idle */}
        {phase === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            {attempt === 2 && <div style={{ fontSize: 12, color: '#d97706', marginBottom: 10, fontWeight: 600 }}>{L(UI.lastAttempt)}</div>}
            <button onClick={startRecording} style={{ width: '100%', padding: '16px 0', background: accentColor, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{L(UI.speakBtn)}</button>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>{L(UI.tapSpeak)}</div>
          </div>
        )}

        {/* recording */}
        {phase === 'recording' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: accentColor, fontWeight: 700, marginBottom: 12 }}>🔴 {L(UI.listening)}</div>
            <button onClick={stopRecording} style={{ width: '100%', padding: '16px 0', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 12, color: '#dc2626', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', animation: 'smPulse 1s infinite' }}>{L(UI.stop)}</button>
            <style>{`@keyframes smPulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>
            <div style={{ height: 4, background: '#e0e0e6', borderRadius: 4, marginTop: 10 }}>
              <div style={{ height: '100%', background: '#ef4444', borderRadius: 4, width: `${recordingProgress}%`, transition: 'width 0.05s linear' }} />
            </div>
          </div>
        )}

        {/* processing */}
        {phase === 'processing' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 13, color: '#888' }}>⏳ {L(UI.processing)}</div>
          </div>
        )}

        {/* api error */}
        {phase === 'api_error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fee2e2', borderRadius: 10, padding: '12px 14px', border: '1px solid #fca5a5', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>{L(UI.serverError)}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{L(UI.serverHint)}</div>
            </div>
            <button onClick={() => setPhase('idle')} style={{ width: '100%', padding: '13px 0', background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {L(UI.retry)}
            </button>
          </div>
        )}

        {/* daily limit reached */}
        {phase === 'limit_reached' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 14px', border: '1px solid #fcd34d', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>{L(UI.limitReached)}</div>
            </div>
            <button onClick={nextQuestion} style={{ width: '100%', padding: '13px 0', background: '#6b7280', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {qIndex + 1 < questions.length ? L(UI.next) : L(UI.results)}
            </button>
          </div>
        )}

        {/* correct */}
        {phase === 'result_correct' && (
          <div>
            <div style={{ background: '#dcfce7', borderRadius: 10, padding: '12px 14px', border: '1px solid #86efac', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>✓ {L(UI.correct)}</div>
              {heard && <div style={{ fontSize: 13, color: '#444' }}>{L(UI.heard)} <b>{toSimplified(heard)}</b></div>}
              {feedback && <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>{feedback}</div>}
            </div>
            <div style={{ background: '#f5f5f8', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{L(UI.correctAns)}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>{q.zh}</div>
              <div style={{ fontSize: 12, color: accentColor }}>{q.pinyin}</div>
            </div>
            <button onClick={nextQuestion} style={{ width: '100%', padding: '13px 0', background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {qIndex + 1 < questions.length ? L(UI.next) : L(UI.results)}
            </button>
          </div>
        )}

        {/* close — almost correct */}
        {phase === 'result_close' && (
          <div>
            <div style={{ background: '#fff7ed', borderRadius: 10, padding: '12px 14px', border: '1px solid #fcd34d', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>≈ {L(UI.close)}</div>
              {heard && <div style={{ fontSize: 13, color: '#444' }}>{L(UI.heard)} <b>{toSimplified(heard)}</b></div>}
              {feedback
                ? <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>{feedback}</div>
                : <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>{L(UI.closeHint)}</div>
              }
            </div>
            <div style={{ background: '#f5f5f8', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{L(UI.correctAns)}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>{q.zh}</div>
              <div style={{ fontSize: 12, color: accentColor }}>{q.pinyin}</div>
            </div>
            <button onClick={nextQuestion} style={{ width: '100%', padding: '13px 0', background: '#d97706', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {qIndex + 1 < questions.length ? L(UI.next) : L(UI.results)}
            </button>
          </div>
        )}

        {/* no speech detected — neutral, doesn't count as a wrong attempt */}
        {phase === 'result_no_speech' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '12px 14px', border: '1px solid #bae6fd', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>🎙️ {L(UI.noSpeech)}</div>
            </div>
            <button onClick={() => { setPhase('idle'); }} style={{ width: '100%', padding: '13px 0', background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              🎤 {L(UI.retrySpeak)}
            </button>
          </div>
        )}

        {/* wrong — retry */}
        {phase === 'result_wrong_retry' && (
          <div>
            <div style={{ background: '#fff7ed', borderRadius: 10, padding: '12px 14px', border: '1px solid #fcd34d', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>{L(UI.retryPrompt)}</div>
              {heard && <div style={{ fontSize: 12, color: '#888' }}>{L(UI.heard)} <b>{toSimplified(heard)}</b></div>}
              {feedback && <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>{feedback}</div>}
            </div>
            <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginBottom: 12 }}>{L(UI.retryHint)}</div>
            <button onClick={retryAfterWrong} style={{ width: '100%', padding: '13px 0', background: '#d97706', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🎤 {L(UI.retrySpeak)}</button>
          </div>
        )}

        {/* wrong — final */}
        {phase === 'result_wrong_final' && (
          <div>
            <div style={{ background: '#fee2e2', borderRadius: 10, padding: '12px 14px', border: '1px solid #fca5a5', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>{L(UI.wrong)}</div>
              {heard && <div style={{ fontSize: 12, color: '#888' }}>{L(UI.heard)} <b>{toSimplified(heard)}</b></div>}
              {feedback && <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>{feedback}</div>}
            </div>
            <div style={{ background: '#f5f5f8', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{L(UI.correctAns)}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{q.zh}</div>
              <div style={{ fontSize: 12, color: accentColor, marginBottom: 2 }}>{q.pinyin}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{q.uz}</div>
            </div>
            <button onClick={startShadowing} style={{ width: '100%', padding: '13px 0', background: accentColor, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🔁 {L(UI.shadowing)}</button>
          </div>
        )}

        {/* shadowing */}
        {phase === 'shadowing' && (
          <div>
            <div style={{ background: accentBg, borderRadius: 10, padding: '14px 16px', marginBottom: 12, textAlign: 'center', border: `1px solid ${accentColor}33` }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{L(UI.shadowHint)}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>{q.zh}</div>
              <div style={{ fontSize: 13, color: accentColor, marginTop: 2 }}>{q.pinyin}</div>
            </div>
            <button onClick={() => speak(q.zh)} style={{ width: '100%', padding: '10px 0', background: '#f5f5f8', border: '1px solid #e0e0e6', borderRadius: 8, fontSize: 13, color: '#555', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>▶ {L(UI.listenAgain)}</button>
            <button onClick={nextQuestion} style={{ width: '100%', padding: '13px 0', background: '#6b7280', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {qIndex + 1 < questions.length ? L(UI.next) : L(UI.results)}
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
