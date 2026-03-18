'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Language = 'uz' | 'ru' | 'en';

export type DialogueLine = {
  speaker: 'A' | 'B';
  zh: string;
  pinyin: string;
  uz: string;
  audio_url?: string;
};

type TestUnit = {
  speaker: 'A' | 'B';
  zh: string;
  pinyin: string;
  uz: string;
  audio_url?: string;
  originalIndex: number; // index in the original lines array
};

type Score = 'correct' | 'close' | 'wrong';

type Phase =
  | 'idle'           // waiting for learner to tap speak
  | 'recording'
  | 'processing'
  | 'result_correct'
  | 'result_close'
  | 'result_wrong_retry'
  | 'result_wrong_final'
  | 'result_no_speech'
  | 'shadowing'
  | 'api_error'
  | 'limit_reached';

type Screen = 'permission' | 'denied' | 'quiz' | 'between' | 'complete';
type DeniedReason = 'blocked' | 'noDevice' | 'unsupported';

type T = Record<Language, string>;
const L = (obj: T, lang: Language) => obj[lang];

const UI = {
  title:         { uz: "Dialog mashqi",                  ru: 'Диалог-практика',            en: 'Dialogue Practice'        } as T,
  desc:          { uz: "Dialogda rol o'ynang. Avval B, keyin A bo'lasiz. Mikrofon ruxsati kerak.", ru: 'Разыграйте диалог по ролям. Сначала B, потом A. Нужен микрофон.', en: 'Role-play the dialogue. First as B, then A. Microphone access required.' } as T,
  enableMic:     { uz: 'Mikrofonni yoqish',              ru: 'Включить микрофон',           en: 'Enable Microphone'        } as T,
  checking:      { uz: 'Tekshirilmoqda…',                ru: 'Проверка…',                   en: 'Checking…'                } as T,
  unsupported:   { uz: "Brauzer qo'llab-quvvatlamaydi",  ru: 'Браузер не поддерживается',   en: 'Browser not supported'    } as T,
  noDevice:      { uz: 'Mikrofon topilmadi',             ru: 'Микрофон не найден',          en: 'No microphone found'      } as T,
  blocked:       { uz: 'Mikrofon ruxsati rad etildi',    ru: 'Доступ к микрофону отклонён', en: 'Microphone access denied'  } as T,
  blockedHint:   { uz: <>Manzil satridagi <b>🔒</b> belgisini bosing → <b>Mikrofon</b> → <b>Ruxsat</b> → sahifani yangilang.</>, ru: <><b>🔒</b> в адресной строке → <b>Микрофон</b> → <b>Разрешить</b> → обновите страницу.</>, en: <><b>🔒</b> in the address bar → <b>Microphone</b> → <b>Allow</b> → reload the page.</> } as Record<Language, React.ReactNode>,
  noDeviceHint:  { uz: "Qurilmangizda mikrofon topilmadi.", ru: 'Микрофон не найден. Проверьте подключение.', en: 'No microphone found. Check your device connection.' } as T,
  retry:         { uz: 'Qayta urinish',                  ru: 'Повторить попытку',           en: 'Try again'                } as T,
  correct:       { uz: "To'g'ri!",                       ru: 'Правильно!',                  en: 'Correct!'                 } as T,
  close:         { uz: "Deyarli to'g'ri",                ru: 'Почти правильно',             en: 'Almost correct'           } as T,
  heard:         { uz: 'Eshitildi:',                     ru: 'Услышано:',                   en: 'Heard:'                   } as T,
  correctAns:    { uz: "To'g'ri javob:",                 ru: 'Правильный ответ:',           en: 'Correct answer:'          } as T,
  next:          { uz: 'Keyingisi →',                    ru: 'Следующий →',                 en: 'Next →'                   } as T,
  speakBtn:      { uz: '🎤 Gapiring',                    ru: '🎤 Говорите',                  en: '🎤 Speak'                 } as T,
  tapSpeak:      { uz: 'Bosing va xitoycha ayting',      ru: 'Нажмите и говорите по-китайски', en: 'Tap and speak in Chinese' } as T,
  listening:     { uz: 'Tinglayapman…',                  ru: 'Слушаю…',                    en: 'Listening…'               } as T,
  stop:          { uz: "⏹ To'xtatish",                   ru: '⏹ Стоп',                     en: '⏹ Stop'                   } as T,
  processing:    { uz: 'Tekshirilmoqda…',                ru: 'Обрабатывается…',             en: 'Processing…'              } as T,
  serverError:   { uz: 'Server xatosi',                  ru: 'Ошибка сервера',              en: 'Server error'             } as T,
  serverHint:    { uz: 'Ovoz serverga yetib bormadi.',    ru: 'Аудио не дошло до сервера.',   en: "Audio didn't reach the server." } as T,
  limitReached:  { uz: "Bugungi limit tugadi (100 ta).",  ru: 'Дневной лимит исчерпан (100).', en: 'Daily limit reached (100).' } as T,
  noSpeech:      { uz: 'Ovoz eshitilmadi. Balandroq gapiring.', ru: 'Голос не распознан. Говорите громче.', en: 'No speech detected. Speak louder.' } as T,
  lastAttempt:   { uz: '⚠️ Oxirgi urinish',              ru: '⚠️ Последняя попытка',        en: '⚠️ Last attempt'          } as T,
  retrySpeak:    { uz: 'Qayta gapirish',                 ru: 'Говорить снова',              en: 'Speak again'              } as T,
  retryPrompt:   { uz: 'Qayta urining',                  ru: 'Попробуйте снова',            en: 'Try again'                } as T,
  retryHint:     { uz: 'Qayta eshiting va gapiring',     ru: 'Послушайте и повторите',      en: 'Listen again and try'     } as T,
  wrong:         { uz: 'Xato',                           ru: 'Неправильно',                 en: 'Wrong'                    } as T,
  shadowing:     { uz: "Qaytarib ayting",                 ru: 'Повторите',                   en: 'Repeat after'             } as T,
  shadowHint:    { uz: "Audio eshitildi. Endi o'zingiz ayting:", ru: 'Аудио воспроизведено. Скажите сами:', en: 'Audio played. Now say it yourself:' } as T,
  listenAgain:   { uz: 'Yana eshitish',                  ru: 'Послушать снова',             en: 'Listen again'             } as T,
  round1Done:    { uz: '1-tur tugadi!',                  ru: '1-й тур завершён!',           en: 'Round 1 complete!'        } as T,
  startRound2:   { uz: '2-turni boshlash →',             ru: 'Начать 2-й тур →',            en: 'Start Round 2 →'          } as T,
  round2Info:    { uz: "Endi siz A rolini o'ynaysiz",    ru: 'Теперь вы играете роль A',    en: 'Now you play role A'      } as T,
  round:         { uz: '-tur',                           ru: '-й тур',                      en: 'Round '                   } as T,
  yourRole:      { uz: 'Sizning rolingiz:',              ru: 'Ваша роль:',                  en: 'Your role:'               } as T,
  appSays:       { uz: 'gapiryapti…',                    ru: 'говорит…',                    en: 'is speaking…'             } as T,
  yourTurn:      { uz: 'Sizning navbatingiz',            ru: 'Ваша очередь',                en: 'Your turn'                } as T,
  perfect:       { uz: "Mukammal!",                      ru: 'Отлично!',                    en: 'Perfect!'                 } as T,
  good:          { uz: "Yaxshi!",                        ru: 'Хорошо!',                     en: 'Good!'                    } as T,
  review:        { uz: "Qayta mashq qiling.",             ru: 'Повторите практику.',          en: 'Keep practising.'         } as T,
  results:       { uz: 'Natijalar',                      ru: 'Результаты',                  en: 'Results'                  } as T,
  sayInChinese:  { uz: 'Xitoycha ayting:',               ru: 'Скажите по-китайски:',        en: 'Say in Chinese:'          } as T,
};

// ── Traditional → Simplified map ──
const TRAD_TO_SIMP: Record<string, string> = {
  '麼':'么','麽':'么','誰':'谁','嗎':'吗',
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

// ── Audio helper ──
function playAudio(text: string, audioUrl?: string): Promise<void> {
  return new Promise(resolve => {
    const url = audioUrl || `/audio/hsk1/grammar/${encodeURIComponent(text)}.mp3`;
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN'; u.rate = 0.85;
        u.onend = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } else {
        resolve();
      }
    };
    audio.play().catch(() => {
      audio.onerror?.(new Event('error'));
    });
  });
}

function speakFire(text: string, audioUrl?: string) {
  playAudio(text, audioUrl);
}

// ── Test unit splitting ──
function getTestUnits(line: DialogueLine, originalIndex: number): TestUnit[] {
  const sentences = line.zh
    .split(/(?<=[。？！])\s*/)
    .filter(s => s.trim().length > 0);
  const needsSplit = sentences.some(s => s.length > 15);
  if (!needsSplit) return [{ ...line, originalIndex }];
  return sentences.map((zh, i) => ({
    speaker: line.speaker,
    zh,
    pinyin: '',
    uz: i === 0 ? line.uz : '…',
    audio_url: i === 0 ? line.audio_url : undefined,
    originalIndex,
  }));
}

// ── Star calculation ──
function calcStars(r1: Score[], r2: Score[], shadowingUsed: boolean): number {
  const all = [...r1, ...r2];
  const total = all.length;
  const correct = all.filter(s => s === 'correct' || s === 'close').length;
  if (correct === total && !shadowingUsed) return 3;
  if (correct >= total - 1 && !shadowingUsed) return 2;
  return 1;
}

// ── Props ──
interface Props {
  lines: DialogueLine[];
  dialogueId: string;
  accentColor?: string;
  language?: Language;
  onComplete?: (stars: number) => void;
}

export function DialogueRolePlay({
  lines,
  dialogueId,
  accentColor = '#dc2626',
  language = 'uz',
  onComplete,
}: Props) {
  const { getAccessToken } = useAuth();

  // ── Precompute test units ──
  const allTestUnits = useMemo(() => lines.flatMap((l, i) => getTestUnits(l, i)), [lines]);
  const aUnits = useMemo(() => allTestUnits.filter(u => u.speaker === 'A'), [allTestUnits]);
  const bUnits = useMemo(() => allTestUnits.filter(u => u.speaker === 'B'), [allTestUnits]);

  // ── State ──
  const [screen, setScreen] = useState<Screen>('permission');
  const [round, setRound] = useState<1 | 2>(1);
  const [unitIndex, setUnitIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [attempt, setAttempt] = useState<1 | 2>(1);
  const [heard, setHeard] = useState('');
  const [feedback, setFeedback] = useState('');
  const [r1scores, setR1scores] = useState<Score[]>([]);
  const [r2scores, setR2scores] = useState<Score[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [deniedReason, setDeniedReason] = useState<DeniedReason>('blocked');
  const [recordingProgress, setRecordingProgress] = useState(0);
  // Tracks which lines have been answered: key = "round_unitIndex", value = zh text
  const [revealed, setRevealed] = useState<Record<string, { zh: string; score: Score }>>({});
  const [playingAppLine, setPlayingAppLine] = useState(false);

  const shadowingUsedRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeBubbleRef = useRef<HTMLDivElement | null>(null);

  // ── Derived ──
  const learnerUnits = round === 1 ? bUnits : aUnits;
  const appUnits = round === 1 ? aUnits : bUnits;
  const learnerRole = round === 1 ? 'B' : 'A';
  const appRole = round === 1 ? 'A' : 'B';
  const currentLearnerUnit = learnerUnits[unitIndex];
  const currentAppUnit = appUnits[unitIndex];
  const setScores = round === 1 ? setR1scores : setR2scores;

  const t = (obj: T) => L(obj, language);

  // ── Auto-scroll to active bubble ──
  useEffect(() => {
    if (screen === 'quiz' && activeBubbleRef.current) {
      activeBubbleRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [screen, unitIndex, phase]);

  // ── Recording progress bar ──
  useEffect(() => {
    if (phase !== 'recording') { setRecordingProgress(0); return; }
    const start = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / 6000) * 100);
      setRecordingProgress(pct);
      if (pct >= 100) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [phase]);

  // ── Play app line audio when quiz starts or after advancing ──
  const playAppLine = useCallback(async () => {
    if (!currentAppUnit) return;
    setPlayingAppLine(true);
    await playAudio(currentAppUnit.zh, currentAppUnit.audio_url);
    setPlayingAppLine(false);
  }, [currentAppUnit]);

  // Auto-play app line when entering quiz or advancing to new unit
  // Round 1: app (A) speaks BEFORE learner (B) — app initiates
  // Round 2: app (B) speaks AFTER learner (A) answers — app responds
  const prevUnitKey = useRef('');
  useEffect(() => {
    const key = `${round}_${unitIndex}`;
    if (screen === 'quiz' && phase === 'idle' && key !== prevUnitKey.current) {
      prevUnitKey.current = key;
      if (round === 1) {
        // Round 1: A speaks first, then learner (B) responds
        playAppLine();
      }
      // Round 2: learner (A) speaks first — no auto-play
    }
  }, [screen, round, unitIndex, phase, playAppLine]);

  // ── Permission ──
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
      setPhase('idle');
    } catch (err) {
      const name = (err as DOMException).name;
      setDeniedReason(name === 'NotFoundError' ? 'noDevice' : 'blocked');
      setScreen('denied');
    } finally {
      setRequesting(false);
    }
  };

  // ── Recording ──
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

  // ── Submit audio ──
  const submitAudio = async (mimeType: string) => {
    if (!currentLearnerUnit) return;
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blob.size < 3000) {
        setHeard(''); setFeedback('');
        setPhase('result_no_speech');
        return;
      }
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const formData = new FormData();
      formData.append('audio', blob, `answer.${ext}`);
      formData.append('expected', currentLearnerUnit.zh);
      formData.append('language', language);
      const token = await getAccessToken();
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json() as { text?: string; result?: string; feedback?: string; error?: string };
      if (data.error === 'limit_reached') { setPhase('limit_reached'); return; }
      if (data.error) throw new Error(data.error);
      setHeard(data.text ?? '');
      setFeedback(data.feedback ?? '');
      if (data.result === 'no_speech') {
        setHeard(''); setFeedback('');
        setPhase('result_no_speech');
        return;
      }
      const result = (data.result ?? 'wrong') as Score;
      const revealKey = `${round}_${unitIndex}`;
      if (result === 'correct') {
        setScores(p => [...p, result]);
        setRevealed(p => ({ ...p, [revealKey]: { zh: currentLearnerUnit.zh, score: 'correct' } }));
        setPhase('result_correct');
        // Round 1: echo learner's line. Round 2: play app (B) response
        if (round === 2 && currentAppUnit) {
          speakFire(currentAppUnit.zh, currentAppUnit.audio_url);
        } else {
          speakFire(currentLearnerUnit.zh, currentLearnerUnit.audio_url);
        }
      } else if (result === 'close') {
        setScores(p => [...p, result]);
        setRevealed(p => ({ ...p, [revealKey]: { zh: currentLearnerUnit.zh, score: 'close' } }));
        setPhase('result_close');
        if (round === 2 && currentAppUnit) {
          speakFire(currentAppUnit.zh, currentAppUnit.audio_url);
        } else {
          speakFire(currentLearnerUnit.zh, currentLearnerUnit.audio_url);
        }
      } else {
        if (attempt === 1) {
          setPhase('result_wrong_retry');
        } else {
          setScores(p => [...p, 'wrong']);
          setRevealed(p => ({ ...p, [revealKey]: { zh: currentLearnerUnit.zh, score: 'wrong' } }));
          setPhase('result_wrong_final');
          speakFire(currentLearnerUnit.zh, currentLearnerUnit.audio_url);
        }
      }
    } catch {
      setPhase('api_error');
    }
  };

  // ── Navigation ──
  const advanceUnit = () => {
    if (unitIndex + 1 >= learnerUnits.length) {
      if (round === 1) {
        setScreen('between');
      } else {
        setScreen('complete');
      }
    } else {
      setUnitIndex(i => i + 1);
      setPhase('idle');
      setAttempt(1);
      setHeard('');
      setFeedback('');
    }
  };

  const startRound2 = () => {
    setRound(2);
    setUnitIndex(0);
    setPhase('idle');
    setAttempt(1);
    setHeard('');
    setFeedback('');
    setRevealed({});
    prevUnitKey.current = '';
    setScreen('quiz');
  };

  const restartAll = () => {
    setRound(1);
    setUnitIndex(0);
    setPhase('idle');
    setAttempt(1);
    setHeard('');
    setFeedback('');
    setR1scores([]);
    setR2scores([]);
    setRevealed({});
    prevUnitKey.current = '';
    shadowingUsedRef.current = false;
    setScreen('quiz');
  };

  const retryAfterWrong = () => { setAttempt(2); startRecording(); };
  const startShadowing = () => {
    shadowingUsedRef.current = true;
    speakFire(currentLearnerUnit.zh, currentLearnerUnit.audio_url);
    setPhase('shadowing');
  };

  // ── Fire onComplete ──
  useEffect(() => {
    if (screen === 'complete' && r1scores.length > 0 && r2scores.length > 0) {
      const stars = calcStars(r1scores, r2scores, shadowingUsedRef.current);
      onComplete?.(stars);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Render helpers ──
  const renderUnitRecap = (units: TestUnit[], unitScores: Score[]) => (
    <div style={{ textAlign: 'left', marginBottom: 16 }}>
      {units.map((u, i) => {
        const s = unitScores[i];
        const icon = s === 'correct' ? '✓' : s === 'close' ? '≈' : '✗';
        const color = s === 'correct' || s === 'close' ? '#16a34a' : '#dc2626';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f5f5f8', borderRadius: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16, color, fontWeight: 700, minWidth: 20 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 15, color: '#1a1a2e', fontWeight: 600 }}>{u.zh}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{u.uz}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderStars = (count: number) => (
    <div style={{ fontSize: 32, letterSpacing: 4, marginBottom: 8 }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{
          color: i <= count ? '#facc15' : '#e0e0e6',
          transition: 'color 0.3s',
          transitionDelay: `${i * 300}ms`,
        }}>★</span>
      ))}
    </div>
  );

  const correctCount = (arr: Score[]) => arr.filter(s => s === 'correct' || s === 'close').length;

  // ── Get bubble state for a line in the dialogue ──
  const getBubbleState = (lineIndex: number, speaker: 'A' | 'B') => {
    const isLearnerLine = speaker === learnerRole;
    const isAppLine = speaker === appRole;

    if (isAppLine) {
      // Find the corresponding app unit index for this original line
      const appUnitIdx = appUnits.findIndex(u => u.originalIndex === lineIndex);
      const isCurrentApp = appUnitIdx === unitIndex;
      const isPastApp = appUnitIdx < unitIndex;
      return { type: 'app' as const, isCurrent: isCurrentApp, isPast: isPastApp, isFuture: appUnitIdx > unitIndex };
    }

    if (isLearnerLine) {
      const learnerUnitIdx = learnerUnits.findIndex(u => u.originalIndex === lineIndex);
      const revealKey = `${round}_${learnerUnitIdx}`;
      const revealData = revealed[revealKey];
      const isCurrent = learnerUnitIdx === unitIndex;
      const isPast = learnerUnitIdx < unitIndex;
      const isFuture = learnerUnitIdx > unitIndex;
      return { type: 'learner' as const, isCurrent, isPast, isFuture, revealData, unitIdx: learnerUnitIdx };
    }

    return { type: 'other' as const, isCurrent: false, isPast: false, isFuture: true };
  };

  // ══════════════════════════════════════════════════════════
  // ── PERMISSION SCREEN ──
  // ══════════════════════════════════════════════════════════
  if (screen === 'permission') return (
    <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{t(UI.title)}</div>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>{t(UI.desc)}</div>
      <button onClick={requestPermission} disabled={requesting} style={{
        background: requesting ? '#aaa' : accentColor, border: 'none', borderRadius: 12,
        color: '#fff', fontSize: 15, fontWeight: 700,
        padding: '14px 32px', cursor: requesting ? 'wait' : 'pointer', fontFamily: 'inherit',
      }}>{requesting ? t(UI.checking) : t(UI.enableMic)}</button>
    </div>
  );

  // ── DENIED ──
  if (screen === 'denied') return (
    <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
        {deniedReason === 'unsupported' ? t(UI.unsupported) : deniedReason === 'noDevice' ? t(UI.noDevice) : t(UI.blocked)}
      </div>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8, marginBottom: 24 }}>
        {deniedReason === 'unsupported' ? t(UI.unsupported) : deniedReason === 'noDevice' ? t(UI.noDeviceHint) : UI.blockedHint[language]}
      </div>
      {deniedReason !== 'unsupported' && (
        <button onClick={() => setScreen('permission')} style={{
          background: accentColor, border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 15, fontWeight: 700,
          padding: '14px 32px', cursor: 'pointer', fontFamily: 'inherit',
        }}>{t(UI.retry)}</button>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // ── BETWEEN ROUNDS SCREEN ──
  // ══════════════════════════════════════════════════════════
  if (screen === 'between') return (
    <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{t(UI.round1Done)}</div>
      <div style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>
        {correctCount(r1scores)} / {bUnits.length} {t(UI.correct)}
      </div>
      {renderUnitRecap(bUnits, r1scores)}
      <div style={{ fontSize: 14, color: '#555', marginBottom: 20, fontWeight: 600 }}>{t(UI.round2Info)}</div>
      <button onClick={startRound2} style={{
        width: '100%', padding: '14px 0', background: accentColor, border: 'none', borderRadius: 12,
        color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>{t(UI.startRound2)}</button>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // ── COMPLETE SCREEN ──
  // ══════════════════════════════════════════════════════════
  if (screen === 'complete') {
    const stars = calcStars(r1scores, r2scores, shadowingUsedRef.current);
    const totalCorrect = correctCount(r1scores) + correctCount(r2scores);
    const totalUnits = bUnits.length + aUnits.length;
    const pct = Math.round((totalCorrect / totalUnits) * 100);
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
        {renderStars(stars)}
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{totalCorrect} / {totalUnits}</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
          {pct === 100 ? t(UI.perfect) : pct >= 60 ? t(UI.good) : t(UI.review)}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          {language === 'en' ? 'Round 1' : '1'}{language !== 'en' ? t(UI.round) : ''} — {t(UI.yourRole)} B
        </div>
        {renderUnitRecap(bUnits, r1scores)}

        <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          {language === 'en' ? 'Round 2' : '2'}{language !== 'en' ? t(UI.round) : ''} — {t(UI.yourRole)} A
        </div>
        {renderUnitRecap(aUnits, r2scores)}

        <button onClick={restartAll} style={{
          width: '100%', padding: '14px 0', background: accentColor, border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>{t(UI.retry)}</button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ── QUIZ SCREEN — Full dialogue chat layout ──
  // ══════════════════════════════════════════════════════════
  return (
    <div className="drp">
      {/* Progress bar */}
      <div className="drp__progress-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 4 }}>
          <span>
            {language === 'en' ? `Round ${round}` : `${round}${t(UI.round)}`} · {unitIndex + 1} / {learnerUnits.length}
          </span>
          <span>{t(UI.yourRole)} {learnerRole}</span>
        </div>
        <div className="drp__progress-bar">
          <div className="drp__progress-fill" style={{ width: `${(unitIndex / learnerUnits.length) * 100}%`, background: accentColor }} />
        </div>
      </div>

      {/* Full dialogue — all lines visible */}
      <div className="drp__chat">
        {lines.map((line, lineIdx) => {
          const state = getBubbleState(lineIdx, line.speaker);
          const isA = line.speaker === 'A';
          const isCurrentLearner = state.type === 'learner' && state.isCurrent;
          const isAnswered = state.type === 'learner' && state.revealData;
          const isFutureLearner = state.type === 'learner' && state.isFuture;
          const isCurrentApp = state.type === 'app' && state.isCurrent;

          return (
            <div
              key={`${round}_${lineIdx}`}
              ref={isCurrentLearner || isCurrentApp ? activeBubbleRef : undefined}
              className={`drp__bubble ${isA ? 'drp__bubble--a' : 'drp__bubble--b'}`}
              style={{
                borderColor: isCurrentLearner ? accentColor
                  : isCurrentApp && playingAppLine ? '#bae6fd'
                  : 'transparent',
                opacity: (state.isFuture && !isCurrentApp) ? 0.5 : 1,
              }}
            >
              <div className="drp__bubble-speaker" style={{
                color: isA ? '#0369a1' : accentColor,
              }}>
                {line.speaker}
              </div>

              {/* App line: always show Chinese */}
              {state.type === 'app' && (
                <div className="drp__bubble-text">{line.zh}</div>
              )}

              {/* Learner line: show based on state */}
              {state.type === 'learner' && (
                <>
                  {isAnswered ? (
                    <div className="drp__bubble-text" style={{
                      color: state.revealData!.score === 'wrong' ? '#dc2626' : '#16a34a',
                    }}>
                      {state.revealData!.score === 'wrong' ? '✗' : '✓'} {state.revealData!.zh}
                    </div>
                  ) : (
                    <div className="drp__bubble-text" style={{
                      fontStyle: 'italic',
                      color: isFutureLearner ? '#bbb' : '#555',
                    }}>
                      {line.uz}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Mic / interaction area below the dialogue */}
      {currentLearnerUnit && (
        <div className="drp__mic-area">
          {/* Translation prompt */}
          <div className="drp__prompt">
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{t(UI.sayInChinese)}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{currentLearnerUnit.uz}</div>
          </div>

          {/* ── idle ── */}
          {phase === 'idle' && (
            <div style={{ textAlign: 'center' }}>
              {attempt === 2 && <div style={{ fontSize: 12, color: '#d97706', marginBottom: 10, fontWeight: 600 }}>{t(UI.lastAttempt)}</div>}
              <button onClick={startRecording} disabled={playingAppLine} className="drp__btn" style={{
                background: playingAppLine ? '#ccc' : accentColor,
                cursor: playingAppLine ? 'not-allowed' : 'pointer',
              }}>{playingAppLine ? `${appRole} ${t(UI.appSays)}` : t(UI.speakBtn)}</button>
              {!playingAppLine && round === 1 && <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>{t(UI.tapSpeak)}</div>}
              {!playingAppLine && round === 2 && <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>{t(UI.tapSpeak)}</div>}
            </div>
          )}

          {/* ── recording ── */}
          {phase === 'recording' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: accentColor, fontWeight: 700, marginBottom: 8 }}>🔴 {t(UI.listening)}</div>
              <button onClick={stopRecording} className="drp__btn" style={{
                background: '#fee2e2', border: '2px solid #ef4444', color: '#dc2626',
                animation: 'drpPulse 1s infinite',
              }}>{t(UI.stop)}</button>
              <style>{`@keyframes drpPulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>
              <div style={{ height: 4, background: '#e0e0e6', borderRadius: 4, marginTop: 8 }}>
                <div style={{ height: '100%', background: '#ef4444', borderRadius: 4, width: `${recordingProgress}%`, transition: 'width 0.05s linear' }} />
              </div>
            </div>
          )}

          {/* ── processing ── */}
          {phase === 'processing' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 13, color: '#888' }}>⏳ {t(UI.processing)}</div>
            </div>
          )}

          {/* ── api error ── */}
          {phase === 'api_error' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#fee2e2', borderRadius: 10, padding: '10px 14px', border: '1px solid #fca5a5', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>{t(UI.serverError)}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{t(UI.serverHint)}</div>
              </div>
              <button onClick={() => setPhase('idle')} className="drp__btn" style={{ background: accentColor }}>{t(UI.retry)}</button>
            </div>
          )}

          {/* ── limit reached ── */}
          {phase === 'limit_reached' && (
            <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 14px', border: '1px solid #fcd34d', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>{t(UI.limitReached)}</div>
            </div>
          )}

          {/* ── no speech ── */}
          {phase === 'result_no_speech' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '10px 14px', border: '1px solid #bae6fd', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>🎙️ {t(UI.noSpeech)}</div>
              </div>
              <button onClick={() => setPhase('idle')} className="drp__btn" style={{ background: accentColor }}>🎤 {t(UI.retrySpeak)}</button>
            </div>
          )}

          {/* ── correct ── */}
          {phase === 'result_correct' && (
            <div>
              <div style={{ background: '#dcfce7', borderRadius: 10, padding: '10px 14px', border: '1px solid #86efac', marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>✓ {t(UI.correct)}</div>
                {heard && <div style={{ fontSize: 13, color: '#444' }}>{t(UI.heard)} <b>{toSimplified(heard)}</b></div>}
                {feedback && <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>{feedback}</div>}
              </div>
              <button onClick={advanceUnit} className="drp__btn" style={{ background: accentColor }}>
                {unitIndex + 1 < learnerUnits.length ? t(UI.next) : t(UI.results)}
              </button>
            </div>
          )}

          {/* ── close ── */}
          {phase === 'result_close' && (
            <div>
              <div style={{ background: '#fff7ed', borderRadius: 10, padding: '10px 14px', border: '1px solid #fcd34d', marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#d97706', marginBottom: 2 }}>≈ {t(UI.close)}</div>
                {heard && <div style={{ fontSize: 13, color: '#444' }}>{t(UI.heard)} <b>{toSimplified(heard)}</b></div>}
                {feedback && <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>{feedback}</div>}
              </div>
              <button onClick={advanceUnit} className="drp__btn" style={{ background: '#d97706' }}>
                {unitIndex + 1 < learnerUnits.length ? t(UI.next) : t(UI.results)}
              </button>
            </div>
          )}

          {/* ── wrong retry ── */}
          {phase === 'result_wrong_retry' && (
            <div>
              <div style={{ background: '#fff7ed', borderRadius: 10, padding: '10px 14px', border: '1px solid #fcd34d', marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#d97706', marginBottom: 2 }}>{t(UI.retryPrompt)}</div>
                {heard && <div style={{ fontSize: 12, color: '#888' }}>{t(UI.heard)} <b>{toSimplified(heard)}</b></div>}
                {feedback && <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>{feedback}</div>}
              </div>
              <button onClick={retryAfterWrong} className="drp__btn" style={{ background: '#d97706' }}>🎤 {t(UI.retrySpeak)}</button>
            </div>
          )}

          {/* ── wrong final ── */}
          {phase === 'result_wrong_final' && (
            <div>
              <div style={{ background: '#fee2e2', borderRadius: 10, padding: '10px 14px', border: '1px solid #fca5a5', marginBottom: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>{t(UI.wrong)}</div>
                {heard && <div style={{ fontSize: 12, color: '#888' }}>{t(UI.heard)} <b>{toSimplified(heard)}</b></div>}
                {feedback && <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>{feedback}</div>}
              </div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{t(UI.correctAns)}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>{currentLearnerUnit.zh}</div>
                {currentLearnerUnit.pinyin && <div style={{ fontSize: 12, color: accentColor }}>{currentLearnerUnit.pinyin}</div>}
              </div>
              <button onClick={startShadowing} className="drp__btn" style={{ background: accentColor }}>🔁 {t(UI.shadowing)}</button>
            </div>
          )}

          {/* ── shadowing ── */}
          {phase === 'shadowing' && (
            <div>
              <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 16px', marginBottom: 10, textAlign: 'center', border: '1px solid #fcd34d' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{t(UI.shadowHint)}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{currentLearnerUnit.zh}</div>
                {currentLearnerUnit.pinyin && <div style={{ fontSize: 13, color: accentColor, marginTop: 2 }}>{currentLearnerUnit.pinyin}</div>}
              </div>
              <button onClick={() => speakFire(currentLearnerUnit.zh, currentLearnerUnit.audio_url)} style={{ width: '100%', padding: '10px 0', background: '#f5f5f8', border: '1px solid #e0e0e6', borderRadius: 8, fontSize: 13, color: '#555', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>▶ {t(UI.listenAgain)}</button>
              <button onClick={advanceUnit} className="drp__btn" style={{ background: '#6b7280' }}>
                {unitIndex + 1 < learnerUnits.length ? t(UI.next) : t(UI.results)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
