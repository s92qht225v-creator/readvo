'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useStars } from '../hooks/useStars';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { trackAll } from '@/utils/analytics';
import type { DialogueInfo } from '../services/dialogues';

const TAGS: Record<string, { uz: string; ru: string; en: string }> = {
  tanishuv: { uz: 'Tanishuv', ru: 'Знакомство', en: 'Introductions' },
  kundalik: { uz: 'Kundalik', ru: 'Повседневное', en: 'Daily Life' },
  xaridlar: { uz: 'Xaridlar', ru: 'Покупки', en: 'Shopping' },
  ovqat: { uz: 'Ovqat', ru: 'Еда', en: 'Food' },
  salomatlik: { uz: 'Salomatlik', ru: 'Здоровье', en: 'Health' },
  transport: { uz: 'Transport', ru: 'Транспорт', en: 'Transport' },
  telefon: { uz: 'Telefon', ru: 'Телефон', en: 'Phone' },
  ish: { uz: 'Ish/O\'qish', ru: 'Работа/Учёба', en: 'Work/Study' },
  reja: { uz: 'Reja', ru: 'Планы', en: 'Plans' },
  muloqot: { uz: 'Muloqot', ru: 'Общение', en: 'Communication' },
};

const BOOKMARK_KEY = 'blim-dialogue-bookmarks';

type Tab = 'dialogues' | 'writing' | 'flashcards' | 'karaoke' | 'grammar' | 'tests';

const tabs: { id: Tab; label: string; label_ru?: string; label_en?: string }[] = [
  { id: 'dialogues', label: 'Dialog', label_ru: 'Диалог', label_en: 'Dialogues' },
  { id: 'writing', label: 'Yozish', label_ru: 'Письмо', label_en: 'Writing' },
  { id: 'flashcards', label: 'Flesh', label_ru: 'Флеш', label_en: 'Flash' },
  { id: 'karaoke', label: 'KTV' },
  { id: 'grammar', label: 'Grammatika', label_ru: 'Грамматика', label_en: 'Grammar' },
  { id: 'tests', label: 'Test', label_ru: 'Тесты', label_en: 'Tests' },
];

const validTabs: Tab[] = ['dialogues', 'writing', 'flashcards', 'karaoke', 'grammar', 'tests'];

const grammarItems = [
  { char: '什么', pinyin: 'shénme', href: '/chinese/hsk1/grammar/shenme', translation: 'nima?', translation_ru: 'что?', translation_en: 'what?', color: '#dc2626', active: true },
  { char: '是', pinyin: 'shì', href: '/chinese/hsk1/grammar/shi', translation: 'bo\'lmoq', translation_ru: 'быть', translation_en: 'to be', color: '#dc2626', active: true },
  { char: '吗', pinyin: 'ma', href: '/chinese/hsk1/grammar/ma', translation: 'savol yuklamasi', translation_ru: 'вопросительная частица', translation_en: 'question particle', color: '#0891b2', active: true },
  { char: '谁', pinyin: 'shéi', href: '/chinese/hsk1/grammar/shei', translation: 'kim?', translation_ru: 'кто?', translation_en: 'who?', color: '#d97706', active: true },
  { char: '哪', pinyin: 'nǎ', href: '/chinese/hsk1/grammar/na', translation: 'qaysi?', translation_ru: 'который?', translation_en: 'which?', color: '#0284c7', active: true },
  { char: '的', pinyin: 'de', href: '/chinese/hsk1/grammar/de', translation: 'egalik belgisi', translation_ru: 'частица принадлежности', translation_en: 'possessive particle', color: '#be185d', active: true },
  { char: '呢', pinyin: 'ne', href: '/chinese/hsk1/grammar/ne', translation: '…chi?', translation_ru: '…а вы?', translation_en: '…and you?', color: '#7c3aed', active: true },
];

const karaokeItems = [
  { title: '月亮代表我的心', pinyin: 'Yuèliàng dàibiǎo wǒ de xīn', translation: 'Oy yuragimni ifodalaydi', translation_ru: 'Луна выражает моё сердце', translation_en: 'The Moon Represents My Heart', href: '/chinese/hsk1/karaoke/yueliang' },
  { title: '朋友', pinyin: 'Péngyou', translation: 'Do\'st', translation_ru: 'Друг', translation_en: 'Friend', href: '/chinese/hsk1/karaoke/pengyou' },
  { title: '童话', pinyin: 'Tónghuà', translation: 'Ertak', translation_ru: 'Сказка', translation_en: 'Fairy Tale', href: '/chinese/hsk1/karaoke/tonghua' },
  { title: '后来', pinyin: 'Hòulái', translation: 'Keyinroq', translation_ru: 'Потом', translation_en: 'Later', href: '/chinese/hsk1/karaoke/houlai' },
  { title: '老鼠爱大米', pinyin: 'Lǎoshǔ Ài Dàmǐ', translation: 'Sichqon guruchni sevadi', translation_ru: 'Мышка любит рис', translation_en: 'Mouse Loves Rice', href: '/chinese/hsk1/karaoke/laoshuaidami' },
  { title: '小苹果', pinyin: 'Xiǎo Píngguǒ', translation: 'Kichkina olma', translation_ru: 'Маленькое яблочко', translation_en: 'Little Apple', href: '/chinese/hsk1/karaoke/xiaopinguo' },
  { title: '世界这么大还是遇见你', pinyin: 'Shìjiè Zhème Dà Háishi Yùjiàn Nǐ', translation: 'Dunyo shuncha katta, baribir senga duch keldim', translation_ru: 'Мир так велик, но я встретил тебя', translation_en: 'The World Is So Big, Yet I Met You', href: '/chinese/hsk1/karaoke/shijiezhemeda' },
  { title: '我的歌声里', pinyin: 'Wǒ De Gēshēng Lǐ', translation: "Mening qo'shig'imda", translation_ru: 'В моей песне', translation_en: 'In My Song', href: '/chinese/hsk1/karaoke/wodeshengli' },
];


const FLASHCARD_MODE_KEY = 'blim-flashcard-mode';

const TOPIC_ITEMS = [
  { uz: 'Oila', ru: 'Семья', en: 'Family', icon: '👨‍👩‍👧', slug: 'family' },
  { uz: 'Tana a\'zolari', ru: 'Части тела', en: 'Body Parts', icon: '🫀', slug: 'body' },
  { uz: 'Oziq-ovqat', ru: 'Еда', en: 'Food', icon: '🍜', slug: 'food' },
  { uz: 'Hayvonlar', ru: 'Животные', en: 'Animals', icon: '🐼', slug: 'animals' },
  { uz: 'Ranglar', ru: 'Цвета', en: 'Colors', icon: '🎨', slug: 'colors' },
  { uz: 'Sonlar', ru: 'Числа', en: 'Numbers', icon: '🔢', slug: 'numbers' },
  { uz: 'Vaqt', ru: 'Время', en: 'Time', icon: '⏰', slug: 'time' },
  { uz: 'Kasblar', ru: 'Профессии', en: 'Professions', icon: '👩‍🏫', slug: 'professions' },
  { uz: 'Ofis jihozlari', ru: 'Офис. оборудование', en: 'Office Equipment', icon: '🖨️', slug: 'office' },
  { uz: 'Ofis harakatlari', ru: 'Офисные действия', en: 'Office Actions', icon: '📋', slug: 'office-actions' },
  { uz: 'Biznes atamalar', ru: 'Бизнес-термины', en: 'Business Terms', icon: '💼', slug: 'business' },
  { uz: 'Ofis lavozimlari', ru: 'Должности', en: 'Workplace Roles', icon: '👔', slug: 'workplace-roles' },
  { uz: 'Ish-yozuv anjomlari', ru: 'Канцтовары', en: 'Stationery', icon: '✏️', slug: 'stationery' },
  { uz: 'Ofis xonalari', ru: 'Офис. помещения', en: 'Office Spaces', icon: '🏢', slug: 'office-spaces' },
  { uz: 'Savdo atamalar', ru: 'Торговля', en: 'Trade', icon: '🤝', slug: 'trade' },
  { uz: "Narx va to'lov", ru: 'Цены и оплата', en: 'Pricing & Payment', icon: '💰', slug: 'pricing' },
  { uz: 'Shartnoma atamalar', ru: 'Договоры', en: 'Contracts', icon: '📝', slug: 'contracts' },
  { uz: 'Buyurtma va ishlab chiqarish', ru: 'Заказы и произв.', en: 'Orders & Production', icon: '📦', slug: 'orders' },
  { uz: 'Logistika', ru: 'Логистика', en: 'Logistics', icon: '🚚', slug: 'logistics' },
  { uz: 'Mehmonxona', ru: 'Гостиница', en: 'Hotel', icon: '🏨', slug: 'hotel' },
  { uz: 'Hujjatlar', ru: 'Документы', en: 'Documents', icon: '🪪', slug: 'documents' },
  { uz: 'Transport turlari', ru: 'Виды транспорта', en: 'Transportation', icon: '✈️', slug: 'transportation' },
  { uz: 'Avtomobil turlari', ru: 'Виды автомобилей', en: 'Vehicle Types', icon: '🚗', slug: 'vehicles' },
  { uz: 'Mashina tashqi qismlari', ru: 'Наруж. части авто', en: 'Car Exterior', icon: '🚙', slug: 'car-exterior' },
  { uz: 'Dvigatel va mexanika', ru: 'Двигатель и мех.', en: 'Engine & Mechanics', icon: '⚙️', slug: 'car-engine' },
  { uz: 'Mashina ichki qismlari', ru: 'Салон авто', en: 'Car Interior', icon: '🪑', slug: 'car-interior' },
  { uz: "Yo'nalishlar", ru: 'Направления', en: 'Directions', icon: '🧭', slug: 'directions' },
  { uz: "His-tuyg'ular", ru: 'Эмоции', en: 'Emotions', icon: '😊', slug: 'emotions' },
];

function FlashcardModeBar({ flashcardMode, setFlashcardMode }: { flashcardMode: string; setFlashcardMode: (m: string) => void }) {
  const [language] = useLanguage();
  const modes = [
    { id: 'zh-uz', label: ({ uz: "汉字 → O'zbekcha", ru: "汉字 → Русский", en: "汉字 → English" } as Record<string, string>)[language] },
    { id: 'uz-zh', label: ({ uz: "O'zbekcha → 汉字", ru: "Русский → 汉字", en: "English → 汉字" } as Record<string, string>)[language] },
  ];
  return (
    <div style={{ display: 'flex', background: '#f5f5f8', borderRadius: 10, overflow: 'hidden', marginBottom: 14, border: '1px solid #e0e0e6' }}>
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => {
            setFlashcardMode(m.id);
            localStorage.setItem(FLASHCARD_MODE_KEY, m.id);
          }}
          style={{
            flex: 1, padding: '10px 8px', border: 'none',
            background: flashcardMode === m.id ? '#dc2626' : 'transparent',
            color: flashcardMode === m.id ? '#fff' : '#666',
            fontSize: 13, fontWeight: flashcardMode === m.id ? 600 : 400,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          type="button"
        >{m.label}</button>
      ))}
    </div>
  );
}

const FLASHCARD_MIX_KEY = 'blim-flashcard-mix';

function FlashcardUnitSelector({ lessons, onStart, onSingle }: {
  lessons: { lessonId: string; lessonNumber: number; wordCount: number; title?: string; title_ru?: string }[];
  onStart: (selectedIds: string[]) => void;
  onSingle: (lessonNumber: number) => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [selectMode, setSelectMode] = React.useState(false);
  const [language] = useLanguage();
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = React.useRef(false);
  const tapped = React.useRef(false);

  const toggle = (id: string) => setSelected((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );

  const totalWords = selected.reduce((sum, id) => {
    return sum + (lessons.find((l) => l.lessonId === id)?.wordCount ?? 0);
  }, 0);

  const allSelected = selected.length === lessons.length;

  const cancelSelect = () => {
    setSelectMode(false);
    setSelected([]);
  };

  const handlePointerDown = (l: typeof lessons[0]) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setSelectMode(true);
      setSelected((prev) => prev.includes(l.lessonId) ? prev : [...prev, l.lessonId]);
    }, 400);
  };

  const handlePointerUp = (l: typeof lessons[0]) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (longPressTriggered.current) return;
    tapped.current = true;
    if (selectMode) {
      toggle(l.lessonId);
    } else {
      onSingle(l.lessonNumber);
    }
  };

  const handleClick = (l: typeof lessons[0]) => {
    if (tapped.current) { tapped.current = false; return; }
    if (longPressTriggered.current) return;
    if (selectMode) {
      toggle(l.lessonId);
    } else {
      onSingle(l.lessonNumber);
    }
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#dc2626', fontWeight: 700, marginBottom: 10 }}>
        {selectMode
          ? ({ uz: 'Darslarni tanlang', ru: 'Выберите уроки', en: 'Select lessons' } as Record<string, string>)[language]
          : ({ uz: 'Darsni bosing — mashq boshlang', ru: 'Нажмите на урок — начните практику', en: 'Tap a lesson to start practice' } as Record<string, string>)[language]
        }
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {lessons.map((l) => {
          const sel = selectMode && selected.includes(l.lessonId);
          return (
            <div
              key={l.lessonId}
              onPointerDown={() => handlePointerDown(l)}
              onPointerUp={() => handlePointerUp(l)}
              onPointerLeave={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
              onPointerCancel={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
              onClick={() => handleClick(l)}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#fff',
                border: sel ? '2px solid #dc2626' : '2px solid transparent',
                borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                userSelect: 'none', WebkitUserSelect: 'none',
              }}
            >
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#fff',
                background: '#dc2626', borderRadius: 8,
                minWidth: 28, height: 28, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}>{sel ? '✓' : l.lessonNumber}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{l.title ?? `第${l.lessonNumber}课`}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{l.wordCount} {({ uz: "so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language]}</div>
              </div>
            </div>
          );
        })}
      </div>
      {selectMode && (
        <>
          <div style={{ textAlign: 'center', marginTop: 10, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button
              onClick={() => setSelected(allSelected ? [] : lessons.map((l) => l.lessonId))}
              style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
              type="button"
            >
              {({ uz: allSelected ? 'Barchasini bekor qilish' : 'Barchasini tanlash', ru: allSelected ? 'Снять все' : 'Выбрать все', en: allSelected ? 'Deselect all' : 'Select all' } as Record<string, string>)[language]}
            </button>
            <button
              onClick={cancelSelect}
              style={{ background: 'transparent', border: 'none', color: '#999', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
              type="button"
            >
              {({ uz: 'Bekor qilish', ru: 'Отмена', en: 'Cancel' } as Record<string, string>)[language]}
            </button>
          </div>
          <button
            onClick={() => { if (selected.length > 0) onStart(selected); }}
            disabled={selected.length === 0}
            style={{
              width: '100%', padding: 13, marginTop: 14,
              background: selected.length > 0 ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#e0e0e6',
              border: 'none', borderRadius: 10,
              color: selected.length > 0 ? '#fff' : '#999',
              fontSize: 15, fontWeight: 600,
              cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}
            type="button"
          >
            {({ uz: `Boshlash (${totalWords} so'z)`, ru: `Начать (${totalWords} слов)`, en: `Start (${totalWords} words)` } as Record<string, string>)[language]}
          </button>
        </>
      )}
    </div>
  );
}

interface FlashcardLesson {
  lessonId: string;
  lessonNumber: number;
  wordCount: number;
  title?: string;
  title_ru?: string;
  sampleChar?: string;
  sampleUz?: string;
  sampleRu?: string;
  sampleEn?: string;
}

interface WritingSetMeta {
  id: string;
  title: string;
  title_ru: string;
  subtitle: string;
  subtitle_ru: string;
  chars: string;
  wordCount?: number;
  sampleChar?: string;
  sampleUz?: string;
  sampleRu?: string;
  sampleEn?: string;
}

interface Props {
  dialogues: DialogueInfo[];
  flashcardLessons?: FlashcardLesson[];
  writingSets?: WritingSetMeta[];
  writingSetsHsk2?: WritingSetMeta[];
  writingSetsHsk2L2?: WritingSetMeta[];
  writingSetsHsk3?: WritingSetMeta[];
  writingSetsHsk4?: WritingSetMeta[];
  writingSetsHsk5?: WritingSetMeta[];
  writingSetsHsk6?: WritingSetMeta[];
}

export function LanguagePage({ dialogues, flashcardLessons = [], writingSets = [], writingSetsHsk2 = [], writingSetsHsk2L2 = [], writingSetsHsk3 = [], writingSetsHsk4 = [], writingSetsHsk5 = [], writingSetsHsk6 = [] }: Props) {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const { getStars: getGrammarStars } = useStars('grammar');
  const { getStars: getWritingStars } = useStars('writing');
  const { getStars: getDialogueStars } = useStars('dialogue');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab && validTabs.includes(initialTab) ? initialTab : 'dialogues'
  );

  // Dialogue filters
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  // Writing tab
  const initialVersion = searchParams.get('version') === '3.0' ? '3.0' : '2.0';
  const [hskVersion, setHskVersion] = useState<'3.0' | '2.0'>(initialVersion);
  const initialWritingHskLevel = searchParams.get('hsk') === '2' ? '2' : searchParams.get('hsk') === '3' ? '3' : searchParams.get('hsk') === '4' ? '4' : searchParams.get('hsk') === '5' ? '5' : searchParams.get('hsk') === '6' ? '6' : '1';
  const [writingHskLevel, setWritingHskLevel] = useState<'1' | '2' | '3' | '4' | '5' | '6'>(initialWritingHskLevel as '1' | '2' | '3' | '4' | '5' | '6');
  const [writingSearch, setWritingSearch] = useState('');
  const [karaokeSearch, setKaraokeSearch] = useState('');
  const [grammarSearch, setGrammarSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');

  // Flashcard mode
  const [flashcardMode, setFlashcardMode] = useState<string>('zh-uz');
  const initialSubTab = searchParams.get('subtab');
  const [flashcardSubTab, setFlashcardSubTab] = useState<'lessons' | 'topics'>(initialSubTab === 'topics' ? 'topics' : 'lessons');
  const initialFlashHsk = searchParams.get('flashhsk');
  const [flashcardHskLevel, setFlashcardHskLevel] = useState<'1' | '2' | '3'>(initialFlashHsk === '2' ? '2' : initialFlashHsk === '3' ? '3' : '1');

  // HSK dropdown
  const [hskDropdownOpen, setHskDropdownOpen] = useState(false);
  const hskDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hskDropdownOpen) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (hskDropdownRef.current && !hskDropdownRef.current.contains(e.target as Node)) {
        setHskDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [hskDropdownOpen]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_KEY);
      if (saved) setBookmarks(new Set(JSON.parse(saved)));
      const savedMode = localStorage.getItem(FLASHCARD_MODE_KEY);
      if (savedMode) setFlashcardMode(savedMode);
    } catch { /* ignore */ }
  }, []);

  const toggleBookmark = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    dialogues.forEach((d) => { if (d.tag) tagSet.add(d.tag); });
    return Object.keys(TAGS).filter((t) => tagSet.has(t));
  }, [dialogues]);

  // Meta Pixel: debounced search tracking
  useEffect(() => {
    const q = (search || topicSearch || writingSearch || grammarSearch).trim();
    if (!q) return;
    const t = setTimeout(() => trackAll('Search', 'search', 'search', { search_string: q }), 800);
    return () => clearTimeout(t);
  }, [search, topicSearch, writingSearch, grammarSearch]);

  const filteredDialogues = useMemo(() => {
    let result = dialogues;
    if (showBookmarked) result = result.filter((d) => bookmarks.has(d.id));
    if (activeTag) result = result.filter((d) => d.tag === activeTag);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.pinyin.toLowerCase().includes(q) ||
      d.titleTranslation.toLowerCase().includes(q)
    );
    return result;
  }, [search, dialogues, activeTag, showBookmarked, bookmarks]);

  if (isLoading) return <div className="loading-spinner" />;

  return (
    <main className="home">
      {/* Banner */}
      <header className="home__hero home__hero--lang">
        <div className="home__hero-inner">
          <span className="lp__hero-watermark" aria-hidden="true">中</span>
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <h1 className="sr-only">{({ uz: 'Xitoy tili — HSK 1 darslari, dialoglar va mashqlar', ru: 'Китайский язык — уроки HSK 1, диалоги и упражнения', en: 'Chinese — HSK 1 lessons, dialogues and exercises' } as Record<string, string>)[language]}</h1>
            <div className="dr-hero__level">HSK 1</div>
            <div className="dr-hero__title" aria-hidden="true">{
              activeTab === 'dialogues' ? '对话' :
              activeTab === 'writing' ? '写字' :
              activeTab === 'flashcards' ? '词卡' :
              activeTab === 'karaoke' ? '歌曲' :
              activeTab === 'grammar' ? '语法' :
              '测验'
            }</div>
            <div className="dr-hero__pinyin">{
              activeTab === 'dialogues' ? 'duìhuà' :
              activeTab === 'writing' ? 'xiězì' :
              activeTab === 'flashcards' ? 'cíkǎ' :
              activeTab === 'karaoke' ? 'gēqǔ' :
              activeTab === 'grammar' ? 'yǔfǎ' :
              'cèyàn'
            }</div>
            <div className="dr-hero__translation">— {({
              uz: activeTab === 'dialogues' ? 'Dialoglar' : activeTab === 'writing' ? 'Yozish' : activeTab === 'flashcards' ? 'Fleshkartalar' : activeTab === 'karaoke' ? 'Qo\'shiqlar' : activeTab === 'grammar' ? 'Grammatika' : 'Testlar',
              ru: activeTab === 'dialogues' ? 'Диалоги' : activeTab === 'writing' ? 'Письмо' : activeTab === 'flashcards' ? 'Флешкарты' : activeTab === 'karaoke' ? 'Песни' : activeTab === 'grammar' ? 'Грамматика' : 'Тесты',
              en: activeTab === 'dialogues' ? 'Dialogues' : activeTab === 'writing' ? 'Writing' : activeTab === 'flashcards' ? 'Flashcards' : activeTab === 'karaoke' ? 'Songs' : activeTab === 'grammar' ? 'Grammar' : 'Tests',
            } as Record<string, string>)[language]} —</div>
          </div>
        </div>
      </header>
      <nav className="lp__tabs">
        <div className="lp__tabs-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`lp__tab ${activeTab === tab.id ? 'lp__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {language === 'en' && tab.label_en ? tab.label_en : language === 'ru' && tab.label_ru ? tab.label_ru : tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* HSK version toggle (writing tab only) */}
      {activeTab === 'writing' && (
        <div className="lp__seg-bar">
          <div className="lp__hsk-version-bar">
            <button
              className={`lp__hsk-version-btn${hskVersion === '2.0' ? ' lp__hsk-version-btn--active' : ''}`}
              onClick={() => { setHskVersion('2.0'); }}
              type="button"
            >
              HSK 2.0
            </button>
            <button
              className={`lp__hsk-version-btn${hskVersion === '3.0' ? ' lp__hsk-version-btn--active' : ''}`}
              onClick={() => { setHskVersion('3.0'); setWritingHskLevel('1'); }}
              type="button"
            >
              HSK 3.0
            </button>
          </div>
        </div>
      )}

      {/* HSK level pills */}
      {activeTab !== 'karaoke' && (
        <div className={`lp__seg-bar${activeTab === 'flashcards' ? ' lp__seg-bar--col' : ''}`}>
          <div className={`lp__hsk-pills${(activeTab === 'writing' || activeTab === 'dialogues' || activeTab === 'grammar' || activeTab === 'flashcards') ? ' lp__hsk-pills--grid' : ''}`}>
            {(['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'] as const).map((lv) => {
              const hasContent = lv === 'HSK 1' || (activeTab === 'flashcards' && flashcardSubTab === 'lessons' && (lv === 'HSK 2' || lv === 'HSK 3')) || (activeTab === 'writing' && hskVersion === '2.0' && (lv === 'HSK 2' || lv === 'HSK 3' || lv === 'HSK 4' || lv === 'HSK 5' || lv === 'HSK 6'));
              const isActive = activeTab === 'flashcards'
                ? (flashcardSubTab === 'lessons' && ((lv === 'HSK 1' && flashcardHskLevel === '1') || (lv === 'HSK 2' && flashcardHskLevel === '2') || (lv === 'HSK 3' && flashcardHskLevel === '3')))
                : activeTab === 'writing' && hskVersion === '2.0'
                  ? (lv === 'HSK 1' && writingHskLevel === '1') || (lv === 'HSK 2' && writingHskLevel === '2') || (lv === 'HSK 3' && writingHskLevel === '3') || (lv === 'HSK 4' && writingHskLevel === '4') || (lv === 'HSK 5' && writingHskLevel === '5') || (lv === 'HSK 6' && writingHskLevel === '6')
                  : hasContent;
              return (
                <button
                  key={lv}
                  type="button"
                  disabled={!hasContent}
                  onClick={() => {
                    if (hasContent) {
                      if (activeTab === 'flashcards') {
                        setFlashcardSubTab('lessons');
                        setFlashcardHskLevel(lv === 'HSK 3' ? '3' : lv === 'HSK 2' ? '2' : '1');
                      }
                      if (activeTab === 'writing' && hskVersion === '2.0') {
                        setWritingHskLevel(lv === 'HSK 2' ? '2' : lv === 'HSK 3' ? '3' : lv === 'HSK 4' ? '4' : lv === 'HSK 5' ? '5' : lv === 'HSK 6' ? '6' : '1');
                      }
                    }
                  }}
                  className={`lp__hsk-pill ${isActive ? 'lp__hsk-pill--active' : ''} ${!hasContent ? 'lp__hsk-pill--disabled' : ''}`}
                >
                  {lv}
                </button>
              );
            })}
          </div>
          {activeTab === 'flashcards' && (
            <button
              type="button"
              onClick={() => setFlashcardSubTab('topics')}
              className={`lp__hsk-pill lp__hsk-pill--full ${flashcardSubTab === 'topics' ? 'lp__hsk-pill--active' : ''}`}
            >
              {({ uz: 'Mavzular', ru: 'Темы', en: 'Topics' } as Record<string, string>)[language]}
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <section className="home__content">

        {activeTab === 'dialogues' && (
          <>
            {/* Search */}
            <div className="dialogues__search">
              <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="dialogues__search-input"
                placeholder={({ uz: 'Dialoglarni qidirish...', ru: 'Поиск диалогов...', en: 'Search dialogues...' } as Record<string, string>)[language]}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="dialogues__search-clear" onClick={() => setSearch('')} aria-label="Clear">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Tag chips */}
            <div className="dialogues__tags">
              <button
                className={`dialogues__tag ${!activeTag && !showBookmarked ? 'dialogues__tag--active' : ''}`}
                onClick={() => { setActiveTag(null); setShowBookmarked(false); }}
                type="button"
              >
                {({ uz: 'Hammasi', ru: 'Все', en: 'All' } as Record<string, string>)[language]}
              </button>
              <button
                className={`dialogues__tag dialogues__tag--bookmark ${showBookmarked ? 'dialogues__tag--active' : ''}`}
                onClick={() => { setShowBookmarked(!showBookmarked); setActiveTag(null); }}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill={showBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {({ uz: 'Saqlangan', ru: 'Сохранённые', en: 'Saved' } as Record<string, string>)[language]}
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  className={`dialogues__tag ${activeTag === tag ? 'dialogues__tag--active' : ''}`}
                  onClick={() => { setActiveTag(activeTag === tag ? null : tag); setShowBookmarked(false); }}
                  type="button"
                >
                  {(TAGS[tag] as Record<string, string>)[language] ?? TAGS[tag].uz}
                </button>
              ))}
            </div>

            {/* Dialogue cards */}
            <div className="home__lessons">
              {filteredDialogues.map((d) => (
                <Link key={d.id} href={`/chinese/hsk1/dialogues/${d.slug}`} prefetch={false} className="dialogue-card">
                  <span className="dialogue-card__deco" aria-hidden="true">{d.title.slice(0, 3)}</span>
                  <div className="dialogue-card__content">
                    <div className="dialogue-card__text">
                      <h3 className="dialogue-card__title">{d.title}</h3>
                      <p className="dialogue-card__pinyin">{d.pinyin}</p>
                      <p className="dialogue-card__translation">{language === 'ru' ? d.titleTranslation_ru : language === 'en' ? (d.titleTranslation_en || d.titleTranslation) : d.titleTranslation}</p>
                      {(() => {
                        const stars = getDialogueStars(d.id) ?? 0;
                        return (
                          <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                            {[1, 2, 3].map(n => (
                              <span key={n} style={{ fontSize: 28, color: n <= stars ? '#f59e0b' : 'rgba(0,0,0,0.05)' }}>★</span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <button
                      className={`dialogue-card__bookmark ${bookmarks.has(d.id) ? 'dialogue-card__bookmark--active' : ''}`}
                      onClick={(e) => toggleBookmark(e, d.id)}
                      aria-label="Bookmark"
                      type="button"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill={bookmarks.has(d.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
                  {d.tag && (
                    <span className="dialogue-card__tag">{(TAGS[d.tag] as Record<string, string>)[language] ?? TAGS[d.tag].uz}</span>
                  )}
                </Link>
              ))}
              {filteredDialogues.length === 0 && (
                <p className="dialogues__empty">{({ uz: 'Hech narsa topilmadi', ru: 'Ничего не найдено', en: 'Nothing found' } as Record<string, string>)[language]}</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'writing' && (() => {
          const activeSets = hskVersion === '3.0' ? writingSets : writingHskLevel === '6' ? writingSetsHsk6 : writingHskLevel === '5' ? writingSetsHsk5 : writingHskLevel === '4' ? writingSetsHsk4 : writingHskLevel === '3' ? writingSetsHsk3 : writingHskLevel === '2' ? writingSetsHsk2L2 : writingSetsHsk2;
          const wq = writingSearch.trim().toLowerCase();
          const filteredSets = wq
            ? activeSets.filter((s) =>
                s.title.toLowerCase().includes(wq) ||
                s.title_ru.toLowerCase().includes(wq) ||
                s.chars.includes(wq) ||
                s.subtitle.toLowerCase().includes(wq)
              )
            : activeSets;
          return (
            <>
              <div className="dialogues__search">
                <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="dialogues__search-input"
                  placeholder={({ uz: 'Belgilarni qidirish...', ru: 'Поиск иероглифов...', en: 'Search characters...' } as Record<string, string>)[language]}
                  value={writingSearch}
                  onChange={(e) => setWritingSearch(e.target.value)}
                />
              </div>
              <div className="lp__writing-sets">
                {filteredSets.map((set) => {
                  const isEmpty = set.chars.length === 0;
                  const title = language === 'ru' ? set.title_ru : language === 'en' ? set.title_ru.replace('Набор', 'Set') : set.title;
                  const sub = (language === 'ru' ? set.subtitle_ru : language === 'en' ? set.subtitle_ru.replace('слов', 'words') : set.subtitle).split(' · ')[0];
                  const inner = (
                    <>
                      <div className="lp__writing-card-deco" aria-hidden="true">{isEmpty ? '🔒' : set.chars.slice(0, 3)}</div>
                      <div className="lp__writing-card__title">{title}</div>
                      <div className="lp__writing-card__sub">{isEmpty ? ({ uz: 'Tez kunda', ru: 'Скоро', en: 'Coming soon' } as Record<string, string>)[language] : sub}</div>
                      {!isEmpty && (() => {
                        const wStars = getWritingStars(set.id);
                        return (
                          <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                            {[1, 2, 3].map(n => (
                              <span key={n} style={{ fontSize: 28, color: wStars != null && n <= wStars ? '#f59e0b' : 'rgba(0,0,0,0.05)' }}>★</span>
                            ))}
                          </div>
                        );
                      })()}
                    </>
                  );
                  return isEmpty ? (
                    <div key={set.id} className="lp__writing-card lp__writing-card--soon">
                      {inner}
                    </div>
                  ) : (
                    <Link key={set.id} className="lp__writing-card" href={`/chinese/hsk1/writing/${set.id}`} prefetch={false}>
                      {inner}
                    </Link>
                  );
                })}
                {filteredSets.length === 0 && (
                  <p className="dialogues__empty">{({ uz: 'Hech narsa topilmadi', ru: 'Ничего не найдено', en: 'Nothing found' } as Record<string, string>)[language]}</p>
                )}
              </div>
            </>
          );
        })()}

        {activeTab === 'flashcards' && (
          <>
            {/* Sub-tab pills: Darslar / Mavzular */}
            {flashcardSubTab === 'lessons' && (() => {
              const activeFlashSets = flashcardHskLevel === '3' ? writingSetsHsk3 : flashcardHskLevel === '2' ? writingSetsHsk2L2 : writingSets;
              const hskPath = flashcardHskLevel === '3' ? 'hsk3' : flashcardHskLevel === '2' ? 'hsk2' : 'hsk1';
              return (
                <>
                  <FlashcardModeBar flashcardMode={flashcardMode} setFlashcardMode={setFlashcardMode} />
                  <div className="lp__writing-sets">
                    {activeFlashSets.map((set, idx) => {
                      const sampleTrans = language === 'ru' ? (set.sampleRu || set.sampleUz) : language === 'en' ? (set.sampleEn || set.sampleUz) : (set.sampleUz || '');
                      const ghost = flashcardMode === 'uz-zh'
                        ? `${sampleTrans} – ${set.sampleChar || ''}`
                        : `${set.sampleChar || ''} – ${sampleTrans}`;
                      const num = idx + 1;
                      return (
                        <Link
                          key={set.id}
                          className="lp__writing-card"
                          href={`/chinese/${hskPath}/flashcards/${set.id}`}
                          prefetch={false}
                        >
                          <div className="lp__writing-card-deco" aria-hidden="true">{ghost}</div>
                          <div className="lp__writing-card__title">
                            {({ uz: `${num}-to'plam`, ru: `Набор ${num}`, en: `Set ${num}` } as Record<string, string>)[language]}
                          </div>
                          <div className="lp__writing-card__sub">
                            {set.wordCount || 10} {({ uz: "so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language]}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {flashcardSubTab === 'topics' && (() => {
              const tq = topicSearch.trim().toLowerCase();
              const filteredTopics = tq
                ? TOPIC_ITEMS.filter((t) =>
                    t.uz.toLowerCase().includes(tq) ||
                    t.ru.toLowerCase().includes(tq) ||
                    t.en.toLowerCase().includes(tq) ||
                    t.slug.includes(tq)
                  )
                : TOPIC_ITEMS;
              return (
                <>
                  <FlashcardModeBar flashcardMode={flashcardMode} setFlashcardMode={setFlashcardMode} />
                  <div className="dialogues__search">
                    <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      className="dialogues__search-input"
                      placeholder={({ uz: 'Mavzularni qidirish...', ru: 'Поиск тем...', en: 'Search topics...' } as Record<string, string>)[language]}
                      value={topicSearch}
                      onChange={(e) => setTopicSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {filteredTopics.map((topic) => (
                      <Link
                        key={topic.slug}
                        href={`/chinese/hsk1/flashcards/topic/${topic.slug}`}
                        prefetch={false}
                        style={{
                          background: '#fff', borderRadius: 10, padding: '14px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          display: 'flex', alignItems: 'center', gap: 10,
                          textDecoration: 'none', color: 'inherit',
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{topic.icon}</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
                          {(topic as Record<string, string>)[language] ?? topic.uz}
                        </div>
                      </Link>
                    ))}
                    {filteredTopics.length === 0 && (
                      <p className="dialogues__empty">{({ uz: 'Hech narsa topilmadi', ru: 'Ничего не найдено', en: 'Nothing found' } as Record<string, string>)[language]}</p>
                    )}
                  </div>
                </>
              );
            })()}
          </>
        )}

        {activeTab === 'karaoke' && (
          <>
          <div className="dialogues__search">
            <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="dialogues__search-input"
              placeholder={({ uz: 'Qo\'shiqlarni qidirish...', ru: 'Поиск песен...', en: 'Search songs...' } as Record<string, string>)[language]}
              value={karaokeSearch}
              onChange={(e) => setKaraokeSearch(e.target.value)}
            />
            {karaokeSearch && (
              <button className="dialogues__search-clear" onClick={() => setKaraokeSearch('')} aria-label="Clear">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <div className="lp__list">
            {karaokeItems.filter((k) => {
              const q = karaokeSearch.trim().toLowerCase();
              if (!q) return true;
              return k.title.toLowerCase().includes(q) || k.pinyin.toLowerCase().includes(q) || k.translation.toLowerCase().includes(q) || k.translation_ru.toLowerCase().includes(q) || k.translation_en.toLowerCase().includes(q);
            }).map((k) => (
              <Link key={k.href} href={k.href} prefetch={false} className="lp__card">
                <div className="lp__card-deco" aria-hidden="true">{k.title.slice(0, 3)}</div>
                <div className="lp__card-main">
                  <div className="lp__card-title">{k.title}</div>
                  <div className="lp__card-pinyin">{k.pinyin}</div>
                  <div className="lp__card-sub">{({ uz: k.translation, ru: k.translation_ru, en: k.translation_en } as Record<string, string>)[language]}</div>
                </div>
                <div className="lp__card-arrow">›</div>
              </Link>
            ))}
          </div>
          </>
        )}

        {activeTab === 'grammar' && (() => {
          const gq = grammarSearch.trim().toLowerCase();
          const filteredGrammar = gq
            ? grammarItems.filter((item) =>
                item.char.includes(gq) ||
                item.pinyin.toLowerCase().includes(gq) ||
                item.translation.toLowerCase().includes(gq) ||
                item.translation_ru.toLowerCase().includes(gq) ||
                item.translation_en.toLowerCase().includes(gq)
              )
            : grammarItems;
          return (
            <>
              <div className="dialogues__search">
                <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="dialogues__search-input"
                  placeholder={({ uz: 'Grammatikani qidirish...', ru: 'Поиск грамматики...', en: 'Search grammar...' } as Record<string, string>)[language]}
                  value={grammarSearch}
                  onChange={(e) => setGrammarSearch(e.target.value)}
                />
              </div>
              <div className="home__lessons">
                {filteredGrammar.map((item, idx) => (
                  <Link key={item.char} href={item.active ? item.href : '#'} prefetch={false} className="grammar-card">
                    <span className="grammar-card__bg">{item.char}</span>
                    <div className="grammar-card__top">
                      <p className="grammar-card__title">{item.char} {item.pinyin}</p>
                      {!item.active && <span className="grammar-card__badge">{({ uz: 'Tez kunda', ru: 'Скоро', en: 'Soon' } as Record<string, string>)[language]}</span>}
                    </div>
                    <p className="grammar-card__translation">{({ uz: item.translation, ru: item.translation_ru, en: item.translation_en } as Record<string, string>)[language]}</p>
                    {(() => {
                      const slug = item.href.split('/').pop()!;
                      const stars = getGrammarStars(slug);
                      return (
                        <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                          {[1, 2, 3].map(n => (
                            <span key={n} style={{ fontSize: 28, color: stars != null && n <= stars ? '#f59e0b' : 'rgba(0,0,0,0.05)' }}>
                              ★
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </Link>
                ))}
                {filteredGrammar.length === 0 && (
                  <p className="dialogues__empty">{({ uz: 'Hech narsa topilmadi', ru: 'Ничего не найдено', en: 'Nothing found' } as Record<string, string>)[language]}</p>
                )}
              </div>
            </>
          );
        })()}

        {activeTab === 'tests' && (
          <div className="lang-page__placeholder">
            <p className="lang-page__placeholder-text">{({ uz: 'Tez kunda...', ru: 'Скоро...', en: 'Coming soon...' } as Record<string, string>)[language]}</p>
          </div>
        )}

      </section>

      <PageFooter />
    </main>
  );
}
