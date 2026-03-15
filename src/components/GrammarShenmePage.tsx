'use client';

function playGrammarAudio(zh: string) {
  const audio = new Audio(`/audio/hsk1/grammar/${encodeURIComponent(zh)}.mp3`);
  audio.play().catch(() => {});
}

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { SpeakingMashq } from './SpeakingMashq';

const C_SUB  = '#3b82f6'; // Subject / Ega
const C_VERB = '#16a34a'; // Verb / Fe'l
const C_WHAT = '#dc2626'; // 什么
const C_PUNC = '#888';    // Punctuation

const speakingQuestionsData = [
  { uz: 'Bu nima?', ru: 'Что это?', en: 'What is this?', zh: '这是什么？', pinyin: 'Zhè shì shénme?' },
  { uz: 'Ana u nima?', ru: 'Что то?', en: 'What is that?', zh: '那是什么？', pinyin: 'Nà shì shénme?' },
  { uz: 'Nima yeyasan?', ru: 'Что ты ешь?', en: 'What are you eating?', zh: '你吃什么？', pinyin: 'Nǐ chī shénme?' },
  { uz: 'Nima ichasiz?', ru: 'Что ты пьёшь?', en: 'What are you drinking?', zh: '你喝什么？', pinyin: 'Nǐ hē shénme?' },
  { uz: "Nima o'rganaysan?", ru: 'Что ты изучаешь?', en: 'What are you studying?', zh: '你学什么？', pinyin: 'Nǐ xué shénme?' },
  { uz: 'Ismingiz nima?', ru: 'Как вас зовут?', en: 'What is your name?', zh: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?' },
];

const sections = [
  { id: 'intro',    uz: 'Asosiy',   ru: 'Основное', en: 'Overview'  },
  { id: 'usage',    uz: 'Shablon',  ru: 'Шаблоны',  en: 'Patterns'  },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры',  en: 'Examples'  },
  { id: 'dialog',   uz: 'Dialog',   ru: 'Диалог',   en: 'Dialogue'  },
  { id: 'quiz',     uz: 'Mashq',    ru: 'Тест',     en: 'Quiz'      },
];

type Part = { text: string; color: string };

const examples: {
  parts: Part[];
  pinyin: string;
  uz: string; ru: string; en: string;
  note_uz: string; note_ru: string; note_en: string;
}[] = [
  {
    parts: [{ text:'你',color:C_SUB },{ text:'吃',color:C_VERB },{ text:'什么',color:C_WHAT },{ text:'？',color:C_PUNC }],
    pinyin:'Nǐ chī shénme?', uz:"Nima yeyasan?", ru:"Что ты ешь?", en:"What are you eating?",
    note_uz:'吃 (chī) = yemoq', note_ru:'吃 (chī) = есть (кушать)', note_en:'吃 (chī) = to eat',
  },
  {
    parts: [{ text:'你',color:C_SUB },{ text:'喝',color:C_VERB },{ text:'什么',color:C_WHAT },{ text:'？',color:C_PUNC }],
    pinyin:'Nǐ hē shénme?', uz:"Nima ichasiz?", ru:"Что ты пьёшь?", en:"What are you drinking?",
    note_uz:'喝 (hē) = ichmoq', note_ru:'喝 (hē) = пить', note_en:'喝 (hē) = to drink',
  },
  {
    parts: [{ text:'你',color:C_SUB },{ text:'买',color:C_VERB },{ text:'什么',color:C_WHAT },{ text:'？',color:C_PUNC }],
    pinyin:'Nǐ mǎi shénme?', uz:"Nima sotib olayapsiz?", ru:"Что ты покупаешь?", en:"What are you buying?",
    note_uz:'买 (mǎi) = sotib olmoq', note_ru:'买 (mǎi) = покупать', note_en:'买 (mǎi) = to buy',
  },
  {
    parts: [{ text:'你',color:C_SUB },{ text:'学',color:C_VERB },{ text:'什么',color:C_WHAT },{ text:'？',color:C_PUNC }],
    pinyin:"Nǐ xué shénme?", uz:"Nima o'qiyasan?", ru:"Что ты изучаешь?", en:"What are you studying?",
    note_uz:"学 (xué) = o'qimoq, o'rganmoq", note_ru:"学 (xué) = изучать", note_en:"学 (xué) = to study, to learn",
  },
  {
    parts: [{ text:'这',color:C_SUB },{ text:'是',color:C_VERB },{ text:'什么',color:C_WHAT },{ text:'？',color:C_PUNC }],
    pinyin:'Zhè shì shénme?', uz:"Bu nima?", ru:"Что это?", en:"What is this?",
    note_uz:'这 (zhè) = bu', note_ru:'这 (zhè) = это', note_en:'这 (zhè) = this',
  },
  {
    parts: [{ text:'你叫',color:C_SUB },{ text:'什么',color:C_WHAT },{ text:'名字',color:C_VERB },{ text:'？',color:C_PUNC }],
    pinyin:"Nǐ jiào shénme míngzi?", uz:"Ismingiz nima?", ru:"Как вас зовут?", en:"What is your name?",
    note_uz:"叫 (jiào) = atalmoq, 名字 (míngzi) = ism", note_ru:"叫 (jiào) = звать, 名字 (míngzi) = имя", note_en:"叫 (jiào) = to be called, 名字 (míngzi) = name",
  },
  {
    parts: [{ text:'你',color:C_SUB },{ text:'做',color:C_VERB },{ text:'什么',color:C_WHAT },{ text:'？',color:C_PUNC }],
    pinyin:"Nǐ zuò shénme?", uz:"Nima qilayapsiz?", ru:"Что ты делаешь?", en:"What are you doing?",
    note_uz:"做 (zuò) = qilmoq", note_ru:"做 (zuò) = делать", note_en:"做 (zuò) = to do",
  },
  {
    parts: [{ text:'这是',color:C_SUB },{ text:'什么',color:C_WHAT },{ text:'颜色',color:C_VERB },{ text:'？',color:C_PUNC }],
    pinyin:"Zhè shì shénme yánsè?", uz:"Bu qanday rang?", ru:"Какой это цвет?", en:"What color is this?",
    note_uz:"颜色 (yánsè) = rang", note_ru:"颜色 (yánsè) = цвет", note_en:"颜色 (yánsè) = color",
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'吃',color:C_VERB},{text:'什么',color:C_WHAT},{text:'？',color:C_PUNC}], py:'Nǐ chī shénme?',  uz:"Nima yeyasan?",       ru:"Что ты ешь?",          en:"What are you eating?" },
  { parts:[{text:'你',color:C_SUB},{text:'喝',color:C_VERB},{text:'什么',color:C_WHAT},{text:'？',color:C_PUNC}], py:'Nǐ hē shénme?',   uz:"Nima ichasiz?",       ru:"Что ты пьёшь?",        en:"What are you drinking?" },
  { parts:[{text:'你',color:C_SUB},{text:'买',color:C_VERB},{text:'什么',color:C_WHAT},{text:'？',color:C_PUNC}], py:'Nǐ mǎi shénme?',  uz:"Nima sotib olayapsiz?",ru:"Что ты покупаешь?",  en:"What are you buying?" },
  { parts:[{text:'你',color:C_SUB},{text:'学',color:C_VERB},{text:'什么',color:C_WHAT},{text:'？',color:C_PUNC}], py:"Nǐ xué shénme?",  uz:"Nima o'qiyasan?",     ru:"Что ты изучаешь?",     en:"What are you studying?" },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'什么',color:C_WHAT},{text:'名字',color:C_VERB},{text:'？',color:C_PUNC}], py:"shénme míngzi?",  uz:"Qanday ism?",  ru:"Какое имя?",     en:"What name?" },
  { parts:[{text:'什么',color:C_WHAT},{text:'工作',color:C_VERB},{text:'？',color:C_PUNC}], py:"shénme gōngzuò?", uz:"Qanday ish?",  ru:"Какая работа?",  en:"What job?" },
];

const pattern3Rows: PatternRow[] = [
  { parts:[{text:'这',color:C_SUB},{text:'是',color:C_VERB},{text:'什么',color:C_WHAT},{text:'？',color:C_PUNC}], py:'Zhè shì shénme?', uz:"Bu nima?", ru:"Что это?",  en:"What is this?" },
  { parts:[{text:'那',color:C_SUB},{text:'是',color:C_VERB},{text:'什么',color:C_WHAT},{text:'？',color:C_PUNC}], py:'Nà shì shénme?',  uz:"Ana u nima?",  ru:"Что то?",   en:"What is that?" },
];

const dialog1 = [
  { s:'A', zh:'你好！你叫什么名字？',     py:'Nǐ hǎo! Nǐ jiào shénme míngzi?',    uz:'Salom! Ismingiz nima?',               ru:'Привет! Как вас зовут?',         en:'Hi! What is your name?' },
  { s:'B', zh:'我叫王芳。你呢？',          py:'Wǒ jiào Wáng Fāng. Nǐ ne?',          uz:'Mening ismim Van Fan. Sizchi?',       ru:'Меня зовут Ван Фан. А вы?',      en:'My name is Wang Fang. And you?' },
  { s:'A', zh:'我叫李明。你学什么？',      py:'Wǒ jiào Lǐ Míng. Nǐ xué shénme?',   uz:"Men Li Min. Nima o'qiyasan?",         ru:'Меня зовут Ли Мин. Что изучаешь?',en:'I\'m Li Ming. What are you studying?' },
  { s:'B', zh:'我学汉语。',                py:'Wǒ xué Hànyǔ.',                       uz:"Men xitoy tilini o'qiyapman.",        ru:'Я изучаю китайский язык.',       en:"I'm studying Chinese." },
];

const dialog2 = [
  { s:'A', zh:'你吃什么？',       py:'Nǐ chī shénme?',     uz:'Nima yeyasan?',            ru:'Что ты ешь?',           en:'What are you eating?' },
  { s:'B', zh:'我吃面条。',       py:'Wǒ chī miàntiáo.',   uz:"Men lag'mon yeyman.",       ru:'Я ем лапшу.',           en:"I'm eating noodles." },
  { s:'A', zh:'你喝什么？',       py:'Nǐ hē shénme?',      uz:'Nima ichasiz?',             ru:'Что ты пьёшь?',         en:"What are you drinking?" },
  { s:'B', zh:'我喝茶。你呢？',   py:'Wǒ hē chá. Nǐ ne?',  uz:'Men choy. Sizchi?',         ru:'Я пью чай. А ты?',      en:"I'm drinking tea. And you?" },
  { s:'A', zh:'我喝水。',         py:'Wǒ hē shuǐ.',         uz:'Men suv ichaman.',          ru:'Я пью воду.',           en:"I'm drinking water." },
];

const quizQuestions = [
  {
    q_uz:'"Nima yeyasan?" xitoycha qanday?',
    q_ru:'Как сказать «Что ты ешь?» по-китайски?',
    q_en:'How do you say "What are you eating?" in Chinese?',
    options: ['你吃什么？', '什么你吃？', '你什么吃？', '吃什么你？'],
    correct: 0,
  },
  {
    q_uz:'"这是什么？" nima degani?',
    q_ru:'Что означает «这是什么？»?',
    q_en:'What does "这是什么？" mean?',
    options_uz: ['Bu qayerda?', 'Bu kim?', 'Bu nima?', 'Bu qanday?'],
    options_ru: ['Где это?', 'Кто это?', 'Что это?', 'Какой это?'],
    options_en: ['Where is this?', 'Who is this?', 'What is this?', 'What kind is this?'],
    correct: 2,
  },
  {
    q_uz:'"Ismingiz nima?" qanday aytiladi?',
    q_ru:'Как сказать «Как вас зовут?» по-китайски?',
    q_en:'How do you say "What is your name?" in Chinese?',
    options: ['你叫什么名字？', '什么你叫名字？', '你名字叫什么？', '你叫名字什么？'],
    correct: 0,
  },
  {
    q_uz:'什么 qanday o\'qiladi?',
    q_ru:'Как читается 什么?',
    q_en:'How is 什么 pronounced?',
    options: ['shénme', 'shìme', 'zhénme', 'nǐme'],
    correct: 0,
  },
  {
    q_uz:'Qaysi gap to\'g\'ri?',
    q_ru:'Какое предложение правильное?',
    q_en:'Which sentence is correct?',
    options: ['什么你喝？', '你喝什么？', '你什么喝？', '你喝吗什么？'],
    correct: 1,
  },
  {
    q_uz:'"Nima sotib olayapsiz?" qanday?',
    q_ru:'Как сказать «Что ты покупаешь?» по-китайски?',
    q_en:'How do you say "What are you buying?" in Chinese?',
    options: ['你什么买？', '买什么你？', '你买什么？', '什么买你？'],
    correct: 2,
  },
];

function ColorParts({ parts }: { parts: Part[] }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', gap:2 }}>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.color, fontWeight: p.color === C_PUNC ? 400 : 600 }}>
          {p.text}
        </span>
      ))}
    </span>
  );
}

export function GrammarShenmePage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();

  const speakingQuestions = speakingQuestionsData.map(q => ({
    uz: language === 'ru' ? q.ru : language === 'en' ? q.en : q.uz,
    zh: q.zh,
    pinyin: q.pinyin,
  }));
  const [activeTab, setActiveTab] = useState('intro');
  const [expandedEx, setExpandedEx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  if (isLoading) return <div className="loading-spinner" />;

  const pick = (qi: number, ai: number) => {
    if (!showResults) setAnswers(p => ({ ...p, [qi]: ai }));
  };
  const score       = Object.entries(answers).filter(([qi, ai]) => quizQuestions[+qi].correct === +ai).length;
  const allAnswered = Object.keys(answers).length === quizQuestions.length;

  const t = (uz: string, ru: string, en: string) =>
    ({ uz, ru, en } as Record<string, string>)[language] ?? uz;

  return (
    <div className="grammar-page">
      {/* Hero */}
      <div className="grammar-page__hero">
        <div className="grammar-page__hero-bg">什么</div>
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href="/chinese?tab=grammar" className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
          </div>
        </div>
        <div className="grammar-page__hero-body">
          <div className="grammar-page__hero-label">
            HSK 1 · {t('Grammatika','Грамматика','Grammar')}
          </div>
          <h1 className="grammar-page__hero-char">什么</h1>
          <div className="grammar-page__hero-pinyin">shénme</div>
          <div className="grammar-page__hero-meaning">
            — {t('nima?','что?','what?')} —
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grammar-page__tabs">
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveTab(s.id)}
            className={`grammar-page__tab ${activeTab === s.id ? 'grammar-page__tab--active' : ''}`}
          >
            {t(s.uz, s.ru, s.en)}
          </button>
        ))}
      </div>

      <div className="grammar-page__content">

        {/* ── ASOSIY ── */}
        {activeTab === 'intro' && (
          <>
            {/* Character info */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Ieroglif','Иероглиф','Character')}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">什么</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">shénme</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Tonlar','Тоны','Tones')}</span>
                    <span className="grammar-block__tone">
                      {t('什 2-ton · 么 yengil ton','什 2-й тон · 么 нейтральный тон','什 2nd tone · 么 neutral tone')}
                    </span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('nima','что','what')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">
                      {t('什 — 4 ta · 么 — 3 ta','什 — 4 · 么 — 3','什 — 4 · 么 — 3')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* What it means */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('什么 nima?','什么 — что это?','What is 什么?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color: C_WHAT }}>什么</strong>
                {' '}={' '}
                <strong>{t('nima','что','what')}</strong>
                <br />
                {t('Savol berish uchun ishlatiladi.','Используется для вопросов.','Used to ask questions.')}
              </p>
            </div>

            {/* How it works — word order */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Qanday ishlaydi?','Как это работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "Xitoy tilida so'z tartibi o'zgarmaydi. Faqat javob bo'ladigan so'z o'rniga 什么 qo'yiladi:",
                  "В китайском порядок слов не меняется. Просто замените слово-ответ на 什么:",
                  "In Chinese, word order stays the same. Just replace the answer word with 什么:",
                )}
              </p>
              <div className="grammar-block__usage-item">
                                <div className="grammar-block__usage-py">Wǒ chī miàntiáo.</div>
                <div className="grammar-block__usage-zh">
                  我吃&nbsp;
                  <span style={{ background:'#dcfce7', borderRadius:4, padding:'2px 8px', color:C_VERB, fontWeight:700 }}>面条</span>。
                </div>
                <div className="grammar-block__usage-tr">
                  {t("Men lag'mon yeyapman.", "Я ем лапшу.", "I am eating noodles.")}
                </div>
              </div>
              <div style={{ textAlign:'center', color:'#bbb', fontSize:18, margin:'4px 0' }}>↕</div>
              <div className="grammar-block__usage-item">
                                <div className="grammar-block__usage-py">Nǐ chī shénme?</div>
                <div className="grammar-block__usage-zh">
                  你吃&nbsp;<span className="grammar-block__highlight">什么</span>？
                </div>
                <div className="grammar-block__usage-tr">
                  {t("Sen nima yeyapsan?", "Что ты ешь?", "What are you eating?")}
                </div>
              </div>
              <p className="grammar-block__tip-note">
                💡 {t(
                  "«面条» o'rniga «什么» qo'yildi — boshqa hech narsa o'zgarmadi.",
                  "«面条» заменено на «什么» — больше ничего не изменилось.",
                  "«面条» was replaced with «什么» — nothing else changed.",
                )}
              </p>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color: C_SUB,  uz:"Ega (kim?)",            ru:"Подлежащее (кто?)", en:"Subject (who?)" },
                  { color: C_VERB, uz:"Fe'l (nima qiladi?)",   ru:"Глагол",            en:"Verb" },
                  { color: C_WHAT, uz:"什么 (nima?)",           ru:"什么 (что?)",        en:"什么 (what?)" },
                ] as { color: string; uz: string; ru: string; en: string }[]).map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'#f5f5f8', borderRadius:6, padding:'5px 10px' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:r.color, flexShrink:0 }} />
                    <span style={{ fontSize:11, color:'#555' }}>{t(r.uz, r.ru, r.en)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SHABLON ── */}
        {activeTab === 'usage' && (
          <>
            {/* Pattern 1 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('1-shablon — Nima qilasiz?','Шаблон 1 — Что делаешь?','Pattern 1 — What are you doing?')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Sen','Вы','You')}</span>
                {' + '}
                <span style={{ color:C_VERB, fontWeight:700 }}>{t("Fe'l","Глагол","Verb")}</span>
                {' + '}
                <span className="grammar-block__formula-verb">什么</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t('Nimani yeydi / ichadi / sotib oladi…','Что ест / пьёт / покупает…','What eats / drinks / buys…')}
              </p>
              {pattern1Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Pattern 2 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — Qanday … ?','Шаблон 2 — Какой … ?','Pattern 2 — What kind of … ?')}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-verb">什么</span>
                {' + '}
                <span style={{ color:C_VERB, fontWeight:700 }}>{t('Ot','Существительное','Noun')}</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t('什么 + ot = qanday … ?','什么 + сущ. = какой … ?','什么 + noun = what kind of … ?')}
              </p>
              {pattern2Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  '2-shablon odatda to\'liq gap ichida keladi: 你叫什么名字？ / 这是什么颜色？',
                  '2-й шаблон обычно встречается в полном предложении: 你叫什么名字？ / 这是什么颜色？',
                  'Pattern 2 usually appears inside a full sentence: 你叫什么名字？ / 这是什么颜色？',
                )}
              </p>
            </div>

            {/* Pattern 3 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('3-shablon — Bu nima?','Шаблон 3 — Что это?','Pattern 3 — What is this?')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>这 / 那</span>
                {' + '}
                <span className="grammar-block__formula-verb">是</span>
                {' + '}
                <span className="grammar-block__formula-verb">什么</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t('Narsa nomini so\'rash','Спросить название предмета','Ask for the name of something')}
              </p>
              {pattern3Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MISOLLAR ── */}
        {activeTab === 'examples' && (
          <div className="grammar-block">
            <div className="grammar-block__label">{t('Namuna gaplar','Примеры предложений','Example Sentences')}</div>
            {examples.map((ex, i) => (
              <button
                key={i}
                type="button"
                className={`grammar-block__example ${expandedEx === i ? 'grammar-block__example--open' : ''}`}
                onClick={() => setExpandedEx(expandedEx === i ? null : i)}
              >
                <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{flex:1}}><ColorParts parts={ex.parts} /></span>
                  <span role="button" tabIndex={0} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'none',border:'none',padding:'2px 6px',cursor:'pointer',fontSize:15,color:'#3b82f6',flexShrink:0}} aria-label="Play">▶</span>
                </div>
                <div className="grammar-block__example-py">{ex.pinyin}</div>
                <div className="grammar-block__example-tr">{t(ex.uz, ex.ru, ex.en)}</div>
                {expandedEx === i && (
                  <div className="grammar-block__example-note">
                    💡 {t(ex.note_uz, ex.note_ru, ex.note_en)}
                  </div>
                )}
              </button>
            ))}
            <p className="grammar-block__hint">
              {t("Bosing — izoh ko'rinadi", 'Нажмите — увидите пояснение', 'Tap to see explanation')}
            </p>
          </div>
        )}

        {/* ── DIALOG ── */}
        {activeTab === 'dialog' && (
          <>
            {/* Dialog 1 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Dialog 1 — Tanishish','Диалог 1 — Знакомство','Dialogue 1 — Introductions')}</div>
              {dialog1.map((line, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div style={{display:'flex',gap:6,alignItems:'flex-start'}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_SUB:C_WHAT,flexShrink:0,paddingTop:3}}>{line.s}:</span>
                    <div style={{flex:1}}>
                      <div className="grammar-block__usage-py">{line.py}</div>
                      <div className="grammar-block__usage-zh">{line.zh}</div>
                      <div className="grammar-block__usage-tr">{t(line.uz, line.ru, line.en)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dialog 2 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Dialog 2 — Ovqat','Диалог 2 — Еда','Dialogue 2 — Food')}</div>
              {dialog2.map((line, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div style={{display:'flex',gap:6,alignItems:'flex-start'}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_SUB:C_WHAT,flexShrink:0,paddingTop:3}}>{line.s}:</span>
                    <div style={{flex:1}}>
                      <div className="grammar-block__usage-py">{line.py}</div>
                      <div className="grammar-block__usage-zh">{line.zh}</div>
                      <div className="grammar-block__usage-tr">{t(line.uz, line.ru, line.en)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Word order warning */}
            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{t("So'z tartibi eslatmasi",'Порядок слов','Word Order Reminder')}</div>
              <p className="grammar-block__tip-text">
                ⚠️ {t(
                  "什么 ni gap boshiga qo'ymang:",
                  "Не ставьте 什么 в начало предложения:",
                  "Do not put 什么 at the beginning of the sentence:",
                )}
              </p>
              <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', marginTop:6 }}>
                <span style={{ textDecoration:'line-through', color:'#ef4444', fontSize:16 }}>什么你喝？</span>
                <span style={{ color:'#16a34a', fontWeight:700, fontSize:16 }}>✓ 你喝什么？</span>
              </div>
            </div>
          </>
        )}

        {/* ── MASHQ ── */}
        {activeTab === 'quiz' && (
          <SpeakingMashq
            language={language}
            questions={speakingQuestions}
            accentColor="#dc2626"
            accentBg="#fee2e2"
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
