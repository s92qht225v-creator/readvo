export type HanziWord = {
  char: string; pinyin: string; uz: string; ru: string; strokes: number;
  radical?: string; radicalUz?: string; radicalRu?: string;
  ex?: string; expy?: string; exuz?: string; exru?: string;
};

export interface WritingSet {
  id: string;
  title: string;
  title_ru: string;
  subtitle: string;
  subtitle_ru: string;
  chars: string;
  words: HanziWord[];
}

export const WRITING_SETS: WritingSet[] = [
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

export function getWritingSet(setId: string): WritingSet | undefined {
  return WRITING_SETS.find((s) => s.id === setId);
}
