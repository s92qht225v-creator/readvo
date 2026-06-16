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
import { prefetchHanzi } from '@/utils/hanziStrokes';
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
  'ob-havo': { uz: 'Ob-havo', ru: 'Погода', en: 'Weather' },
  texnologiya: { uz: 'Texnologiya', ru: 'Технологии', en: 'Technology' },
};

const BOOKMARK_KEY = 'blim-dialogue-bookmarks';

type Tab = 'dialogues' | 'writing' | 'flashcards' | 'karaoke' | 'grammar';

// Grammar is reachable from the menu (BannerMenu "Sections"), not the tab bar.
const tabs: { id: Tab; label: string; label_ru?: string; label_en?: string }[] = [
  { id: 'dialogues', label: 'Dialog', label_ru: 'Диалог', label_en: 'Dialogues' },
  { id: 'writing', label: 'Yozish', label_ru: 'Письмо', label_en: 'Writing' },
  { id: 'flashcards', label: 'Fleshkarta', label_ru: 'Флешкарты', label_en: 'Flashcards' },
  { id: 'karaoke', label: 'KTV' },
];

/* Icons for the mobile bottom tab bar. Inactive tabs show only the icon; the
   active tab swaps the icon for its text label (see .lp__tab rules). */
const TAB_ICONS: Record<string, React.ReactNode> = {
  dialogues: <svg viewBox="0 0 100 100" width="28" height="28" style={{ width: 28, height: 28 }} fill="currentColor" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M89.7,45.3H76.6V21.5c0-4.4-3.6-7.9-7.9-7.9H13.2c-4.4,0-7.9,3.6-7.9,7.9v32.2c0,4.4,3.6,7.9,7.9,7.9h8.7l0,15.4l15.8-15.4h10.5v9.9c0,2.9,2.3,5.2,5.2,5.2h20.3L84,86.9l0-10.1h5.7c2.9,0,5.2-2.3,5.2-5.2V50.5C94.9,47.7,92.6,45.3,89.7,45.3z M37.6,58.7h-1.2l-0.9,0.9L24.8,70v-8.3l0-3h-3h-8.7c-2.7,0-4.9-2.2-4.9-4.9V21.5c0-2.7,2.2-4.9,4.9-4.9h55.5c2.7,0,4.9,2.2,4.9,4.9v23.8H53.4c-2.9,0-5.2,2.3-5.2,5.2v8.2H37.6z M91.9,71.6c0,1.2-1,2.2-2.2,2.2H84h-3v3v3l-5.2-5.1l-0.9-0.9h-1.2H53.4c-1.2,0-2.2-1-2.2-2.2V50.5c0-1.2,1-2.2,2.2-2.2h36.3c1.2,0,2.2,1,2.2,2.2V71.6z"/></svg>,
  writing: <svg viewBox="0 0 100 100" width="24" height="24" style={{ width: 24, height: 24 }} fill="currentColor" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m88.387 4.2852c-1.9102-0.003906-3.8164 0.71484-5.2617 2.1641l-4.2617 4.2539-2.2305-2.2305c-1.9375-1.9375-4.4883-2.9141-7.043-2.9141-2.5547 0-5.1055 0.97266-7.0469 2.9141l-22.223 22.219c-0.26953 0.26953-0.42187 0.63281-0.42187 1.0156 0 0.37891 0.15234 0.74219 0.42187 1.0117 0.26953 0.26953 0.63281 0.42188 1.0117 0.42188 0.38281 0 0.74609-0.15234 1.0156-0.42188l22.219-22.234c2.6055-2.6055 6.6914-2.7734 9.4883-0.50391-0.41406 0.19922-0.80469 0.46875-1.1484 0.80859l-59.605 59.609c-0.14453 0.14844-0.25391 0.32422-0.32422 0.51562l-8.5117 22.875c-0.19531 0.52344-0.066406 1.1133 0.32812 1.5078s0.98438 0.52344 1.5078 0.32812l22.871-8.5117c0.19141-0.074219 0.36328-0.18359 0.50781-0.32812l59.617-59.613c1.6289-1.6289 1.6523-4.2891 0.082031-5.9531l4.2539-4.2539c2.6133-2.5898 2.5391-6.5625 0.45313-9.4688l-0.003907-0.003906c0.003907-0.38281-0.14844-0.75391-0.42188-1.0234v-0.003906-0.003906c-1.4492-1.4492-3.3633-2.1719-5.2734-2.1719zm0 2.8359c1.1719 0.003906 2.3438 0.45312 3.25 1.3594 1.793 1.8086 1.7852 4.6758-0.011719 6.4531l0.003906 0.003906h-0.011718l-4.2539 4.2539-6.4688-6.4688 4.2617-4.25h-0.003906v-0.003906-0.003906-0.003906c0.89844-0.89844 2.0664-1.3398 3.2383-1.3398zm-12.453 5.2695c0.35938 0 0.71875 0.14062 1 0.42578l10.336 10.336c0.56641 0.56641 0.56641 1.4375 0 2.0039l-58.594 58.594-12.34-12.336 58.598-58.598c0.28125-0.28125 0.64062-0.42578 1-0.42578zm-61.055 61.605 11.211 11.211-17.859 6.6367z"/></svg>,
  flashcards: <svg viewBox="0 0 100 100" width="28" height="28" style={{ width: 28, height: 28 }} fill="currentColor" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m79.91 9h-41.82c-2.8086 0-5.0898 2.2812-5.0898 5.0898v2.9102h-12.91c-2.8086 0-5.0898 2.2812-5.0898 5.0898v63.82c0 2.8086 2.2812 5.0898 5.0898 5.0898h43.82c2.8086 0 5.0898-2.2812 5.0898-5.0898v-2.9102h10.91c2.8086 0 5.0898-2.2812 5.0898-5.0898v-63.82c0-2.8086-2.2812-5.0898-5.0898-5.0898zm-44.91 5.0898c0-1.6992 1.3906-3.0898 3.0898-3.0898h41.82c1.6992 0 3.0898 1.3906 3.0898 3.0898v40.91h-48zm-2 35.059-3.8984-3.8281c-1.3516-1.3281-2.1016-3.1016-2.1016-5 0-1.8906 0.75-3.6719 2.1094-5l0.23828-0.23828c1.0117-0.98828 2.2812-1.6484 3.6484-1.9219zm-12.91-30.148h12.91v12.121c-1.8984 0.30078-3.6719 1.1719-5.0586 2.5312l-0.24219 0.24609c-1.7383 1.7109-2.6992 3.9883-2.6992 6.4219 0 2.4297 0.96094 4.7188 2.6992 6.4219l5.3008 5.2109v13.047h-16v-42.91c0-1.6992 1.3906-3.0898 3.0898-3.0898zm46.91 66.91c0 1.6992-1.3906 3.0898-3.0898 3.0898h-43.82c-1.6992 0-3.0898-1.3906-3.0898-3.0898v-18.91h16v6h-7c-0.55078 0-1 0.44922-1 1s0.44922 1 1 1h7v2.9102c0 2.8086 2.2812 5.0898 5.0898 5.0898h28.91zm12.91-4.9102h-41.82c-1.6992 0-3.0898-1.3906-3.0898-3.0898v-20.91h48v20.91c0 1.6992-1.3906 3.0898-3.0898 3.0898zm-4.9102-17c0 0.55078-0.44922 1-1 1h-30c-0.55078 0-1-0.44922-1-1s0.44922-1 1-1h30c0.55078 0 1 0.44922 1 1zm-8 8c0 0.55078-0.44922 1-1 1h-14c-0.55078 0-1-0.44922-1-1s0.44922-1 1-1h14c0.55078 0 1 0.44922 1 1zm-23.57-41.648 7.9102 5.4688-3.2891 9.8594c-0.12891 0.39062-0.011719 0.82031 0.30859 1.0781 0.32031 0.26172 0.76172 0.30859 1.1211 0.10938l9.5195-5.1562 9.5195 5.1719c0.15234 0.078126 0.32031 0.11719 0.48047 0.11719 0.23047 0 0.46094-0.078125 0.64062-0.23047 0.30859-0.26172 0.44141-0.69141 0.30859-1.0781l-3.2891-9.8594 7.9102-5.4688c0.32813-0.23047 0.48828-0.62891 0.41016-1.0195s-0.39062-0.69922-0.78125-0.78125l-9.8203-2-4.4883-8.9883c-0.33984-0.67969-1.4492-0.67969-1.7891 0l-4.4883 8.9883-9.8203 2c-0.39062 0.078125-0.69922 0.39062-0.78125 0.78125-0.070313 0.375 0.089843 0.77734 0.41797 1.0078zm11.059-1.9414c0.30078-0.058594 0.55859-0.26172 0.69922-0.53125l3.8125-7.6406 3.8086 7.6406c0.14062 0.28125 0.39062 0.46875 0.69922 0.53125l8 1.6289-6.6016 4.5703c-0.37109 0.25-0.51953 0.71875-0.37891 1.1406l2.7305 8.1719-7.7695-4.2188c-0.14844-0.078125-0.30859-0.12109-0.48047-0.12109-0.17187 0-0.32812 0.039063-0.48047 0.12109l-7.7695 4.2188 2.7305-8.1719c0.14062-0.42188-0.011719-0.89062-0.37891-1.1406l-6.6016-4.5703z"/></svg>,
  karaoke: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 18V5l12-2v13"/></svg>,
};

const validTabs: Tab[] = ['dialogues', 'writing', 'flashcards', 'karaoke', 'grammar'];

const grammarItems = [
  { char: '什么', pinyin: 'shénme', href: '/chinese/hsk1/grammar/shenme', translation: 'nima?', translation_ru: 'что?', translation_en: 'what?', color: '#dc2626', active: true },
  { char: '是', pinyin: 'shì', href: '/chinese/hsk1/grammar/shi', translation: 'bo\'lmoq', translation_ru: 'быть', translation_en: 'to be', color: '#dc2626', active: true },
  { char: '不是', pinyin: 'bú shì', href: '/chinese/hsk1/grammar/bushi-polished', translation: 'emas', translation_ru: 'не быть', translation_en: 'is not', color: '#dc2626', active: true },
  { char: '吗', pinyin: 'ma', href: '/chinese/hsk1/grammar/ma', translation: 'savol yuklamasi', translation_ru: 'вопросительная частица', translation_en: 'question particle', color: '#0891b2', active: true },
  { char: '谁', pinyin: 'shéi', href: '/chinese/hsk1/grammar/shei', translation: 'kim?', translation_ru: 'кто?', translation_en: 'who?', color: '#d97706', active: true },
  { char: '哪', pinyin: 'nǎ', href: '/chinese/hsk1/grammar/na', translation: 'qaysi?', translation_ru: 'который?', translation_en: 'which?', color: '#0284c7', active: true },
  { char: '的', pinyin: 'de', href: '/chinese/hsk1/grammar/de', translation: 'egalik belgisi', translation_ru: 'частица принадлежности', translation_en: 'possessive particle', color: '#be185d', active: true },
  { char: '呢', pinyin: 'ne', href: '/chinese/hsk1/grammar/ne', translation: '…chi?', translation_ru: '…а вы?', translation_en: '…and you?', color: '#7c3aed', active: true },
  { char: '几', pinyin: 'jǐ', href: '/chinese/hsk1/grammar/ji', translation: 'nechta?', translation_ru: 'сколько?', translation_en: 'how many?', color: '#059669', active: true },
  { char: '数字', pinyin: 'shùzì', href: '/chinese/hsk1/grammar/shuzi', translation: '1-99 sonlar', translation_ru: 'числа 1-99', translation_en: 'numbers 1-99', color: '#f59e0b', active: true },
  { char: '几岁 / 多大', pinyin: 'jǐ suì / duō dà', ghost: '几岁', href: '/chinese/hsk1/grammar/duoda', translation: 'necha yoshda?', translation_ru: 'сколько лет?', translation_en: 'how old?', color: '#0369a1', active: true },
  { char: '会', pinyin: 'huì', href: '/chinese/hsk1/grammar/hui', translation: 'qila olmoq', translation_ru: 'уметь', translation_en: 'can / be able to', color: '#dc2626', active: true },
  { char: '很', pinyin: 'hěn', href: '/chinese/hsk1/grammar/hen', translation: 'juda', translation_ru: 'очень', translation_en: 'very', color: '#b45309', active: true },
  { char: '怎么', pinyin: 'zěnme', href: '/chinese/hsk1/grammar/zenme', translation: 'qanday?', translation_ru: 'как?', translation_en: 'how?', color: '#0f766e', active: true },
  { char: '日期', pinyin: 'rìqī', href: '/chinese/hsk1/grammar/riqi', translation: 'sanalar', translation_ru: 'даты', translation_en: 'dates', color: '#7c3aed', active: true },
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
    <div style={{ display: 'flex', background: '#f5f5f8', borderRadius: 3, overflow: 'hidden', marginBottom: 14, border: '1px solid #e0e0e6' }}>
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
              role="button"
              tabIndex={0}
              aria-label={l.title ?? `第${l.lessonNumber}课`}
              onPointerDown={() => handlePointerDown(l)}
              onPointerUp={() => handlePointerUp(l)}
              onPointerLeave={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
              onPointerCancel={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
              onClick={() => handleClick(l)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(l); } }}
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
                <div style={{ fontSize: 11, color: '#6b7177' }}>{l.wordCount} {({ uz: "so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language]}</div>
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
              style={{ background: 'transparent', border: 'none', color: '#6b7177', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
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
  /** Toneless pinyin of every word in the set, space-joined (e.g.
   *  "de wo ni shi le bu zai ta women hao"). Lets the search box match
   *  pinyin typed without tone marks. */
  pinyin?: string;
  wordCount?: number;
  sampleChar?: string;
  sampleUz?: string;
  sampleRu?: string;
  sampleEn?: string;
}

type HskLevel = '1' | '2' | '3' | '4' | '5' | '6';

/** Parse an HSK level from a URL param, clamped to [1, max]. Anything absent
 *  or out of range falls back to '1'. Replaces repeated `=== '6' ? '6' : …`
 *  ladders and makes the flashcard clamp (only levels 1-3 have decks)
 *  explicit instead of a silent default. */
function parseHskLevel(raw: string | null | undefined, max = 6): HskLevel {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= max) return String(n) as HskLevel;
  return '1';
}

interface Props {
  dialogues: DialogueInfo[];
  dialoguesHsk2?: DialogueInfo[];
  dialoguesHsk3?: DialogueInfo[];
  dialoguesHsk4?: DialogueInfo[];
  dialoguesHsk5?: DialogueInfo[];
  dialoguesHsk6?: DialogueInfo[];
  flashcardLessons?: FlashcardLesson[];
  writingSets?: WritingSetMeta[];
  writingSetsHsk2?: WritingSetMeta[];
  writingSetsHsk2L2?: WritingSetMeta[];
  writingSetsHsk3?: WritingSetMeta[];
  writingSetsHsk4?: WritingSetMeta[];
  writingSetsHsk5?: WritingSetMeta[];
  writingSetsHsk6?: WritingSetMeta[];
}

export function LanguagePage({ dialogues, dialoguesHsk2 = [], dialoguesHsk3 = [], dialoguesHsk4 = [], dialoguesHsk5 = [], dialoguesHsk6 = [], flashcardLessons = [], writingSets = [], writingSetsHsk2 = [], writingSetsHsk2L2 = [], writingSetsHsk3 = [], writingSetsHsk4 = [], writingSetsHsk5 = [], writingSetsHsk6 = [] }: Props) {
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
  const [dialogueHskLevel, setDialogueHskLevel] = useState<HskLevel>(parseHskLevel(searchParams.get('dialhsk')));
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(BOOKMARK_KEY) : null;
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Writing tab
  const initialVersion = searchParams.get('version') === '3.0' ? '3.0' : '2.0';
  const [hskVersion, setHskVersion] = useState<'3.0' | '2.0'>(initialVersion);
  const [writingHskLevel, setWritingHskLevel] = useState<HskLevel>(parseHskLevel(searchParams.get('hsk')));
  const [writingSearch, setWritingSearch] = useState('');
  const [karaokeSearch, setKaraokeSearch] = useState('');
  const [grammarSearch, setGrammarSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');

  // On the Writing tab, warm the stroke data for the first character of each
  // listed set. By the time the user taps a set card the glyph is cached, so
  // the practice canvas renders it immediately instead of showing the "..."
  // loader while it fetches from the CDN.
  useEffect(() => {
    if (activeTab !== 'writing') return;
    const sets = hskVersion === '3.0' ? writingSets
      : writingHskLevel === '6' ? writingSetsHsk6
      : writingHskLevel === '5' ? writingSetsHsk5
      : writingHskLevel === '4' ? writingSetsHsk4
      : writingHskLevel === '3' ? writingSetsHsk3
      : writingHskLevel === '2' ? writingSetsHsk2L2
      : writingSetsHsk2;
    prefetchHanzi(sets.map(s => [...s.chars][0]).filter(Boolean) as string[]);
  }, [activeTab, hskVersion, writingHskLevel, writingSets, writingSetsHsk2, writingSetsHsk2L2, writingSetsHsk3, writingSetsHsk4, writingSetsHsk5, writingSetsHsk6]);

  // Flashcard mode
  const [flashcardMode, setFlashcardMode] = useState<string>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(FLASHCARD_MODE_KEY) || 'zh-uz' : 'zh-uz';
    } catch {
      return 'zh-uz';
    }
  });
  const initialSubTab = searchParams.get('subtab');
  const [flashcardSubTab, setFlashcardSubTab] = useState<'lessons' | 'topics'>(initialSubTab === 'topics' ? 'topics' : 'lessons');
  // Only HSK 1-3 have flashcard decks; parseHskLevel makes the clamp explicit.
  const [flashcardHskLevel, setFlashcardHskLevel] = useState<'1' | '2' | '3'>(parseHskLevel(searchParams.get('flashhsk'), 3) as '1' | '2' | '3');

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

  const activeDialogues = dialogueHskLevel === '6' ? dialoguesHsk6 : dialogueHskLevel === '5' ? dialoguesHsk5 : dialogueHskLevel === '4' ? dialoguesHsk4 : dialogueHskLevel === '3' ? dialoguesHsk3 : dialogueHskLevel === '2' ? dialoguesHsk2 : dialogues;

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    activeDialogues.forEach((d) => { if (d.tag) tagSet.add(d.tag); });
    return Object.keys(TAGS).filter((t) => tagSet.has(t));
  }, [activeDialogues]);

  // Meta Pixel: debounced search tracking
  useEffect(() => {
    const q = (search || topicSearch || writingSearch || grammarSearch).trim();
    if (!q) return;
    const t = setTimeout(() => trackAll('Search', 'search', 'search', { search_string: q }), 800);
    return () => clearTimeout(t);
  }, [search, topicSearch, writingSearch, grammarSearch]);

  const filteredDialogues = useMemo(() => {
    let result = activeDialogues;
    if (showBookmarked) result = result.filter((d) => bookmarks.has(d.id));
    if (activeTag) result = result.filter((d) => d.tag === activeTag);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.pinyin.toLowerCase().includes(q) ||
      d.titleTranslation.toLowerCase().includes(q)
    );
    return result;
  }, [search, activeDialogues, activeTag, showBookmarked, bookmarks]);

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
            {/* Mobile-only: the active tab's Chinese label, centered between
                logo and menu so the slim hero isn't empty. Desktop shows the
                full hero character in .dr-hero__body instead. */}
            <span className="lp__hero-mobile-title" aria-hidden="true">- {
              activeTab === 'dialogues' ? '对话' :
              activeTab === 'writing' ? '写字' :
              activeTab === 'flashcards' ? '词卡' :
              activeTab === 'karaoke' ? 'KTV' :
              activeTab === 'grammar' ? '语法' :
              '测验'
            } -</span>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <h1 className="sr-only">{({ uz: 'Xitoy tili — HSK 1 darslari, dialoglar va mashqlar', ru: 'Китайский язык — уроки HSK 1, диалоги и упражнения', en: 'Chinese — HSK 1 lessons, dialogues and exercises' } as Record<string, string>)[language]}</h1>
            <div className="dr-hero__level">HSK {
              activeTab === 'dialogues' ? dialogueHskLevel :
              activeTab === 'flashcards' ? flashcardHskLevel :
              activeTab === 'writing' ? (hskVersion === '2.0' ? writingHskLevel : '1') :
              '1'
            }</div>
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
              aria-pressed={activeTab === tab.id}
              aria-label={language === 'en' && tab.label_en ? tab.label_en : language === 'ru' && tab.label_ru ? tab.label_ru : tab.label}
            >
              <span className="lp__tab-icon" aria-hidden="true">{TAB_ICONS[tab.id]}</span>
              <span className="lp__tab-label">{language === 'en' && tab.label_en ? tab.label_en : language === 'ru' && tab.label_ru ? tab.label_ru : tab.label}</span>
            </button>
          ))}
          {/* Mobile-only menu (the hero — which holds the desktop menu — is
              hidden on mobile). */}
          <div className="lp__tabs-menu">
            <BannerMenu />
          </div>
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
              const hasContent = lv === 'HSK 1' || (activeTab === 'flashcards' && flashcardSubTab === 'lessons' && (lv === 'HSK 2' || lv === 'HSK 3')) || (activeTab === 'writing' && hskVersion === '2.0' && (lv === 'HSK 2' || lv === 'HSK 3' || lv === 'HSK 4' || lv === 'HSK 5' || lv === 'HSK 6')) || (activeTab === 'dialogues' && lv === 'HSK 2' && dialoguesHsk2.length > 0) || (activeTab === 'dialogues' && lv === 'HSK 3' && dialoguesHsk3.length > 0) || (activeTab === 'dialogues' && lv === 'HSK 4' && dialoguesHsk4.length > 0) || (activeTab === 'dialogues' && lv === 'HSK 5' && dialoguesHsk5.length > 0) || (activeTab === 'dialogues' && lv === 'HSK 6' && dialoguesHsk6.length > 0);
              const isActive = activeTab === 'flashcards'
                ? (flashcardSubTab === 'lessons' && ((lv === 'HSK 1' && flashcardHskLevel === '1') || (lv === 'HSK 2' && flashcardHskLevel === '2') || (lv === 'HSK 3' && flashcardHskLevel === '3')))
                : activeTab === 'writing' && hskVersion === '2.0'
                  ? (lv === 'HSK 1' && writingHskLevel === '1') || (lv === 'HSK 2' && writingHskLevel === '2') || (lv === 'HSK 3' && writingHskLevel === '3') || (lv === 'HSK 4' && writingHskLevel === '4') || (lv === 'HSK 5' && writingHskLevel === '5') || (lv === 'HSK 6' && writingHskLevel === '6')
                  : activeTab === 'dialogues'
                    ? (lv === 'HSK 1' && dialogueHskLevel === '1') || (lv === 'HSK 2' && dialogueHskLevel === '2') || (lv === 'HSK 3' && dialogueHskLevel === '3') || (lv === 'HSK 4' && dialogueHskLevel === '4') || (lv === 'HSK 5' && dialogueHskLevel === '5') || (lv === 'HSK 6' && dialogueHskLevel === '6')
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
                      if (activeTab === 'dialogues') {
                        setDialogueHskLevel(lv === 'HSK 6' ? '6' : lv === 'HSK 5' ? '5' : lv === 'HSK 4' ? '4' : lv === 'HSK 3' ? '3' : lv === 'HSK 2' ? '2' : '1');
                        setActiveTag(null);
                        setShowBookmarked(false);
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
                aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
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
                <Link key={d.id} href={`/chinese/hsk${dialogueHskLevel}/dialogues/${d.slug}`} prefetch={false} className="dialogue-card">
                  <span className="dialogue-card__deco" aria-hidden="true">{d.title.slice(0, 3)}</span>
                  <div className="dialogue-card__content">
                    <div className="dialogue-card__text">
                      <h3 className="dialogue-card__title">{d.title}</h3>
                      <p className="dialogue-card__pinyin">{d.pinyin}</p>
                      <p className="dialogue-card__translation">{language === 'ru' ? d.titleTranslation_ru : language === 'en' ? (d.titleTranslation_en || d.titleTranslation) : d.titleTranslation}</p>
                      {(() => {
                        // No star row until the user has actually attempted
                        // this item; gold for the earned count once they have.
                        const stars = getDialogueStars(d.id);
                        if (stars == null) return null;
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
                  {d.tag && TAGS[d.tag] && (
                    /* Defensive: only render the tag pill when TAGS knows
                       about it. Without the `TAGS[d.tag] &&` guard, a
                       dialogue with an unrecognised `tag` (e.g. a new
                       category authored in content but not yet added to
                       this dictionary) would throw "Cannot read properties
                       of undefined (reading '<lang>')" on the language
                       page render and break the entire dialogues tab. */
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
          // Toneless form so typing pinyin without tone marks still matches
          // (NFD decomposes the tone diacritic AND ü's diaeresis into
          // combining marks, which we strip — wǒ→wo, nǚ→nu).
          const wqToneless = wq.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const filteredSets = wq
            ? activeSets.filter((s) =>
                s.title.toLowerCase().includes(wq) ||
                s.title_ru.toLowerCase().includes(wq) ||
                s.chars.includes(wq) ||
                s.subtitle.toLowerCase().includes(wq) ||
                (!!s.pinyin && s.pinyin.includes(wqToneless))
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
                  aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
              placeholder={({ uz: 'Belgilarni qidirish...', ru: 'Поиск иероглифов...', en: 'Search characters...' } as Record<string, string>)[language]}
                  value={writingSearch}
                  onChange={(e) => setWritingSearch(e.target.value)}
                />
              </div>
              <div className="lp__writing-sets">
                {filteredSets.map((set) => {
                  const isEmpty = set.chars.length === 0;
                  // Title/subtitle are derived generically (same pattern as the
                  // flashcard cards below) rather than string-replacing the
                  // Russian fields — that hack left Russian text on every set
                  // whose title_ru wasn't literally "Набор N" (e.g. HSK 3-6
                  // sets where title_ru holds the char list).
                  const num = activeSets.indexOf(set) + 1;
                  const title = ({ uz: `${num}-to'plam`, ru: `Набор ${num}`, en: `Set ${num}` } as Record<string, string>)[language];
                  const sub = `${set.wordCount || 10} ${({ uz: "ta so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language]}`;
                  const inner = (
                    <>
                      <div className="lp__writing-card-deco" aria-hidden="true">{isEmpty ? '🔒' : set.chars.slice(0, 2)}</div>
                      <div className="lp__writing-card__title">{title}</div>
                      <div className="lp__writing-card__sub">{isEmpty ? ({ uz: 'Tez kunda', ru: 'Скоро', en: 'Coming soon' } as Record<string, string>)[language] : sub}</div>
                      {!isEmpty && (() => {
                        // No star row until attempted; gold for earned count.
                        const wStars = getWritingStars(set.id);
                        if (wStars == null) return null;
                        return (
                          <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                            {[1, 2, 3].map(n => (
                              <span key={n} style={{ fontSize: 28, color: n <= wStars ? '#f59e0b' : 'rgba(0,0,0,0.05)' }}>★</span>
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
                      aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
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
              aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
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
                  aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
              placeholder={({ uz: 'Grammatikani qidirish...', ru: 'Поиск грамматики...', en: 'Search grammar...' } as Record<string, string>)[language]}
                  value={grammarSearch}
                  onChange={(e) => setGrammarSearch(e.target.value)}
                />
              </div>
              <div className="home__lessons">
                {filteredGrammar.map((item, idx) => (
                  <Link key={item.char} href={item.active ? item.href : '#'} prefetch={false} className="grammar-card">
                    <span className="grammar-card__bg">{('ghost' in item && item.ghost) || item.char}</span>
                    <div className="grammar-card__top">
                      <p className="grammar-card__title">{item.char} {item.pinyin}</p>
                      {!item.active && <span className="grammar-card__badge">{({ uz: 'Tez kunda', ru: 'Скоро', en: 'Soon' } as Record<string, string>)[language]}</span>}
                    </div>
                    <p className="grammar-card__translation">{({ uz: item.translation, ru: item.translation_ru, en: item.translation_en } as Record<string, string>)[language]}</p>
                    {(() => {
                      // No star row until attempted; gold for earned count.
                      const slug = item.href.split('/').pop()!;
                      const stars = getGrammarStars(slug);
                      if (stars == null) return null;
                      return (
                        <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                          {[1, 2, 3].map(n => (
                            <span key={n} style={{ fontSize: 28, color: n <= stars ? '#f59e0b' : 'rgba(0,0,0,0.05)' }}>
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

      </section>

      {/* Logo moves to the footer on mobile (the hero is hidden there). */}
      <Link href="/" className="lp__footer-logo" aria-label="Blim">
        <Image src="/logo-red.svg" alt="Blim" width={72} height={25} />
      </Link>
      <PageFooter />
    </main>
  );
}
