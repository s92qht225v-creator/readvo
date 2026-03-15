const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function jsonLdScript(graph: Record<string, unknown>[]) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

// Grammar term data for DefinedTerm schema
export const GRAMMAR_TERMS: Record<string, { char: string; pinyin: string; en: string }> = {
  shenme: { char: '什么', pinyin: 'shénme', en: 'what (question word)' },
  shi: { char: '是', pinyin: 'shì', en: 'to be' },
  you: { char: '有', pinyin: 'yǒu', en: 'to have / there is' },
  zai: { char: '在', pinyin: 'zài', en: 'to be at / located' },
  de: { char: '的', pinyin: 'de', en: 'possessive particle' },
  bu: { char: '不', pinyin: 'bù', en: 'not / negation' },
  ma: { char: '吗', pinyin: 'ma', en: 'question particle' },
  shei: { char: '谁', pinyin: 'shéi', en: 'who (question word)' },
  na: { char: '哪', pinyin: 'nǎ', en: 'which (question word)' },
  ne: { char: '呢', pinyin: 'ne', en: 'continuation particle' },
  le: { char: '了', pinyin: 'le', en: 'completion particle' },
  ye: { char: '也', pinyin: 'yě', en: 'also / too' },
  dou: { char: '都', pinyin: 'dōu', en: 'all / both' },
  hen: { char: '很', pinyin: 'hěn', en: 'very' },
  xiang: { char: '想', pinyin: 'xiǎng', en: 'to want / to think' },
  hui: { char: '会', pinyin: 'huì', en: 'can / will (learned skill)' },
  neng: { char: '能', pinyin: 'néng', en: 'can (ability/possibility)' },
  mei: { char: '没', pinyin: 'méi', en: "did not / don't have" },
  ji: { char: '几', pinyin: 'jǐ', en: 'how many' },
  liangci: { char: '量词', pinyin: 'liàngcí', en: 'measure words' },
};

export function grammarTermJsonLd(slug: string, locale: string) {
  const term = GRAMMAR_TERMS[slug];
  if (!term) return null;
  return {
    '@type': 'DefinedTerm',
    name: `${term.char} (${term.pinyin})`,
    description: term.en,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'HSK 1 Grammar',
      url: `${siteUrl}/${locale}/chinese?tab=grammar`,
    },
    url: `${siteUrl}/${locale}/chinese/hsk1/grammar/${slug}`,
  };
}
