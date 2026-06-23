import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDialoguePreview, TEASER_LINES } from './dialoguePreview.ts';

const baseSentence = (id: string) => ({
  id, text_original: `text-${id}`, pinyin: `pinyin-${id}`,
  text_translation: `uz-${id}`, text_translation_ru: `ru-${id}`, speaker: 'A',
});

const resolved = (sentenceCount: number) => ({
  id: 'd1', title: 'T', pinyin: 'P', titleTranslation: 'tt', titleTranslation_ru: 'ttr',
  level: 1, image: 'http://img/x.jpg', description_uz: 'salom',
  sections: [{ id: 's', type: 'text', heading: '', subheading: '',
    sentences: Array.from({ length: sentenceCount }, (_, i) => baseSentence(String(i + 1))) }],
  vocab: [{ zh: '你好', py: 'nǐhǎo', uz: 'salom', ru: 'привет', en: 'hello' }],
}) as unknown as Parameters<typeof buildDialoguePreview>[0];

test('teaser takes the first TEASER_LINES sentences and counts the rest as hidden', () => {
  const p = buildDialoguePreview(resolved(8));
  assert.equal(p.teaser.length, TEASER_LINES);
  assert.equal(p.hiddenCount, 8 - TEASER_LINES);
  assert.equal(p.teaser[0].id, '1');
});

test('teaser never exceeds the available sentences; hiddenCount is zero', () => {
  const p = buildDialoguePreview(resolved(2));
  assert.equal(p.teaser.length, 2);
  assert.equal(p.hiddenCount, 0);
});

test('passes image, description and vocab through unchanged', () => {
  const p = buildDialoguePreview(resolved(5));
  assert.equal(p.image, 'http://img/x.jpg');
  assert.equal(p.description_uz, 'salom');
  assert.equal(p.vocab.length, 1);
  assert.equal(p.vocab[0].zh, '你好');
});

test('skips a leading greeting exchange so the teaser shows the real lines', () => {
  const withGreetings = {
    id: 'd', title: '', pinyin: '', titleTranslation: '', titleTranslation_ru: '', level: 1,
    sections: [{ id: 's', type: 'text', heading: '', subheading: '', sentences: [
      { id: '1', text_original: '你好！', pinyin: '', text_translation: '', text_translation_ru: '', speaker: 'A' },
      { id: '2', text_original: '你好！', pinyin: '', text_translation: '', text_translation_ru: '', speaker: 'B' },
      { id: '3', text_original: '你叫什么名字？', pinyin: '', text_translation: '', text_translation_ru: '', speaker: 'A' },
      { id: '4', text_original: '我叫李明。', pinyin: '', text_translation: '', text_translation_ru: '', speaker: 'B' },
    ] }],
    vocab: [],
  } as unknown as Parameters<typeof buildDialoguePreview>[0];
  const p = buildDialoguePreview(withGreetings);
  assert.deepEqual(p.teaser.map((s) => s.text_original), ['你叫什么名字？', '我叫李明。']);
});

test('keeps greetings when too few non-greeting lines remain', () => {
  const allGreetings = {
    id: 'd', title: '', pinyin: '', titleTranslation: '', titleTranslation_ru: '', level: 1,
    sections: [{ id: 's', type: 'text', heading: '', subheading: '', sentences: [
      { id: '1', text_original: '你好！', pinyin: '', text_translation: '', text_translation_ru: '', speaker: 'A' },
      { id: '2', text_original: '你好！', pinyin: '', text_translation: '', text_translation_ru: '', speaker: 'B' },
    ] }],
    vocab: [],
  } as unknown as Parameters<typeof buildDialoguePreview>[0];
  const p = buildDialoguePreview(allGreetings);
  assert.equal(p.teaser.length, 2);
  assert.equal(p.teaser[0].text_original, '你好！');
});

test('handles a dialogue with no vocab and no sections gracefully', () => {
  const empty = { id: 'd', title: '', pinyin: '', titleTranslation: '', titleTranslation_ru: '', level: 1, sections: [] } as unknown as Parameters<typeof buildDialoguePreview>[0];
  const p = buildDialoguePreview(empty);
  assert.deepEqual(p.teaser, []);
  assert.equal(p.hiddenCount, 0);
  assert.deepEqual(p.vocab, []);
});
