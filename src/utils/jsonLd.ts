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
  ma: { char: '吗', pinyin: 'ma', en: 'question particle' },
  shei: { char: '谁', pinyin: 'shéi', en: 'who (question word)' },
  na: { char: '哪', pinyin: 'nǎ', en: 'which (question word)' },
  de: { char: '的', pinyin: 'de', en: 'possessive particle' },
  ne: { char: '呢', pinyin: 'ne', en: 'bounce-back question particle' },
  ji: { char: '几', pinyin: 'jǐ', en: 'how many (question word for quantity)' },
  shuzi: { char: '数字', pinyin: 'shùzì', en: 'numbers 1-99' },
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
