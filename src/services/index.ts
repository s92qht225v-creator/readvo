/**
 * Services exports
 */

export { getLessonsWithInfo } from './content';

export type { LessonInfo } from './content';

export { loadFlashcardDeck } from './flashcards';

export { loadDialoguesForBook, loadDialogue, getDialogue, resolveDialogueVocab } from './dialogues';
export type { DialogueInfo, DialoguePage, DialoguePageResolved } from './dialogues';

export { loadKaraokeSong, loadKaraokeSongs } from './karaoke';
export type { KaraokeSong, KaraokeLine, KaraokeChar } from './karaoke';

export { normPy, getGlossary, resolveVocab } from './glossary';
export type { GlossaryEntry, VocabRef, VocabItem } from './glossary';

