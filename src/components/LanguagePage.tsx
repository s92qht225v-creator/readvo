'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useLanguage } from '../hooks/useLanguage';
import { BannerMenu } from './BannerMenu';
import type { DialogueInfo } from '../services/dialogues';
import { HanziWriterPractice, type HanziWord } from './HanziWriterPractice';

const TAGS: Record<string, { uz: string; ru: string }> = {
  tanishuv: { uz: 'Tanishuv', ru: 'Знакомство' },
  kundalik: { uz: 'Kundalik', ru: 'Повседневное' },
  xaridlar: { uz: 'Xaridlar', ru: 'Покупки' },
  ovqat: { uz: 'Ovqat', ru: 'Еда' },
  salomatlik: { uz: 'Salomatlik', ru: 'Здоровье' },
  transport: { uz: 'Transport', ru: 'Транспорт' },
  telefon: { uz: 'Telefon', ru: 'Телефон' },
  ish: { uz: 'Ish/O\'qish', ru: 'Работа/Учёба' },
  reja: { uz: 'Reja', ru: 'Планы' },
  muloqot: { uz: 'Muloqot', ru: 'Общение' },
};

const BOOKMARK_KEY = 'blim-dialogue-bookmarks';

type Tab = 'dialogues' | 'writing' | 'flashcards' | 'karaoke' | 'grammar' | 'tests';

const tabs: { id: Tab; label: string; label_ru?: string }[] = [
  { id: 'dialogues', label: 'Dialog', label_ru: 'Диалог' },
  { id: 'writing', label: 'Yozish', label_ru: 'Письмо' },
  { id: 'flashcards', label: 'Flesh', label_ru: 'Флеш' },
  { id: 'karaoke', label: 'KTV' },
  { id: 'grammar', label: 'Tika', label_ru: 'Грамм' },
  { id: 'tests', label: 'Test', label_ru: 'Тесты' },
];

const validTabs: Tab[] = ['dialogues', 'writing', 'flashcards', 'karaoke', 'grammar', 'tests'];

const grammarItems = [
  { char: '是', pinyin: 'shì', href: '/chinese/hsk1/grammar/shi', translation: 'bo\'lmoq', translation_ru: 'быть', color: '#dc2626', active: true },
  { char: '有', pinyin: 'yǒu', href: '/chinese/hsk1/grammar/you', translation: 'ega bo\'lmoq', translation_ru: 'иметь', color: '#7c3aed', active: true },
  { char: '在', pinyin: 'zài', href: '/chinese/hsk1/grammar/zai', translation: 'joylashmoq', translation_ru: 'находиться', color: '#0891b2', active: true },
  { char: '的', pinyin: 'de', href: '/chinese/hsk1/grammar/de', translation: 'egalik / sifat bog\'lovchi', translation_ru: 'притяжательная частица', color: '#d97706', active: true },
  { char: '不', pinyin: 'bù', href: '/chinese/hsk1/grammar/bu', translation: 'inkor', translation_ru: 'отрицание', color: '#059669', active: true },
  { char: '吗', pinyin: 'ma', href: '/chinese/hsk1/grammar/ma', translation: 'savol yuklamasi', translation_ru: 'вопросительная частица', color: '#0891b2', active: true },
  { char: '呢', pinyin: 'ne', href: '/chinese/hsk1/grammar/ne', translation: 'davom yuklamasi', translation_ru: 'продолжительная частица', color: '#7c3aed', active: true },
  { char: '了', pinyin: 'le', href: '/chinese/hsk1/grammar/le', translation: 'tugallash / o\'zgarish', translation_ru: 'завершение / изменение', color: '#7c3aed', active: true },
  { char: '也', pinyin: 'yě', href: '/chinese/hsk1/grammar/ye', translation: 'ham', translation_ru: 'тоже', color: '#059669', active: true },
  { char: '都', pinyin: 'dōu', href: '/chinese/hsk1/grammar/dou', translation: 'hammasi / barchasi', translation_ru: 'все / всё', color: '#2563eb', active: true },
  { char: '很', pinyin: 'hěn', href: '/chinese/hsk1/grammar/hen', translation: 'juda / bog\'lovchi', translation_ru: 'очень / связка', color: '#7c3aed', active: true },
  { char: '想', pinyin: 'xiǎng', href: '/chinese/hsk1/grammar/xiang', translation: 'xohlamoq / sog\'inmoq', translation_ru: 'хотеть / скучать', color: '#e11d48', active: true },
  { char: '会', pinyin: 'huì', href: '/chinese/hsk1/grammar/hui', translation: '...a olmoq (mahorat)', translation_ru: 'уметь (навык)', color: '#dc2626', active: true },
  { char: '能', pinyin: 'néng', href: '/chinese/hsk1/grammar/neng', translation: '...a olmoq (imkoniyat)', translation_ru: 'мочь (возможность)', color: '#dc2626', active: true },
  { char: '没', pinyin: 'méi', href: '/chinese/hsk1/grammar/mei', translation: '...madim / yo\'q', translation_ru: 'не делал / нет', color: '#dc2626', active: true },
  { char: '几', pinyin: 'jǐ', href: '/chinese/hsk1/grammar/ji', translation: 'necha? / qancha?', translation_ru: 'сколько?', color: '#dc2626', active: true },
  { char: '量词', pinyin: 'liàngcí', href: '/chinese/hsk1/grammar/liangci', translation: 'sanash so\'zlari', translation_ru: 'счётные слова', color: '#dc2626', active: true },
];

const karaokeItems = [
  { title: '月亮代表我的心', pinyin: 'Yuèliàng dàibiǎo wǒ de xīn', translation: 'Oy yuragimni ifodalaydi', translation_ru: 'Луна выражает моё сердце', href: '/chinese/hsk1/karaoke/yueliang' },
  { title: '朋友', pinyin: 'Péngyou', translation: 'Do\'st', translation_ru: 'Друг', href: '/chinese/hsk1/karaoke/pengyou' },
];

const WRITING_SETS: { id: string; title: string; title_ru: string; subtitle: string; subtitle_ru: string; chars: string; words: HanziWord[] }[] = [
  {
    id: 'hsk1-set1',
    title: "HSK 1 — 1-to'plam",
    title_ru: 'HSK 1 — Набор 1',
    subtitle: '10 ta belgi · 的 我 你 是 了 不 在 他 们 好',
    subtitle_ru: '10 иероглифов · 的 我 你 是 了 不 在 他 们 好',
    chars: '的我你是了不在他们好',
    words: [
      { char: '的', pinyin: 'de', uz: 'egalik yuklamasi', ru: 'частица принадлежности', strokes: 8, radical: '白', radicalUz: 'oq', radicalRu: 'белый', ex: '我的书。', expy: 'Wǒ de shū.', exuz: 'Mening kitobim.', exru: 'Моя книга.' },
      { char: '我', pinyin: 'wǒ', uz: 'men', ru: 'я', strokes: 7, radical: '戈', radicalUz: 'nayza', radicalRu: 'копьё', ex: '我是学生。', expy: 'Wǒ shì xuéshēng.', exuz: 'Men talabaman.', exru: 'Я студент.' },
      { char: '你', pinyin: 'nǐ', uz: 'sen', ru: 'ты', strokes: 7, radical: '人', radicalUz: 'odam', radicalRu: 'человек', ex: '你好！', expy: 'Nǐ hǎo!', exuz: 'Salom!', exru: 'Привет!' },
      { char: '是', pinyin: 'shì', uz: "bo'lmoq", ru: 'быть', strokes: 9, radical: '日', radicalUz: 'quyosh', radicalRu: 'солнце', ex: '他是老师。', expy: 'Tā shì lǎoshī.', exuz: "U o'qituvchi.", exru: 'Он учитель.' },
      { char: '了', pinyin: 'le', uz: 'tugallash yuklamasi', ru: 'частица завершения', strokes: 2, radical: '乙', radicalUz: 'ikkinchi', radicalRu: 'второй', ex: '他来了。', expy: 'Tā lái le.', exuz: 'U keldi.', exru: 'Он пришёл.' },
      { char: '不', pinyin: 'bù', uz: 'emas', ru: 'не', strokes: 4, radical: '一', radicalUz: 'bir', radicalRu: 'один', ex: '我不去。', expy: 'Wǒ bú qù.', exuz: 'Men bormayman.', exru: 'Я не пойду.' },
      { char: '在', pinyin: 'zài', uz: "bor / joylashgan", ru: 'находиться / в', strokes: 6, radical: '土', radicalUz: 'tuproq', radicalRu: 'земля', ex: '他在家。', expy: 'Tā zài jiā.', exuz: 'U uyda.', exru: 'Он дома.' },
      { char: '他', pinyin: 'tā', uz: 'u (erkak)', ru: 'он', strokes: 5, radical: '人', radicalUz: 'odam', radicalRu: 'человек', ex: '他是老师。', expy: 'Tā shì lǎoshī.', exuz: "U o'qituvchi.", exru: 'Он учитель.' },
      { char: '们', pinyin: 'men', uz: "ko'plik qo'shimchasi", ru: 'суффикс множества', strokes: 5, radical: '人', radicalUz: 'odam', radicalRu: 'человек', ex: '我们是朋友。', expy: 'Wǒmen shì péngyou.', exuz: "Biz do'stmiz.", exru: 'Мы друзья.' },
      { char: '好', pinyin: 'hǎo', uz: 'yaxshi', ru: 'хороший', strokes: 6, radical: '女', radicalUz: 'ayol', radicalRu: 'женщина', ex: '你好！', expy: 'Nǐ hǎo!', exuz: 'Salom!', exru: 'Привет!' },
    ],
  },
  {
    id: 'hsk1-set2',
    title: "HSK 1 — 2-to'plam",
    title_ru: 'HSK 1 — Набор 2',
    subtitle: '10 ta belgi · 有 这 就 会 吗 要 什 么 说 她',
    subtitle_ru: '10 иероглифов · 有 这 就 会 吗 要 什 么 说 她',
    chars: '有这就会吗要什么说她',
    words: [
      { char: '有', pinyin: 'yǒu', uz: "bor (ega bo'lmoq)", ru: 'иметь', strokes: 6, radical: '月', radicalUz: 'oy', radicalRu: 'луна', ex: '我有一本书。', expy: 'Wǒ yǒu yì běn shū.', exuz: 'Mening bitta kitobim bor.', exru: 'У меня есть книга.' },
      { char: '这', pinyin: 'zhè', uz: 'bu', ru: 'это', strokes: 7, radical: '辶', radicalUz: 'yurish', radicalRu: 'движение', ex: '这是什么？', expy: 'Zhè shì shénme?', exuz: 'Bu nima?', exru: 'Что это?' },
      { char: '就', pinyin: 'jiù', uz: 'aynan / shu zahoti', ru: 'именно / сразу', strokes: 12, radical: '尢', radicalUz: 'cho\'loq', radicalRu: 'хромой', ex: '我就去。', expy: 'Wǒ jiù qù.', exuz: 'Men hoziroq boraman.', exru: 'Я сейчас пойду.' },
      { char: '会', pinyin: 'huì', uz: '...a olmoq', ru: 'уметь', strokes: 6, radical: '人', radicalUz: 'odam', radicalRu: 'человек', ex: '你会说中文吗？', expy: 'Nǐ huì shuō Zhōngwén ma?', exuz: 'Siz xitoy tilini bilasizmi?', exru: 'Вы умеете говорить по-китайски?' },
      { char: '吗', pinyin: 'ma', uz: 'savol yuklamasi', ru: 'вопросительная частица', strokes: 6, radical: '口', radicalUz: "og'iz", radicalRu: 'рот', ex: '你好吗？', expy: 'Nǐ hǎo ma?', exuz: 'Yaxshimisiz?', exru: 'Как дела?' },
      { char: '要', pinyin: 'yào', uz: 'kerak / xohlamoq', ru: 'нужно / хотеть', strokes: 9, radical: '女', radicalUz: 'ayol', radicalRu: 'женщина', ex: '我要喝水。', expy: 'Wǒ yào hē shuǐ.', exuz: 'Men suv ichmoqchiman.', exru: 'Я хочу пить воду.' },
      { char: '什', pinyin: 'shén', uz: 'nima (什么)', ru: 'что (什么)', strokes: 4, radical: '人', radicalUz: 'odam', radicalRu: 'человек', ex: '你叫什么名字？', expy: 'Nǐ jiào shénme míngzi?', exuz: 'Ismingiz nima?', exru: 'Как вас зовут?' },
      { char: '么', pinyin: 'me', uz: 'nima (什么)', ru: 'что (什么)', strokes: 3, radical: '厶', radicalUz: 'xususiy', radicalRu: 'личный', ex: '什么时候？', expy: 'Shénme shíhou?', exuz: 'Qachon?', exru: 'Когда?' },
      { char: '说', pinyin: 'shuō', uz: 'gapirmoq', ru: 'говорить', strokes: 9, radical: '讠', radicalUz: 'nutq', radicalRu: 'речь', ex: '他说中文。', expy: 'Tā shuō Zhōngwén.', exuz: 'U xitoy tilida gapiradi.', exru: 'Он говорит по-китайски.' },
      { char: '她', pinyin: 'tā', uz: 'u (ayol)', ru: 'она', strokes: 6, radical: '女', radicalUz: 'ayol', radicalRu: 'женщина', ex: '她很漂亮。', expy: 'Tā hěn piàoliang.', exuz: 'U juda chiroyli.', exru: 'Она очень красивая.' },
    ],
  },
];

const FLASHCARD_MODE_KEY = 'blim-flashcard-mode';

function FlashcardModeBar({ flashcardMode, setFlashcardMode }: { flashcardMode: string; setFlashcardMode: (m: string) => void }) {
  const [language] = useLanguage();
  const modes = [
    { id: 'zh-uz', label: language === 'ru' ? "汉字 → Русский" : "汉字 → O'zbekcha" },
    { id: 'uz-zh', label: language === 'ru' ? "Русский → 汉字" : "O'zbekcha → 汉字" },
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

function FlashcardUnitSelector({ lessons, onStart }: {
  lessons: { lessonId: string; lessonNumber: number; wordCount: number; title?: string; title_ru?: string }[];
  onStart: (selectedIds: string[]) => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [language] = useLanguage();

  const toggle = (id: string) => setSelected((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );

  const totalWords = selected.reduce((sum, id) => {
    return sum + (lessons.find((l) => l.lessonId === id)?.wordCount ?? 0);
  }, 0);

  const allSelected = selected.length === lessons.length;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#dc2626', fontWeight: 700, marginBottom: 10 }}>
        {language === 'ru' ? 'Выберите уроки' : 'Darslarni tanlang'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {lessons.map((l) => {
          const sel = selected.includes(l.lessonId);
          return (
            <div key={l.lessonId} onClick={() => toggle(l.lessonId)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff',
              border: sel ? '2px solid #dc2626' : '2px solid transparent',
              borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#fff',
                background: '#dc2626', borderRadius: 8,
                minWidth: 28, height: 28, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{l.lessonNumber}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{l.title ?? `第${l.lessonNumber}课`}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{l.wordCount} {language === 'ru' ? 'слов' : 'so\'z'}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button
          onClick={() => setSelected(allSelected ? [] : lessons.map((l) => l.lessonId))}
          style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
          type="button"
        >
          {language === 'ru'
            ? (allSelected ? 'Снять все' : 'Выбрать все')
            : (allSelected ? 'Barchasini bekor qilish' : 'Barchasini tanlash')}
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
        {language === 'ru' ? `Начать (${totalWords} слов)` : `Boshlash (${totalWords} so'z)`}
      </button>
    </div>
  );
}

interface FlashcardLesson {
  lessonId: string;
  lessonNumber: number;
  wordCount: number;
  title?: string;
  title_ru?: string;
}

interface Props {
  dialogues: DialogueInfo[];
  flashcardLessons?: FlashcardLesson[];
}

export function LanguagePage({ dialogues, flashcardLessons = [] }: Props) {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
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
  const [selectedWritingSet, setSelectedWritingSet] = useState<string | null>(null);
  const [writingSubtab, setWritingSubtab] = useState<'writing' | 'chars'>('writing');
  const [writingSearch, setWritingSearch] = useState('');
  const [grammarSearch, setGrammarSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');

  // Flashcard mode
  const [flashcardMode, setFlashcardMode] = useState<string>('zh-uz');
  const initialSubTab = searchParams.get('subtab');
  const [flashcardSubTab, setFlashcardSubTab] = useState<'lessons' | 'topics'>(initialSubTab === 'topics' ? 'topics' : 'lessons');

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
      <header className="home__hero">
        <div className="home__hero-inner">
          <span className="lp__hero-watermark" aria-hidden="true">中</span>
          <div className="home__hero-top-row">
            {activeTab === 'writing' && selectedWritingSet ? (
              <button
                className="dr-back-btn"
                type="button"
                onClick={() => setSelectedWritingSet(null)}
                aria-label="Orqaga"
              >
                ‹
              </button>
            ) : (
              <Link href="/" className="home__hero-logo">
                <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
              </Link>
            )}
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">HSK 1</div>
            <div className="dr-hero__title">{
              activeTab === 'dialogues' ? '对话' :
              activeTab === 'writing' ? '书写' :
              activeTab === 'flashcards' ? '词卡' :
              activeTab === 'karaoke' ? '歌曲' :
              activeTab === 'grammar' ? '语法' :
              '测验'
            }</div>
            <div className="dr-hero__pinyin">{
              activeTab === 'dialogues' ? 'duìhuà' :
              activeTab === 'writing' ? 'shūxiě' :
              activeTab === 'flashcards' ? 'cíkǎ' :
              activeTab === 'karaoke' ? 'gēqǔ' :
              activeTab === 'grammar' ? 'yǔfǎ' :
              'cèyàn'
            }</div>
            <div className="dr-hero__translation">— {language === 'ru' ? (
              activeTab === 'dialogues' ? 'Диалоги' :
              activeTab === 'writing' ? 'Письмо' :
              activeTab === 'flashcards' ? 'Флешкарты' :
              activeTab === 'karaoke' ? 'Песни' :
              activeTab === 'grammar' ? 'Грамматика' :
              'Тесты'
            ) : (
              activeTab === 'dialogues' ? 'Dialoglar' :
              activeTab === 'writing' ? 'Yozish' :
              activeTab === 'flashcards' ? 'Fleshkartalar' :
              activeTab === 'karaoke' ? 'Qo\'shiqlar' :
              activeTab === 'grammar' ? 'Grammatika' :
              'Testlar'
            )} —</div>
          </div>
        </div>
      </header>
      {activeTab === 'writing' && selectedWritingSet ? (
        <nav className="lp__tabs">
          <div className="lp__tabs-inner">
            <button
              className={`lp__tab ${writingSubtab === 'writing' ? 'lp__tab--active' : ''}`}
              onClick={() => setWritingSubtab('writing')}
              type="button"
            >
              {language === 'ru' ? 'Письмо' : 'Yozish'}
            </button>
            <button
              className={`lp__tab ${writingSubtab === 'chars' ? 'lp__tab--active' : ''}`}
              onClick={() => setWritingSubtab('chars')}
              type="button"
            >
              {language === 'ru' ? 'Иероглифы' : 'Hierogliflar'}
            </button>
          </div>
        </nav>
      ) : (
        <nav className="lp__tabs">
          <div className="lp__tabs-inner">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`lp__tab ${activeTab === tab.id ? 'lp__tab--active' : ''}`}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'writing') setSelectedWritingSet(null); }}
                type="button"
              >
                {language === 'ru' && tab.label_ru ? tab.label_ru : tab.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* HSK level pills */}
      {activeTab !== 'karaoke' && (
        <div className="lp__seg-bar">
          <div className="lp__hsk-pills">
            {(['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'] as const).map((lv) => {
              const hasContent = lv === 'HSK 1';
              const isActive = activeTab === 'flashcards' ? (flashcardSubTab === 'lessons' && lv === 'HSK 1') : hasContent;
              return (
                <button
                  key={lv}
                  type="button"
                  disabled={!hasContent}
                  onClick={() => { if (hasContent && activeTab === 'flashcards') setFlashcardSubTab('lessons'); }}
                  className={`lp__hsk-pill ${isActive ? 'lp__hsk-pill--active' : ''} ${!hasContent ? 'lp__hsk-pill--disabled' : ''}`}
                >
                  {lv}
                </button>
              );
            })}
            {activeTab === 'flashcards' && (
              <button
                type="button"
                onClick={() => setFlashcardSubTab('topics')}
                className={`lp__hsk-pill ${flashcardSubTab === 'topics' ? 'lp__hsk-pill--active' : ''}`}
              >
                {language === 'ru' ? 'Темы' : 'Mavzular'}
              </button>
            )}
          </div>
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
                placeholder={language === 'ru' ? 'Поиск диалогов...' : 'Dialoglarni qidirish...'}
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
                {language === 'ru' ? 'Все' : 'Hammasi'}
              </button>
              <button
                className={`dialogues__tag dialogues__tag--bookmark ${showBookmarked ? 'dialogues__tag--active' : ''}`}
                onClick={() => { setShowBookmarked(!showBookmarked); setActiveTag(null); }}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill={showBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {language === 'ru' ? 'Сохранённые' : 'Saqlangan'}
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  className={`dialogues__tag ${activeTag === tag ? 'dialogues__tag--active' : ''}`}
                  onClick={() => { setActiveTag(activeTag === tag ? null : tag); setShowBookmarked(false); }}
                  type="button"
                >
                  {language === 'ru' ? TAGS[tag].ru : TAGS[tag].uz}
                </button>
              ))}
            </div>

            {/* Dialogue cards */}
            <div className="home__lessons">
              {filteredDialogues.map((d) => (
                <Link key={d.id} href={`/chinese/hsk1/dialogues/${d.id}`} className="dialogue-card">
                  <span className="dialogue-card__deco" aria-hidden="true">{d.title}</span>
                  <div className="dialogue-card__content">
                    <div className="dialogue-card__text">
                      <h3 className="dialogue-card__title">{d.title}</h3>
                      <p className="dialogue-card__pinyin">{d.pinyin}</p>
                      <p className="dialogue-card__translation">{language === 'ru' ? d.titleTranslation_ru : d.titleTranslation}</p>
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
                    <span className="dialogue-card__tag">{language === 'ru' ? TAGS[d.tag].ru : TAGS[d.tag].uz}</span>
                  )}
                </Link>
              ))}
              {filteredDialogues.length === 0 && (
                <p className="dialogues__empty">{language === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'writing' && (() => {
          const activeSet = selectedWritingSet
            ? WRITING_SETS.find((s) => s.id === selectedWritingSet)
            : null;
          if (activeSet) {
            return (
              <HanziWriterPractice
                lang={language}
                words={activeSet.words}
                onBack={() => setSelectedWritingSet(null)}
                autoStart
                hideSubtabs
                subtab={writingSubtab}
                onSubtabChange={setWritingSubtab}
              />
            );
          }
          const wq = writingSearch.trim().toLowerCase();
          const filteredSets = wq
            ? WRITING_SETS.filter((s) =>
                s.title.toLowerCase().includes(wq) ||
                s.title_ru.toLowerCase().includes(wq) ||
                s.chars.includes(wq) ||
                s.subtitle.toLowerCase().includes(wq)
              )
            : WRITING_SETS;
          return (
            <>
              <div className="dialogues__search">
                <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="dialogues__search-input"
                  placeholder={language === 'ru' ? 'Поиск иероглифов...' : 'Belgilarni qidirish...'}
                  value={writingSearch}
                  onChange={(e) => setWritingSearch(e.target.value)}
                />
              </div>
              <div className="lp__writing-sets">
                {filteredSets.map((set) => (
                  <button
                    key={set.id}
                    className="lp__writing-card"
                    type="button"
                    onClick={() => setSelectedWritingSet(set.id)}
                  >
                    <div className="lp__writing-card__chars" aria-hidden="true">
                      {set.chars}
                    </div>
                    <div className="lp__writing-card__body">
                      <div className="lp__writing-card__title">
                        {language === 'ru' ? set.title_ru : set.title}
                      </div>
                      <div className="lp__writing-card__sub">
                        {language === 'ru' ? set.subtitle_ru : set.subtitle}
                      </div>
                    </div>
                    <div className="lp__card-arrow">›</div>
                  </button>
                ))}
                {filteredSets.length === 0 && (
                  <p className="dialogues__empty">{language === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}</p>
                )}
              </div>
            </>
          );
        })()}

        {activeTab === 'flashcards' && (
          <>
            {/* Sub-tab pills: Darslar / Mavzular */}
            {flashcardSubTab === 'lessons' && (
              <>
                <FlashcardModeBar flashcardMode={flashcardMode} setFlashcardMode={setFlashcardMode} />
                <FlashcardUnitSelector
                  lessons={flashcardLessons}
                  onStart={(selectedIds) => {
                    localStorage.setItem(FLASHCARD_MIX_KEY, JSON.stringify(selectedIds));
                    router.push('/chinese/hsk1/flashcards/mix');
                  }}
                />
              </>
            )}

            {flashcardSubTab === 'topics' && (() => {
              const allTopics = [
                { uz: 'Oila', ru: 'Семья', icon: '👨‍👩‍👧', slug: 'family' },
                { uz: 'Tana a\'zolari', ru: 'Части тела', icon: '🫀', slug: 'body' },
                { uz: 'Oziq-ovqat', ru: 'Еда', icon: '🍜', slug: 'food' },
                { uz: 'Hayvonlar', ru: 'Животные', icon: '🐼', slug: 'animals' },
                { uz: 'Ranglar', ru: 'Цвета', icon: '🎨', slug: 'colors' },
                { uz: 'Sonlar', ru: 'Числа', icon: '🔢', slug: 'numbers' },
                { uz: 'Vaqt', ru: 'Время', icon: '⏰', slug: 'time' },
                { uz: 'Kasblar', ru: 'Профессии', icon: '👩‍🏫', slug: 'professions' },
              ];
              const tq = topicSearch.trim().toLowerCase();
              const filteredTopics = tq
                ? allTopics.filter((t) =>
                    t.uz.toLowerCase().includes(tq) ||
                    t.ru.toLowerCase().includes(tq) ||
                    t.slug.includes(tq)
                  )
                : allTopics;
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
                      placeholder={language === 'ru' ? 'Поиск тем...' : 'Mavzularni qidirish...'}
                      value={topicSearch}
                      onChange={(e) => setTopicSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {filteredTopics.map((topic) => (
                      <Link
                        key={topic.slug}
                        href={`/chinese/hsk1/flashcards/topic/${topic.slug}`}
                        style={{
                          background: '#fff', borderRadius: 10, padding: '14px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                          display: 'flex', alignItems: 'center', gap: 10,
                          textDecoration: 'none', color: 'inherit',
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{topic.icon}</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
                          {language === 'ru' ? topic.ru : topic.uz}
                        </div>
                      </Link>
                    ))}
                    {filteredTopics.length === 0 && (
                      <p className="dialogues__empty">{language === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}</p>
                    )}
                  </div>
                </>
              );
            })()}
          </>
        )}

        {activeTab === 'karaoke' && (
          <div className="lp__list">
            {karaokeItems.map((k) => (
              <Link key={k.href} href={k.href} className="lp__card">
                <div className="lp__card-main">
                  <div className="lp__card-title">{k.title}</div>
                  <div className="lp__card-pinyin">{k.pinyin}</div>
                  <div className="lp__card-sub">{language === 'ru' ? k.translation_ru : k.translation}</div>
                </div>
                <div className="lp__card-arrow">›</div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'grammar' && (() => {
          const gq = grammarSearch.trim().toLowerCase();
          const filteredGrammar = gq
            ? grammarItems.filter((item) =>
                item.char.includes(gq) ||
                item.pinyin.toLowerCase().includes(gq) ||
                item.translation.toLowerCase().includes(gq) ||
                item.translation_ru.toLowerCase().includes(gq)
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
                  placeholder={language === 'ru' ? 'Поиск грамматики...' : 'Grammatikani qidirish...'}
                  value={grammarSearch}
                  onChange={(e) => setGrammarSearch(e.target.value)}
                />
              </div>
              <div className="home__lessons">
                {filteredGrammar.map((item) => (
                  <Link key={item.char} href={item.active ? item.href : '#'} className="grammar-card">
                    <span className="grammar-card__bg">{item.char}</span>
                    <div className="grammar-card__top">
                      <div className="grammar-card__icon" style={{ background: item.color }}>{item.char}</div>
                      <p className="grammar-card__title">{item.char} {item.pinyin}</p>
                      {!item.active && <span className="grammar-card__badge">{language === 'ru' ? 'Скоро' : 'Tez kunda'}</span>}
                    </div>
                    <p className="grammar-card__translation">{language === 'ru' ? item.translation_ru : item.translation}</p>
                  </Link>
                ))}
                {filteredGrammar.length === 0 && (
                  <p className="dialogues__empty">{language === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}</p>
                )}
              </div>
            </>
          );
        })()}

        {activeTab === 'tests' && (
          <div className="lang-page__placeholder">
            <p className="lang-page__placeholder-text">{language === 'ru' ? 'Скоро...' : 'Tez kunda...'}</p>
          </div>
        )}

      </section>

      <footer className="home__footer">
        <p>Blim — Interaktiv til darsliklari</p>
      </footer>
    </main>
  );
}
