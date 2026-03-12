/**
 * Services exports
 */

export { getLessonsWithInfo } from './content';

export type { LessonInfo } from './content';

export { loadFlashcardDeck } from './flashcards';

export { loadDialoguesForBook, loadDialogue } from './dialogues';
export type { DialogueInfo, DialoguePage } from './dialogues';

export { loadKaraokeSong, loadKaraokeSongs } from './karaoke';
export type { KaraokeSong, KaraokeLine, KaraokeChar } from './karaoke';

export {
  getEnglishContentManifest,
  loadEnglishPage,
  getEnglishPageNavigation,
  getEnglishLessonsWithInfo,
} from './english-content';
