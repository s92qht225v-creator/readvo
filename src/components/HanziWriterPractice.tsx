'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HanziCanvas } from './HanziCanvas';
import { CoachMarkTour } from './CoachMark';
import type { TourStep } from './CoachMark';
import type { HanziWord } from '@/services/writing';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

export type { HanziWord };

interface Props {
  lang: 'uz' | 'ru' | 'en';
  words?: HanziWord[];
  onBack?: () => void;
  autoStart?: boolean;
  hideSubtabs?: boolean;
  subtab?: 'writing' | 'chars';
  onSubtabChange?: (tab: 'writing' | 'chars') => void;
}

const WORDS: HanziWord[] = [
  { char: '我', pinyin: 'wǒ', uz: 'men', ru: 'я', en: 'I / me', strokes: 7, radical: '戈', radicalUz: 'nayza', radicalRu: 'копьё', radicalEn: 'spear', ex: '我是学生。', expy: 'Wǒ shì xuéshēng.', exuz: 'Men talabaman.', exru: 'Я студент.', exen: 'I am a student.' },
  { char: '你', pinyin: 'nǐ', uz: 'sen', ru: 'ты', en: 'you', strokes: 6, radical: '人', radicalUz: 'odam', radicalRu: 'человек', radicalEn: 'person', ex: '你好！', expy: 'Nǐ hǎo!', exuz: 'Salom!', exru: 'Привет!', exen: 'Hello!' },
  { char: '他', pinyin: 'tā', uz: 'u (erkak)', ru: 'он', en: 'he / him', strokes: 5, radical: '人', radicalUz: 'odam', radicalRu: 'человек', radicalEn: 'person', ex: '他是老师。', expy: 'Tā shì lǎoshī.', exuz: "U o'qituvchi.", exru: 'Он учитель.', exen: 'He is a teacher.' },
  { char: '她', pinyin: 'tā', uz: 'u (ayol)', ru: 'она', en: 'she / her', strokes: 6, radical: '女', radicalUz: 'ayol', radicalRu: 'женщина', radicalEn: 'woman', ex: '她很漂亮。', expy: 'Tā hěn piàoliang.', exuz: 'U juda chiroyli.', exru: 'Она очень красивая.', exen: 'She is very beautiful.' },
  { char: '们', pinyin: 'men', uz: "ko'plik qo'shimchasi", ru: 'суффикс множества', en: 'plural suffix', strokes: 5, radical: '人', radicalUz: 'odam', radicalRu: 'человек', radicalEn: 'person', ex: '我们是朋友。', expy: 'Wǒmen shì péngyou.', exuz: 'Biz do\'stmiz.', exru: 'Мы друзья.', exen: 'We are friends.' },
  { char: '吃', pinyin: 'chī', uz: 'yemoq', ru: 'есть', en: 'to eat', strokes: 6, radical: '口', radicalUz: 'og\'iz', radicalRu: 'рот', radicalEn: 'mouth', ex: '我吃饭。', expy: 'Wǒ chī fàn.', exuz: 'Men ovqat yeyapman.', exru: 'Я ем.', exen: 'I am eating.' },
  { char: '喝', pinyin: 'hē', uz: 'ichmoq', ru: 'пить', en: 'to drink', strokes: 12, radical: '口', radicalUz: 'og\'iz', radicalRu: 'рот', radicalEn: 'mouth', ex: '我喝水。', expy: 'Wǒ hē shuǐ.', exuz: 'Men suv ichyapman.', exru: 'Я пью воду.', exen: 'I drink water.' },
  { char: '看', pinyin: 'kàn', uz: "ko'rmoq", ru: 'смотреть', en: 'to look / to read', strokes: 9, radical: '目', radicalUz: 'ko\'z', radicalRu: 'глаз', radicalEn: 'eye', ex: '我看书。', expy: 'Wǒ kàn shū.', exuz: 'Men kitob o\'qiyapman.', exru: 'Я читаю книгу.', exen: 'I am reading a book.' },
  { char: '听', pinyin: 'tīng', uz: 'tinglаmoq', ru: 'слушать', en: 'to listen', strokes: 7, radical: '口', radicalUz: 'og\'iz', radicalRu: 'рот', radicalEn: 'mouth', ex: '我听音乐。', expy: 'Wǒ tīng yīnyuè.', exuz: 'Men musiqa tinglayapman.', exru: 'Я слушаю музыку.', exen: 'I listen to music.' },
  { char: '说', pinyin: 'shuō', uz: 'gapirmoq', ru: 'говорить', en: 'to speak', strokes: 9, radical: '讠', radicalUz: 'nutq', radicalRu: 'речь', radicalEn: 'speech', ex: '他说中文。', expy: 'Tā shuō Zhōngwén.', exuz: 'U xitoy tilida gapiradi.', exru: 'Он говорит по-китайски.', exen: 'He speaks Chinese.' },
  { char: '走', pinyin: 'zǒu', uz: 'yurmoq', ru: 'идти', en: 'to walk / to go', strokes: 7, radical: '走', radicalUz: 'yurish', radicalRu: 'ходьба', radicalEn: 'walk', ex: '我走路。', expy: 'Wǒ zǒu lù.', exuz: 'Men piyoda yuraman.', exru: 'Я иду пешком.', exen: 'I walk.' },
  { char: '来', pinyin: 'lái', uz: 'kelmoq', ru: 'приходить', en: 'to come', strokes: 7, radical: '木', radicalUz: 'daraxt', radicalRu: 'дерево', radicalEn: 'tree', ex: '他来了。', expy: 'Tā lái le.', exuz: 'U keldi.', exru: 'Он пришёл.', exen: 'He came.' },
  { char: '去', pinyin: 'qù', uz: 'ketmoq', ru: 'уходить', en: 'to go', strokes: 5, radical: '厶', radicalUz: 'xususiy', radicalRu: 'личный', radicalEn: 'private', ex: '我去学校。', expy: 'Wǒ qù xuéxiào.', exuz: 'Men maktabga ketyapman.', exru: 'Я иду в школу.', exen: 'I go to school.' },
  { char: '大', pinyin: 'dà', uz: 'katta', ru: 'большой', en: 'big', strokes: 3, radical: '大', radicalUz: 'katta', radicalRu: 'большой', radicalEn: 'big', ex: '这个很大。', expy: 'Zhège hěn dà.', exuz: 'Bu juda katta.', exru: 'Это очень большое.', exen: 'This is very big.' },
  { char: '小', pinyin: 'xiǎo', uz: 'kichik', ru: 'маленький', en: 'small', strokes: 3, radical: '小', radicalUz: 'kichik', radicalRu: 'маленький', radicalEn: 'small', ex: '那个很小。', expy: 'Nàge hěn xiǎo.', exuz: 'U juda kichik.', exru: 'То очень маленькое.', exen: 'That is very small.' },
  { char: '好', pinyin: 'hǎo', uz: 'yaxshi', ru: 'хороший', en: 'good', strokes: 6, radical: '女', radicalUz: 'ayol', radicalRu: 'женщина', radicalEn: 'woman', ex: '你好！', expy: 'Nǐ hǎo!', exuz: 'Salom!', exru: 'Привет!', exen: 'Hello!' },
  { char: '是', pinyin: 'shì', uz: "bo'lmoq", ru: 'быть', en: 'to be', strokes: 9, radical: '日', radicalUz: 'quyosh', radicalRu: 'солнце', radicalEn: 'sun', ex: '他是老师。', expy: 'Tā shì lǎoshī.', exuz: "U o'qituvchi.", exru: 'Он учитель.', exen: 'He is a teacher.' },
  { char: '有', pinyin: 'yǒu', uz: "bor (ega bo'lmoq)", ru: 'иметь', en: 'to have', strokes: 6, radical: '月', radicalUz: 'oy', radicalRu: 'луна', radicalEn: 'moon', ex: '我有一本书。', expy: 'Wǒ yǒu yì běn shū.', exuz: 'Mening bitta kitobim bor.', exru: 'У меня есть книга.', exen: 'I have a book.' },
  { char: '人', pinyin: 'rén', uz: 'odam', ru: 'человек', en: 'person', strokes: 2, radical: '人', radicalUz: 'odam', radicalRu: 'человек', radicalEn: 'person', ex: '他是好人。', expy: 'Tā shì hǎo rén.', exuz: 'U yaxshi odam.', exru: 'Он хороший человек.', exen: 'He is a good person.' },
  { char: '中', pinyin: 'zhōng', uz: "o'rta / Xitoy", ru: 'середина / Китай', en: 'middle / China', strokes: 4, radical: '丨', radicalUz: 'chiziq', radicalRu: 'черта', radicalEn: 'line', ex: '我是中国人。', expy: 'Wǒ shì Zhōngguó rén.', exuz: 'Men xitoylikman.', exru: 'Я китаец.', exen: 'I am Chinese.' },
];

type View = 'home' | 'practice' | 'done';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HanziWriterPractice({ lang, words: wordsProp, onBack, autoStart, hideSubtabs, subtab: subtabProp, onSubtabChange }: Props) {
  const activeWords = wordsProp ?? WORDS;
  const audio = useAudioPlayer();
  const audioMapRef = useRef<Record<string, string>>({});
  const audioMapReady = useRef<Promise<void> | null>(null);
  useEffect(() => {
    audioMapReady.current = import('@/services/writing-audio').then((m) => { audioMapRef.current = m.WRITING_AUDIO; });
    return () => { audio.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [view, setView] = useState<View>('home');
  const [subtabInternal, setSubtabInternal] = useState<'writing' | 'chars'>('writing');
  const subtab = subtabProp ?? subtabInternal;
  const setSubtab = onSubtabChange ?? setSubtabInternal;
  const [expandedChar, setExpandedChar] = useState<string | null>(null);

  const [sessionQueue, setSessionQueue] = useState<HanziWord[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showAnswer, setShowAnswer] = useState(0);
  const [hiddenMode, setHiddenMode] = useState(false);
  const eraseBtnRef = useRef<HTMLButtonElement>(null);
  const showBtnRef = useRef<HTMLButtonElement>(null);
  const hideBtnRef = useRef<HTMLButtonElement>(null);

  /** Play audio for a word (looks up from dynamically-loaded audio map) */
  const playWordAudio = useCallback(async (word: HanziWord) => {
    if (audioMapReady.current) await audioMapReady.current;
    const url = audioMapRef.current[word.char];
    if (url) audio.play(`writing-${word.char}`, url);
  }, [audio]);

  // Auto-start: skip home screen and go directly to practice with all words
  useEffect(() => {
    if (!autoStart) return;
    setSessionQueue(activeWords);
    setSessionIndex(0);
    setCharIndex(0);
    setView('practice');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = useCallback(() => {
    const shuffled = shuffle(activeWords);
    setSessionQueue(shuffled);
    setSessionIndex(0);
    setCharIndex(0);
    setView('practice');
  }, [activeWords]);

  const advance = useCallback(() => {
    setShowAnswer(0);
    const currentChars = [...(sessionQueue[sessionIndex]?.char || '')];
    if (charIndex < currentChars.length - 1) {
      // Next character within same multi-char word — no audio (same word)
      setCharIndex((i) => i + 1);
    } else if (sessionIndex + 1 >= sessionQueue.length) {
      setView('done');
    } else {
      // Moving to next word — play its audio
      const nextWord = sessionQueue[sessionIndex + 1];
      setCharIndex(0);
      setSessionIndex((i) => i + 1);
      setResetKey((k) => k + 1);
      if (nextWord) setTimeout(() => playWordAudio(nextWord), 200);
    }
  }, [sessionIndex, sessionQueue, charIndex, playWordAudio]);

  const handleErase = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowAnswer(0);
  }, []);

  const handleShow = useCallback(() => {
    setShowAnswer((c) => c + 1);
  }, []);

  const keepScroll = useCallback((fn: () => void) => {
    const y = window.scrollY;
    fn();
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
  }, []);

  const handleRestart = useCallback(() => {
    const shuffled = shuffle(sessionQueue);
    setSessionQueue(shuffled);
    setSessionIndex(0);
    setCharIndex(0);
    setShowAnswer(0);
    setResetKey(0);
    setHiddenMode(false);
    setView('practice');
  }, [sessionQueue]);

  const currentWord = sessionQueue[sessionIndex];
  const wordChars = currentWord ? [...currentWord.char] : [];
  const isMultiChar = wordChars.length > 1;
  const currentChar = wordChars[charIndex] || '';

  const subtabBar = hideSubtabs ? null : (
    <div className="hanzi-practice__subtabs">
      <button
        className={`hanzi-practice__subtab${subtab === 'writing' ? ' hanzi-practice__subtab--active' : ''}`}
        type="button"
        onClick={() => setSubtab('writing')}
      >
        {({ uz: 'Yozish', ru: 'Письмо', en: 'Writing' } as Record<string, string>)[lang]}
      </button>
      <button
        className={`hanzi-practice__subtab${subtab === 'chars' ? ' hanzi-practice__subtab--active' : ''}`}
        type="button"
        onClick={() => setSubtab('chars')}
      >
        {({ uz: 'Ierogliflar', ru: 'Иероглифы', en: 'Characters' } as Record<string, string>)[lang]}
      </button>
    </div>
  );

  // --- IEROGLIFLAR TAB ---
  if (subtab === 'chars') {
    return (
      <div className="hanzi-practice">
        {subtabBar}
        <div style={{ padding: '14px 10px 28px', maxWidth: 520, margin: '0 auto' }}>
          {/* Card 1: character list */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, border: '1px solid #e0e0e6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 2, color: '#dc2626', fontWeight: 700, marginBottom: 10 }}>
              {({ uz: 'BARCHA IEROGLIFLAR', ru: 'ВСЕ ИЕРОГЛИФЫ', en: 'ALL CHARACTERS' } as Record<string, string>)[lang]}
            </div>
            {activeWords.map((w) => (
              <div key={w.char} style={{ background: '#f5f5f8', borderRadius: 8, marginBottom: 5, overflow: 'hidden', borderLeft: '3px solid #fca5a5' }}>
                <div onClick={() => setExpandedChar(expandedChar === w.char ? null : w.char)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 32, color: '#1a1a2e', fontWeight: 300, minWidth: 44, textAlign: 'center' as const }}>{w.char}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{w.pinyin}</span>
                      <span style={{ fontSize: 12, color: '#888' }}>{lang === 'ru' ? w.ru : lang === 'en' ? w.en : w.uz}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: '#dc2626', background: '#fee2e2', borderRadius: 4, padding: '1px 6px' }}>{w.strokes} {({ uz: 'chiziq', ru: 'черт', en: 'strokes' } as Record<string, string>)[lang]}</span>
                      {w.radical && <span style={{ fontSize: 10, color: '#555', background: '#f0f0f3', borderRadius: 4, padding: '1px 6px' }}>{({ uz: 'kalit', ru: 'ключ', en: 'radical' } as Record<string, string>)[lang]}: {w.radical} ({lang === 'ru' ? w.radicalRu : lang === 'en' ? w.radicalEn : w.radicalUz})</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, color: '#ccc', fontWeight: 300, transition: 'transform 0.2s', display: 'inline-block', transform: expandedChar === w.char ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                </div>
                {expandedChar === w.char && (
                  <div style={{ padding: '0 12px 12px 12px' }}>
                    <div style={{ background: '#fff', borderRadius: 8, padding: 10, borderLeft: '3px solid #dc2626' }}>
                      <div style={{ fontSize: 16, color: '#1a1a2e' }}>{w.ex}</div>
                      <div style={{ fontSize: 11, color: '#dc2626' }}>{w.expy}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{lang === 'ru' ? w.exru : lang === 'en' ? w.exen : w.exuz}</div>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSubtab('writing'); handleStart(); }} style={{ marginTop: 8, width: '100%', padding: 8, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✎ {({ uz: 'Yozishni mashq qilish', ru: 'Практиковать написание', en: 'Practice writing' } as Record<string, string>)[lang]}
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center' as const, marginTop: 4 }}>▾ {({ uz: "bosing — misol ko'rinadi", ru: 'нажмите — покажет пример', en: 'tap to see example' } as Record<string, string>)[lang]}</div>
          </div>

          {/* Card 2: stroke types */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, border: '1px solid #e0e0e6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 2, color: '#dc2626', fontWeight: 700, marginBottom: 10 }}>
              {({ uz: 'CHIZIQ TURLARI', ru: 'ТИПЫ ЧЕРТ', en: 'STROKE TYPES' } as Record<string, string>)[lang]}
            </div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8, marginBottom: 8 }}>
              {({ uz: 'Xitoy ierogliflari bir nechta asosiy chiziq turlaridan tashkil topgan:', ru: 'Китайские иероглифы состоят из нескольких основных типов черт:', en: 'Chinese characters are made up of several basic stroke types:' } as Record<string, string>)[lang]}
            </div>
            {[
              { name: '横 héng', uz: 'gorizontal', ru: 'горизонталь', en: 'horizontal', icon: '一', desc: { uz: "Chapdan o'ngga", ru: 'Слева направо', en: 'Left to right' } },
              { name: '竖 shù', uz: 'vertikal', ru: 'вертикаль', en: 'vertical', icon: '丨', desc: { uz: 'Yuqoridan pastga', ru: 'Сверху вниз', en: 'Top to bottom' } },
              { name: '撇 piě', uz: 'chap pastga', ru: 'влево вниз', en: 'left-falling', icon: '丿', desc: { uz: "O'ngdan chapga pastga", ru: 'Справа налево вниз', en: 'Right to left down' } },
              { name: '捺 nà', uz: "o'ng pastga", ru: 'вправо вниз', en: 'right-falling', icon: '㇏', desc: { uz: "Chapdan o'ngga pastga", ru: 'Слева направо вниз', en: 'Left to right down' } },
              { name: '点 diǎn', uz: 'nuqta', ru: 'точка', en: 'dot', icon: '丶', desc: { uz: 'Qisqa bosish', ru: 'Короткое нажатие', en: 'Short press' } },
              { name: '折 zhé', uz: 'burilish', ru: 'поворот', en: 'turning', icon: '𠃍', desc: { uz: "Yo'nalish o'zgarishi", ru: 'Смена направления', en: 'Change of direction' } },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 5 ? '1px solid #f5f5f8' : 'none' }}>
                <span style={{ fontSize: 24, color: '#1a1a2e', minWidth: 32, textAlign: 'center' as const }}>{s.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{({ uz: s.uz, ru: s.ru, en: s.en } as Record<string, string>)[lang]}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#999' }}>{(s.desc as Record<string, string>)[lang]}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, background: '#fef3c7', borderRadius: 8, padding: 10, borderLeft: '3px solid #f59e0b', fontSize: 11, lineHeight: 1.6 as const, color: '#555' }}>
              💡 {({ uz: "Chiziq tartibi qoidasi: yuqoridan pastga, chapdan o'ngga, tashqaridan ichkariga.", ru: 'Правило порядка черт: сверху вниз, слева направо, снаружи внутрь.', en: 'Stroke order rule: top to bottom, left to right, outside to inside.' } as Record<string, string>)[lang]}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- HOME VIEW ---
  if (view === 'home') {
    return (
      <div className="hanzi-practice">
        {subtabBar}
        <div className="hanzi-home">
          {onBack && (
            <button className="hanzi-home__back-btn" type="button" onClick={onBack}>
              ‹ {({ uz: 'Orqaga', ru: 'Назад', en: 'Back' } as Record<string, string>)[lang]}
            </button>
          )}
          <div className="hanzi-home__stats-row">
            <div className="hanzi-home__stat-card">
              <div className="hanzi-home__stat-value">{activeWords.length}</div>
              <div className="hanzi-home__stat-label">
                {({ uz: 'Jami belgilar', ru: 'Всего иероглифов', en: 'Total characters' } as Record<string, string>)[lang]}
              </div>
            </div>
          </div>

          <button className="hanzi-home__start-btn" type="button" onClick={handleStart}>
            {({ uz: `Boshlash (${activeWords.length})`, ru: `Начать (${activeWords.length})`, en: `Start (${activeWords.length})` } as Record<string, string>)[lang]}
          </button>
        </div>
      </div>
    );
  }

  // --- DONE VIEW ---
  if (view === 'done') {
    return (
      <div className="hanzi-done">
        <div className="hanzi-done__title">
          {({ uz: 'Barakalla! 🎉', ru: 'Отлично! 🎉', en: 'Well done! 🎉' } as Record<string, string>)[lang]}
        </div>
        <div className="hanzi-done__stats">
          {({ uz: `Takrorlandi: ${sessionQueue.length} belgi`, ru: `Повторено: ${sessionQueue.length} иероглифов`, en: `Reviewed: ${sessionQueue.length} characters` } as Record<string, string>)[lang]}
        </div>
        <div className="hanzi-done__buttons">
          <button
            className="hanzi-done__restart-btn"
            type="button"
            onClick={handleRestart}
          >
            {({ uz: 'Yana takrorlash', ru: 'Ещё раз', en: 'Restart' } as Record<string, string>)[lang]}
          </button>
          <button
            className="hanzi-done__back-btn"
            type="button"
            onClick={() => { if (onBack) onBack(); else setView('home'); }}
          >
            {({ uz: 'Bosh menuga qaytish', ru: 'В главное меню', en: 'Back to menu' } as Record<string, string>)[lang]}
          </button>
        </div>
      </div>
    );
  }

  // --- PRACTICE VIEW ---
  return (
    <div className="hanzi-practice">
      {subtabBar}

      <div className="hanzi-practice__layout">
        {/* Left: info + canvas */}
        <div className="hanzi-practice__canvas-panel">
          {currentWord && (
            <div className="hanzi-practice__info-panel" style={hiddenMode ? { visibility: 'hidden' } : undefined}>
              <div className="hanzi-practice__word-display">
                {isMultiChar ? wordChars.map((c, i) => (
                  <span
                    key={i}
                    className={`hanzi-practice__word-char${i === charIndex ? ' hanzi-practice__word-char--active' : i < charIndex ? ' hanzi-practice__word-char--done' : ''}`}
                  >
                    {c}
                  </span>
                )) : (
                  <span className="hanzi-practice__word-char hanzi-practice__word-char--active">{currentWord.char}</span>
                )}
              </div>
              <div className="hanzi-practice__pinyin">({currentWord.pinyin})</div>
              <div className="hanzi-practice__meaning">
                {lang === 'ru' ? currentWord.ru : lang === 'en' ? currentWord.en : currentWord.uz}
              </div>
              {isMultiChar && (
                <div className="hanzi-practice__char-progress">
                  {wordChars.map((_, i) => (
                    <span
                      key={i}
                      className={`hanzi-practice__char-dot${i === charIndex ? ' hanzi-practice__char-dot--active' : i < charIndex ? ' hanzi-practice__char-dot--done' : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="hanzi-practice__grid-wrapper">
            {currentWord && (
              <HanziCanvas
                key={`${currentChar}-${charIndex}-${resetKey}`}
                char={currentChar}
                lang={lang}
                revealAll={showAnswer}
                hidden={hiddenMode}
                onComplete={() => { if (currentWord) playWordAudio(currentWord); }}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="hanzi-practice__action-btn" type="button" onClick={() => { if (currentWord) playWordAudio(currentWord); }}>
              🔊
            </button>
            <button ref={eraseBtnRef} className="hanzi-practice__action-btn" type="button" onClick={() => keepScroll(handleErase)}>
              {({ uz: 'O\'chirish', ru: 'Стереть', en: 'Erase' } as Record<string, string>)[lang]}
            </button>
            <button ref={showBtnRef} className="hanzi-practice__action-btn" type="button" onClick={() => keepScroll(handleShow)}>
              {({ uz: 'Ko\'rsatish', ru: 'Показать', en: 'Show' } as Record<string, string>)[lang]}
            </button>
            <button
              ref={hideBtnRef}
              className={`hanzi-practice__action-btn${hiddenMode ? ' hanzi-practice__action-btn--active' : ''}`}
              type="button"
              onClick={() => keepScroll(() => {
                setHiddenMode((h) => !h);
                setResetKey((k) => k + 1);
                setShowAnswer(0);
              })}
            >
              {({ uz: 'Yashirish', ru: 'Скрыть', en: 'Hide' } as Record<string, string>)[lang]}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
            <button
              className="hanzi-practice__nav-btn"
              type="button"
              disabled={sessionIndex === 0 && charIndex === 0}
              onClick={() => keepScroll(() => {
                setShowAnswer(0);
                if (charIndex > 0) {
                  // Previous character within same multi-char word — no audio
                  setCharIndex((i) => i - 1);
                } else if (sessionIndex > 0) {
                  const prevWord = sessionQueue[sessionIndex - 1];
                  setCharIndex([...prevWord.char].length - 1);
                  setSessionIndex((i) => i - 1);
                  setTimeout(() => playWordAudio(prevWord), 200);
                }
              })}
            >
              ← {({ uz: 'Oldingi', ru: 'Назад', en: 'Back' } as Record<string, string>)[lang]}
            </button>
            <span className="hanzi-practice__session-progress" style={{ margin: 0, whiteSpace: 'nowrap' }}>
              {sessionIndex + 1} / {sessionQueue.length}
            </span>
            <button
              className="hanzi-practice__nav-btn hanzi-practice__nav-btn--next"
              type="button"
              onClick={() => keepScroll(advance)}
            >
              {({ uz: 'Keyingi', ru: 'Далее', en: 'Next' } as Record<string, string>)[lang]} →
            </button>
          </div>
        </div>
      </div>
      <CoachMarkTour
        tourId="writing-tour"
        lang={lang}
        steps={[
          { tipId: 'writing-erase', targetRef: eraseBtnRef, text: { uz: "O'chirib qaytadan yozish", ru: "Стереть и написать заново", en: "Erase and rewrite" } },
          { tipId: 'writing-show', targetRef: showBtnRef, text: { uz: "Ko'rsatmalar bilan yozish", ru: "Писать с подсказками", en: "Write with hints" } },
          { tipId: 'writing-hide', targetRef: hideBtnRef, text: { uz: "Ieroglifni yashirib xotiradan yozish", ru: "Скрыть иероглиф написать по памяти", en: "Hide the character and write from memory" } },
        ] as TourStep[]}
      />
    </div>
  );
}
