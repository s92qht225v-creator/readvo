/**
 * Shared Han-character normalization for comparing learner input against an
 * expected Chinese string (typed dictation, answer checks).
 *
 * `toSimplified` maps the common traditional forms a learner's IME might emit
 * to their simplified equivalents; `hanChars` strips everything that isn't a
 * Han character (spaces, punctuation, latin, digits) so comparison is purely
 * character-for-character.
 */

// Common Traditional → Simplified map. Mirrors the per-component maps in
// SpeakingMashq / DialogueRolePlay; kept here so typed dictation stays lenient
// without duplicating the table a third time.
const TRAD_TO_SIMP: Record<string, string> = {
  '麼': '么', '麽': '么', '誰': '谁', '嗎': '吗',
  '學': '学', '語': '语', '漢': '汉', '這': '这', '個': '个',
  '們': '们', '來': '来', '時': '时', '師': '师', '國': '国',
  '東': '东', '車': '车', '書': '书', '號': '号', '電': '电',
  '話': '话', '視': '视', '歡': '欢', '親': '亲', '愛': '爱',
  '為': '为', '對': '对', '問': '问', '題': '题', '從': '从',
  '開': '开', '關': '关', '錢': '钱', '買': '买', '賣': '卖',
  '見': '见', '層': '层', '長': '长', '兩': '两', '點': '点',
  '邊': '边', '過': '过', '還': '还', '說': '说', '讀': '读',
  '寫': '写', '聽': '听', '讓': '让', '覺': '觉', '進': '进',
  '會': '会', '後': '后', '幾': '几', '裡': '里',
};

const HAN_RE = /[㐀-鿿]/;

export function toSimplified(str: string): string {
  return str.split('').map((c) => TRAD_TO_SIMP[c] ?? c).join('');
}

/** Han characters of a string, in order, traditional forms simplified. */
export function hanChars(str: string): string[] {
  return Array.from(toSimplified(str)).filter((c) => HAN_RE.test(c));
}

/** Normalized Han-only string for equality comparison. */
export function normalizeHan(str: string): string {
  return hanChars(str).join('');
}
