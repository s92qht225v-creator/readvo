'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HanziCanvas } from './HanziCanvas';

export type HanziWord = {
  char: string; pinyin: string; uz: string; ru: string; strokes: number;
  radical?: string; radicalUz?: string; radicalRu?: string;
  ex?: string; expy?: string; exuz?: string; exru?: string;
};

interface Props {
  lang: 'uz' | 'ru';
  words?: HanziWord[];
  onBack?: () => void;
  autoStart?: boolean;
  hideSubtabs?: boolean;
  subtab?: 'writing' | 'chars';
  onSubtabChange?: (tab: 'writing' | 'chars') => void;
}

const WORDS: HanziWord[] = [
  { char: '我', pinyin: 'wǒ', uz: 'men', ru: 'я', strokes: 7, radical: '戈', radicalUz: 'nayza', radicalRu: 'копьё', ex: '我是学生。', expy: 'Wǒ shì xuéshēng.', exuz: 'Men talabaman.', exru: 'Я студент.' },
  { char: '你', pinyin: 'nǐ', uz: 'sen', ru: 'ты', strokes: 6, radical: '人', radicalUz: 'odam', radicalRu: 'человек', ex: '你好！', expy: 'Nǐ hǎo!', exuz: 'Salom!', exru: 'Привет!' },
  { char: '他', pinyin: 'tā', uz: 'u (erkak)', ru: 'он', strokes: 5, radical: '人', radicalUz: 'odam', radicalRu: 'человек', ex: '他是老师。', expy: 'Tā shì lǎoshī.', exuz: "U o'qituvchi.", exru: 'Он учитель.' },
  { char: '她', pinyin: 'tā', uz: 'u (ayol)', ru: 'она', strokes: 6, radical: '女', radicalUz: 'ayol', radicalRu: 'женщина', ex: '她很漂亮。', expy: 'Tā hěn piàoliang.', exuz: 'U juda chiroyli.', exru: 'Она очень красивая.' },
  { char: '们', pinyin: 'men', uz: "ko'plik qo'shimchasi", ru: 'суффикс множества', strokes: 5, radical: '人', radicalUz: 'odam', radicalRu: 'человек', ex: '我们是朋友。', expy: 'Wǒmen shì péngyou.', exuz: 'Biz do\'stmiz.', exru: 'Мы друзья.' },
  { char: '吃', pinyin: 'chī', uz: 'yemoq', ru: 'есть', strokes: 6, radical: '口', radicalUz: 'og\'iz', radicalRu: 'рот', ex: '我吃饭。', expy: 'Wǒ chī fàn.', exuz: 'Men ovqat yeyapman.', exru: 'Я ем.' },
  { char: '喝', pinyin: 'hē', uz: 'ichmoq', ru: 'пить', strokes: 12, radical: '口', radicalUz: 'og\'iz', radicalRu: 'рот', ex: '我喝水。', expy: 'Wǒ hē shuǐ.', exuz: 'Men suv ichyapman.', exru: 'Я пью воду.' },
  { char: '看', pinyin: 'kàn', uz: "ko'rmoq", ru: 'смотреть', strokes: 9, radical: '目', radicalUz: 'ko\'z', radicalRu: 'глаз', ex: '我看书。', expy: 'Wǒ kàn shū.', exuz: 'Men kitob o\'qiyapman.', exru: 'Я читаю книгу.' },
  { char: '听', pinyin: 'tīng', uz: 'tinglаmoq', ru: 'слушать', strokes: 7, radical: '口', radicalUz: 'og\'iz', radicalRu: 'рот', ex: '我听音乐。', expy: 'Wǒ tīng yīnyuè.', exuz: 'Men musiqa tinglayapman.', exru: 'Я слушаю музыку.' },
  { char: '说', pinyin: 'shuō', uz: 'gapirmoq', ru: 'говорить', strokes: 9, radical: '讠', radicalUz: 'nutq', radicalRu: 'речь', ex: '他说中文。', expy: 'Tā shuō Zhōngwén.', exuz: 'U xitoy tilida gapiradi.', exru: 'Он говорит по-китайски.' },
  { char: '走', pinyin: 'zǒu', uz: 'yurmoq', ru: 'идти', strokes: 7, radical: '走', radicalUz: 'yurish', radicalRu: 'ходьба', ex: '我走路。', expy: 'Wǒ zǒu lù.', exuz: 'Men piyoda yuraman.', exru: 'Я иду пешком.' },
  { char: '来', pinyin: 'lái', uz: 'kelmoq', ru: 'приходить', strokes: 7, radical: '木', radicalUz: 'daraxt', radicalRu: 'дерево', ex: '他来了。', expy: 'Tā lái le.', exuz: 'U keldi.', exru: 'Он пришёл.' },
  { char: '去', pinyin: 'qù', uz: 'ketmoq', ru: 'уходить', strokes: 5, radical: '厶', radicalUz: 'xususiy', radicalRu: 'личный', ex: '我去学校。', expy: 'Wǒ qù xuéxiào.', exuz: 'Men maktabga ketyapman.', exru: 'Я иду в школу.' },
  { char: '大', pinyin: 'dà', uz: 'katta', ru: 'большой', strokes: 3, radical: '大', radicalUz: 'katta', radicalRu: 'большой', ex: '这个很大。', expy: 'Zhège hěn dà.', exuz: 'Bu juda katta.', exru: 'Это очень большое.' },
  { char: '小', pinyin: 'xiǎo', uz: 'kichik', ru: 'маленький', strokes: 3, radical: '小', radicalUz: 'kichik', radicalRu: 'маленький', ex: '那个很小。', expy: 'Nàge hěn xiǎo.', exuz: 'U juda kichik.', exru: 'То очень маленькое.' },
  { char: '好', pinyin: 'hǎo', uz: 'yaxshi', ru: 'хороший', strokes: 6, radical: '女', radicalUz: 'ayol', radicalRu: 'женщина', ex: '你好！', expy: 'Nǐ hǎo!', exuz: 'Salom!', exru: 'Привет!' },
  { char: '是', pinyin: 'shì', uz: "bo'lmoq", ru: 'быть', strokes: 9, radical: '日', radicalUz: 'quyosh', radicalRu: 'солнце', ex: '他是老师。', expy: 'Tā shì lǎoshī.', exuz: "U o'qituvchi.", exru: 'Он учитель.' },
  { char: '有', pinyin: 'yǒu', uz: "bor (ega bo'lmoq)", ru: 'иметь', strokes: 6, radical: '月', radicalUz: 'oy', radicalRu: 'луна', ex: '我有一本书。', expy: 'Wǒ yǒu yì běn shū.', exuz: 'Mening bitta kitobim bor.', exru: 'У меня есть книга.' },
  { char: '人', pinyin: 'rén', uz: 'odam', ru: 'человек', strokes: 2, radical: '人', radicalUz: 'odam', radicalRu: 'человек', ex: '他是好人。', expy: 'Tā shì hǎo rén.', exuz: 'U yaxshi odam.', exru: 'Он хороший человек.' },
  { char: '中', pinyin: 'zhōng', uz: "o'rta / Xitoy", ru: 'середина / Китай', strokes: 4, radical: '丨', radicalUz: 'chiziq', radicalRu: 'черта', ex: '我是中国人。', expy: 'Wǒ shì Zhōngguó rén.', exuz: 'Men xitoylikman.', exru: 'Я китаец.' },
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
  const [view, setView] = useState<View>('home');
  const [subtabInternal, setSubtabInternal] = useState<'writing' | 'chars'>('writing');
  const subtab = subtabProp ?? subtabInternal;
  const setSubtab = onSubtabChange ?? setSubtabInternal;
  const [expandedChar, setExpandedChar] = useState<string | null>(null);

  const [sessionQueue, setSessionQueue] = useState<HanziWord[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showAnswer, setShowAnswer] = useState(0);
  const [hiddenMode, setHiddenMode] = useState(false);

  // Auto-start: skip home screen and go directly to practice with all words
  useEffect(() => {
    if (!autoStart) return;
    setSessionQueue(activeWords);
    setSessionIndex(0);
    setView('practice');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = useCallback(() => {
    setSessionQueue(shuffle(activeWords));
    setSessionIndex(0);
    setView('practice');
  }, [activeWords]);

  const advance = useCallback(() => {
    setShowAnswer(0);
    if (sessionIndex + 1 >= sessionQueue.length) {
      setView('done');
    } else {
      setSessionIndex((i) => i + 1);
    }
  }, [sessionIndex, sessionQueue.length]);

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
    setSessionQueue(shuffle(sessionQueue));
    setSessionIndex(0);
    setShowAnswer(0);
    setResetKey(0);
    setHiddenMode(false);
    setView('practice');
  }, [sessionQueue]);

  const currentWord = sessionQueue[sessionIndex];

  const subtabBar = hideSubtabs ? null : (
    <div className="hanzi-practice__subtabs">
      <button
        className={`hanzi-practice__subtab${subtab === 'writing' ? ' hanzi-practice__subtab--active' : ''}`}
        type="button"
        onClick={() => setSubtab('writing')}
      >
        {lang === 'ru' ? 'Письмо' : 'Yozish'}
      </button>
      <button
        className={`hanzi-practice__subtab${subtab === 'chars' ? ' hanzi-practice__subtab--active' : ''}`}
        type="button"
        onClick={() => setSubtab('chars')}
      >
        {lang === 'ru' ? 'Иероглифы' : 'Hierogliflar'}
      </button>
    </div>
  );

  // --- HIEROGLIFLAR TAB ---
  if (subtab === 'chars') {
    return (
      <div className="hanzi-practice">
        {subtabBar}
        <div style={{ padding: '14px 10px 28px', maxWidth: 520, margin: '0 auto' }}>
          {/* Card 1: character list */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, border: '1px solid #e0e0e6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 2, color: '#dc2626', fontWeight: 700, marginBottom: 10 }}>
              {lang === 'ru' ? 'ВСЕ ИЕРОГЛИФЫ' : 'BARCHA HIEROGLIFLAR'}
            </div>
            {activeWords.map((w) => (
              <div key={w.char} style={{ background: '#f5f5f8', borderRadius: 8, marginBottom: 5, overflow: 'hidden', borderLeft: '3px solid #fca5a5' }}>
                <div onClick={() => setExpandedChar(expandedChar === w.char ? null : w.char)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 32, color: '#1a1a2e', fontWeight: 300, minWidth: 44, textAlign: 'center' as const }}>{w.char}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{w.pinyin}</span>
                      <span style={{ fontSize: 12, color: '#888' }}>{lang === 'ru' ? w.ru : w.uz}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: '#dc2626', background: '#fee2e2', borderRadius: 4, padding: '1px 6px' }}>{w.strokes} {lang === 'ru' ? 'черт' : 'chiziq'}</span>
                      {w.radical && <span style={{ fontSize: 10, color: '#555', background: '#f0f0f3', borderRadius: 4, padding: '1px 6px' }}>{lang === 'ru' ? 'ключ' : 'kalit'}: {w.radical} ({lang === 'ru' ? w.radicalRu : w.radicalUz})</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, color: '#ccc', fontWeight: 300, transition: 'transform 0.2s', display: 'inline-block', transform: expandedChar === w.char ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                </div>
                {expandedChar === w.char && (
                  <div style={{ padding: '0 12px 12px 12px' }}>
                    <div style={{ background: '#fff', borderRadius: 8, padding: 10, borderLeft: '3px solid #dc2626' }}>
                      <div style={{ fontSize: 16, color: '#1a1a2e' }}>{w.ex}</div>
                      <div style={{ fontSize: 11, color: '#dc2626' }}>{w.expy}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{lang === 'ru' ? w.exru : w.exuz}</div>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSubtab('writing'); handleStart(); }} style={{ marginTop: 8, width: '100%', padding: 8, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ✎ {lang === 'ru' ? 'Практиковать написание' : 'Yozishni mashq qilish'}
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center' as const, marginTop: 4 }}>▾ {lang === 'ru' ? 'нажмите — покажет пример' : "bosing — misol ko'rinadi"}</div>
          </div>

          {/* Card 2: stroke types */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, border: '1px solid #e0e0e6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 2, color: '#dc2626', fontWeight: 700, marginBottom: 10 }}>
              {lang === 'ru' ? 'ТИПЫ ЧЕРТ' : 'CHIZIQ TURLARI'}
            </div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8, marginBottom: 8 }}>
              {lang === 'ru' ? 'Китайские иероглифы состоят из нескольких основных типов черт:' : 'Xitoy hierogliflari bir nechta asosiy chiziq turlaridan tashkil topgan:'}
            </div>
            {[
              { name: '横 héng', uz: 'gorizontal', ru: 'горизонталь', icon: '一', desc: lang === 'ru' ? 'Слева направо' : "Chapdan o'ngga" },
              { name: '竖 shù', uz: 'vertikal', ru: 'вертикаль', icon: '丨', desc: lang === 'ru' ? 'Сверху вниз' : 'Yuqoridan pastga' },
              { name: '撇 piě', uz: 'chap pastga', ru: 'влево вниз', icon: '丿', desc: lang === 'ru' ? 'Справа налево вниз' : "O'ngdan chapga pastga" },
              { name: '捺 nà', uz: "o'ng pastga", ru: 'вправо вниз', icon: '㇏', desc: lang === 'ru' ? 'Слева направо вниз' : "Chapdan o'ngga pastga" },
              { name: '点 diǎn', uz: 'nuqta', ru: 'точка', icon: '丶', desc: lang === 'ru' ? 'Короткое нажатие' : 'Qisqa bosish' },
              { name: '折 zhé', uz: 'burilish', ru: 'поворот', icon: '𠃍', desc: lang === 'ru' ? 'Смена направления' : "Yo'nalish o'zgarishi" },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 5 ? '1px solid #f5f5f8' : 'none' }}>
                <span style={{ fontSize: 24, color: '#1a1a2e', minWidth: 32, textAlign: 'center' as const }}>{s.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{lang === 'ru' ? s.ru : s.uz}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#999' }}>{s.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, background: '#fef3c7', borderRadius: 8, padding: 10, borderLeft: '3px solid #f59e0b', fontSize: 11, lineHeight: 1.6 as const, color: '#555' }}>
              💡 {lang === 'ru' ? 'Правило порядка черт: сверху вниз, слева направо, снаружи внутрь.' : "Chiziq tartibi qoidasi: yuqoridan pastga, chapdan o'ngga, tashqaridan ichkariga."}
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
              ‹ {lang === 'ru' ? 'Назад' : 'Orqaga'}
            </button>
          )}
          <div className="hanzi-home__stats-row">
            <div className="hanzi-home__stat-card">
              <div className="hanzi-home__stat-value">{activeWords.length}</div>
              <div className="hanzi-home__stat-label">
                {lang === 'ru' ? 'Всего иероглифов' : "Jami belgilar"}
              </div>
            </div>
          </div>

          <button className="hanzi-home__start-btn" type="button" onClick={handleStart}>
            {lang === 'ru' ? `Начать (${activeWords.length})` : `Boshlash (${activeWords.length})`}
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
          {lang === 'ru' ? 'Отлично! 🎉' : 'Barakalla! 🎉'}
        </div>
        <div className="hanzi-done__stats">
          {lang === 'ru'
            ? `Повторено: ${sessionQueue.length} иероглифов`
            : `Takrorlandi: ${sessionQueue.length} belgi`}
        </div>
        <div className="hanzi-done__buttons">
          <button
            className="hanzi-done__restart-btn"
            type="button"
            onClick={handleRestart}
          >
            {lang === 'ru' ? 'Ещё раз' : 'Yana takrorlash'}
          </button>
          <button
            className="hanzi-done__back-btn"
            type="button"
            onClick={() => { if (onBack) onBack(); else setView('home'); }}
          >
            {lang === 'ru' ? 'В главное меню' : 'Bosh menuga qaytish'}
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
            <div className="hanzi-practice__info-panel">
              <div className="hanzi-practice__pinyin">{currentWord.pinyin}</div>
              <div className="hanzi-practice__meaning">
                {lang === 'ru' ? currentWord.ru : currentWord.uz}
              </div>
            </div>
          )}

          <div className="hanzi-practice__grid-wrapper">
            {currentWord && (
              <HanziCanvas
                key={`${currentWord.char}-${resetKey}`}
                char={currentWord.char}
                lang={lang}
                revealAll={showAnswer}
                hidden={hiddenMode}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="hanzi-practice__action-btn" type="button" onClick={() => keepScroll(handleErase)}>
              {lang === 'ru' ? 'Стереть' : 'O\'chirish'}
            </button>
            <button className="hanzi-practice__action-btn" type="button" onClick={() => keepScroll(handleShow)}>
              {lang === 'ru' ? 'Показать' : 'Ko\'rsatish'}
            </button>
            <button
              className={`hanzi-practice__action-btn${hiddenMode ? ' hanzi-practice__action-btn--active' : ''}`}
              type="button"
              onClick={() => keepScroll(() => {
                setHiddenMode((h) => !h);
                setResetKey((k) => k + 1);
                setShowAnswer(0);
              })}
            >
              {lang === 'ru' ? 'Скрыть' : 'Yashirish'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
            <button
              className="hanzi-practice__nav-btn"
              type="button"
              disabled={sessionIndex === 0}
              onClick={() => keepScroll(() => { setSessionIndex((i) => i - 1); setShowAnswer(0); })}
            >
              ← {lang === 'ru' ? 'Oldingi' : 'Oldingi'}
            </button>
            <span className="hanzi-practice__session-progress" style={{ margin: 0, whiteSpace: 'nowrap' }}>
              {sessionIndex + 1} / {sessionQueue.length}
            </span>
            <button
              className="hanzi-practice__nav-btn hanzi-practice__nav-btn--next"
              type="button"
              onClick={() => keepScroll(advance)}
            >
              {lang === 'ru' ? 'Keyingi' : 'Keyingi'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
