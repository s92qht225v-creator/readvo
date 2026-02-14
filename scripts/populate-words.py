#!/usr/bin/env python3
"""
Validate word-level data for story JSON files.

Usage:
  python3 scripts/populate-words.py validate content/stories/hsk1/story1.json
  python3 scripts/populate-words.py validate-all

Rules for lesson number (`l`) assignment:
  1. The EXACT word (same characters) must exist in the flashcard deck
  2. The word's meaning in the story must match its flashcard meaning
  3. If either condition fails → no `l` field

  No compound inference, no component fallback, no transparent compounds.

  Examples:
    猫 → in deck as L5 "cat" → l: 5  ✓
    小猫 → NOT in deck → no l  ✓
    贵 → in deck as L1 (你贵姓) but used as "expensive" (L10 meaning) → l: 10 override
    可是 → NOT in deck → no l  ✓

HSK level (`h`): Always 1 for HSK 1 stories. Omit for proper nouns.
"""

import json
import sys
import os


# Contextual meaning overrides: word is in deck but story uses a different meaning.
# Map of (word, story_lesson) pairs that are intentional overrides.
# The validator treats these as INFO, not errors.
CONTEXTUAL_OVERRIDES = {
    '贵': 10,  # Deck has L1 (你贵姓 honorific), story uses "expensive" (L10)
}


def load_flashcard_deck(deck_path: str) -> dict:
    """Load the flashcard deck and build a lookup by text_original."""
    with open(deck_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    lookup = {}
    for word in data['words']:
        text = word['text_original']
        lookup[text] = {
            'lesson': word.get('lesson'),
            'pinyin': word.get('pinyin', ''),
            'translation': word.get('text_translation', ''),
            'translation_ru': word.get('text_translation_ru', ''),
        }
    return lookup


def validate_words(story_path: str, deck_path: str) -> bool:
    """Validate existing words data against the flashcard deck rules."""
    deck = load_flashcard_deck(deck_path)

    with open(story_path, 'r', encoding='utf-8') as f:
        story = json.load(f)

    issues = []

    for section in story.get('sections', []):
        for sentence in section.get('sentences', []):
            sid = sentence.get('id', '?')
            text = sentence.get('text_original', '')

            for word in sentence.get('words', []):
                start, end = word['i']
                chars = text[start:end]
                has_l = 'l' in word

                if has_l:
                    if chars in deck:
                        deck_lesson = deck[chars]['lesson']
                        if word['l'] != deck_lesson:
                            # Check if this is a known contextual override
                            if chars in CONTEXTUAL_OVERRIDES and word['l'] == CONTEXTUAL_OVERRIDES[chars]:
                                print(f"  INFO {sid}: '{chars}' l={word['l']} "
                                      f"(deck={deck_lesson}) — contextual override")
                            else:
                                issues.append(
                                    f"  {sid}: '{chars}' has l={word['l']} "
                                    f"but deck says {deck_lesson}"
                                )
                    else:
                        issues.append(
                            f"  {sid}: '{chars}' has l={word['l']} but NOT in deck"
                        )

    if issues:
        print(f"\nIssues found in {story_path}:")
        for issue in issues:
            print(issue)
        return False
    else:
        print(f"OK: {story_path}")
        return True


def find_project_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_deck_path(story_path: str) -> str:
    project_root = find_project_root()
    parts = story_path.replace('\\', '/').split('/')
    book_id = 'hsk1'
    for i, part in enumerate(parts):
        if part == 'stories' and i + 1 < len(parts):
            book_id = parts[i + 1]
            break
    return os.path.join(project_root, 'content', 'flashcards', f'{book_id}.json')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    command = sys.argv[1]

    if command == 'validate':
        if len(sys.argv) < 3:
            print("Usage: python3 scripts/populate-words.py validate <story.json>")
            sys.exit(1)
        story_path = sys.argv[2]
        deck_path = get_deck_path(story_path)
        ok = validate_words(story_path, deck_path)
        sys.exit(0 if ok else 1)

    elif command == 'validate-all':
        project_root = find_project_root()
        stories_dir = os.path.join(project_root, 'content', 'stories')
        all_ok = True
        for book in sorted(os.listdir(stories_dir)):
            book_dir = os.path.join(stories_dir, book)
            if not os.path.isdir(book_dir):
                continue
            deck_path = os.path.join(project_root, 'content', 'flashcards', f'{book}.json')
            if not os.path.exists(deck_path):
                print(f"SKIP: No deck for {book}")
                continue
            for story_file in sorted(os.listdir(book_dir)):
                if not story_file.endswith('.json'):
                    continue
                story_path = os.path.join(book_dir, story_file)
                if not validate_words(story_path, deck_path):
                    all_ok = False
        sys.exit(0 if all_ok else 1)

    elif command == 'help':
        print(__doc__)

    else:
        story_path = command
        if os.path.exists(story_path):
            deck_path = get_deck_path(story_path)
            validate_words(story_path, deck_path)
        else:
            print(f"File not found: {story_path}")
            sys.exit(1)
