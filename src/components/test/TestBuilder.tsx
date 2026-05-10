'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { QuestionRenderer } from './QuestionRenderer';
import { QuestionMediaLayout } from './QuestionMediaBlock';
import { SettingsPanel } from './SettingsPanel';
import { PaywallNotice } from './PaywallNotice';
import { TestLink } from './TestLink';
import { ResponsesTable } from './ResponsesTable';
import { AnswerKeyModal } from './AnswerKeyModal';
import type { BuilderQuestion } from './builderTypes';
import { typePalette } from './questionTypeMeta';
import { authHeaders } from '@/lib/test/clientFetch';
import { navigateToTestHref } from '@/lib/test/paths';
import { publicOptionId } from '@/lib/test/sanitize';
import { DEFAULT_TEST_THEME, normalizeTestTheme, testThemeCssVars } from '@/lib/test/theme';
import type {
  Test, TestQuestion, QuestionType, QuestionOptions,
  MultipleChoiceOptions, ShortTextOptions, PictureChoiceOptions,
  MatchOptions, OrderingOptions, FillBlanksOptions,
  LongAnswerOptions, NumberOptions, DropdownOptions, CheckboxOptions,
  OpinionScaleOptions, RatingOptions,
  PublicQuestion, TestScreenConfig,
  TestThemeConfig,
} from '@/lib/test/types';

let cidCounter = 0;
const newClientId = () => `q-${Date.now()}-${cidCounter++}`;

function testBuilderTab(tab: string | null): 'create' | 'share' | 'results' {
  return tab === 'share' || tab === 'results' ? tab : 'create';
}

function questionTypeLabel(type: QuestionType): string {
  return type
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function firstQuestionValidationError(questions: BuilderQuestion[]): { index: number; message: string } | null {
  if (questions.length === 0) {
    return {
      index: -1,
      message: 'Add at least one question before publishing.',
    };
  }

  const emptyPromptIndex = questions.findIndex(q => !q.prompt.trim());
  if (emptyPromptIndex !== -1) {
    const q = questions[emptyPromptIndex];
    const label = questionTypeLabel(q.type);
    return {
      index: emptyPromptIndex,
      message: `Question ${emptyPromptIndex + 1} (${label}) is missing question text. Add the question text before saving or publishing.`,
    };
  }

  return null;
}

/* ── Type icon SVGs (Typeform-style) ─────────────────────────────────────── */

function TypeIcon({ type }: { type: QuestionType }) {
  const c = typePalette[type]?.color ?? '#6b7177';
  switch (type) {
    case 'multiple_choice':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill={c} d="M3.5 3.329 3.022 4.5h.956zM4.589 6l.216.532a.75.75 0 0 0 1.39-.566l-1.77-4.346a.998.998 0 0 0-1.85 0L.806 5.967a.75.75 0 1 0 1.39.566l.216-.532zM1.47 9.22A.75.75 0 0 1 2 9h2.303C5.38 9 6 9.896 6 10.79c0 .328-.084.657-.244.941.309.349.494.81.494 1.309 0 1.071-.852 1.96-1.946 1.96L2 15a.75.75 0 0 1-.75-.75v-4.5c0-.199.079-.39.22-.53m2.833 1.857c.04 0 .065-.008.08-.014a.13.13 0 0 0 .045-.035.36.36 0 0 0 .072-.24.36.36 0 0 0-.072-.239.13.13 0 0 0-.045-.034.2.2 0 0 0-.08-.014H2.75v.576zm-1.553 1.5h1.553a.45.45 0 0 1 .447.462c0 .266-.203.46-.447.46H2.75z" fillRule="evenodd" clipRule="evenodd"/><path fill={c} d="M8.75 3.498a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5zM8.75 11.503a.75.75 0 1 0 0 1.5h5.5a.75.75 0 0 0 0-1.5z"/></svg>;
    case 'picture_choice':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill={c} d="M10.448 6.96a1 1 0 0 0-.13.13c-.126.144-.28.356-.524.695L8.227 9.961c-.15.208-.287.4-.415.55a1.8 1.8 0 0 1-.536.446c-.327.17-.7.23-1.065.176a1.8 1.8 0 0 1-.65-.251 9 9 0 0 1-.57-.388l-.395-.282a9 9 0 0 0-.51-.35.6.6 0 0 0-.113-.058.25.25 0 0 0-.149.028.6.6 0 0 0-.084.095 9 9 0 0 0-.35.512l-1.144 1.75a13 13 0 0 0-.554.89c-.069.128-.087.19-.091.207a.25.25 0 0 0 .086.16c.017.005.078.023.223.037.232.02.552.022 1.048.022H13.15c.481 0 .79-.001 1.013-.022a1 1 0 0 0 .215-.036.25.25 0 0 0 .088-.157 1 1 0 0 0-.08-.202 13 13 0 0 0-.51-.876L11.21 7.84c-.218-.356-.355-.58-.469-.733a1 1 0 0 0-.12-.14.25.25 0 0 0-.174-.006m-.532-1.403a1.75 1.75 0 0 1 1.342.051c.31.143.522.381.688.604.16.216.332.498.527.819l2.702 4.43c.227.372.424.695.557.966.134.274.263.608.23.981-.044.5-.3.957-.704 1.255-.302.223-.655.286-.958.314-.3.028-.679.028-1.115.028H2.923c-.451 0-.841 0-1.15-.029-.309-.028-.67-.093-.976-.323a1.75 1.75 0 0 1-.695-1.283c-.025-.382.119-.72.264-.995.146-.273.359-.6.606-.977L2.15 9.596c.147-.224.28-.43.406-.59.136-.174.302-.353.535-.482a1.75 1.75 0 0 1 1.09-.205c.264.036.484.142.673.255.176.104.375.247.592.402l.396.282c.237.17.378.27.489.336.068.04.1.053.108.056a.25.25 0 0 0 .146-.024.6.6 0 0 0 .085-.087c.083-.099.185-.24.355-.476l1.57-2.18c.22-.305.413-.574.59-.777.181-.21.412-.43.73-.55m-3.333 4.07h.001z" fillRule="evenodd" clipRule="evenodd"/><path fill={c} d="M5.405 2.499a1.412 1.412 0 1 0 0 2.824 1.412 1.412 0 0 0 0-2.824M2.493 3.911a2.912 2.912 0 1 1 5.824 0 2.912 2.912 0 0 1-5.824 0" fillRule="evenodd" clipRule="evenodd"/></svg>;
    case 'true_false':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><g clipPath="url(#yesno-clip)"><path fill={c} d="M8 1.5c-.96 0-1.869.208-2.687.58a.75.75 0 0 1-.62-1.366 8 8 0 0 1 10.591 10.599.75.75 0 0 1-1.365-.622A6.5 6.5 0 0 0 8 1.5M.808.808a.75.75 0 0 1 1.06 0L4.111 3.05l11.082 11.082a.75.75 0 0 1-1.061 1.06l-1.05-1.05a1.7 1.7 0 0 1-.256.239A8 8 0 0 1 1.619 3.174a1.7 1.7 0 0 1 .239-.255l-1.05-1.05a.75.75 0 0 1 0-1.061M11.889 12.95 3.05 4.11a.22.22 0 0 0-.157-.068.1.1 0 0 0-.047.01.1.1 0 0 0-.031.028 6.5 6.5 0 0 0 9.106 9.106.1.1 0 0 0 .027-.032.1.1 0 0 0 .01-.047.22.22 0 0 0-.069-.157" fillRule="evenodd" clipRule="evenodd"/></g><defs><clipPath id="yesno-clip"><path fill={c} d="M0 0h16v16H0z"/></clipPath></defs></svg>;
    case 'match':
      return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="5" height="3" rx="1" fill={c}/><rect x="10" y="2" width="5" height="3" rx="1" fill={c} opacity="0.5"/><rect x="1" y="6.5" width="5" height="3" rx="1" fill={c}/><rect x="10" y="6.5" width="5" height="3" rx="1" fill={c} opacity="0.5"/><rect x="1" y="11" width="5" height="3" rx="1" fill={c}/><rect x="10" y="11" width="5" height="3" rx="1" fill={c} opacity="0.5"/></svg>;
    case 'ordering':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill={c} d="M8.75 3.498a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5zM8.75 11.503a.75.75 0 1 0 0 1.5h5.5a.75.75 0 0 0 0-1.5z"/><path fill={c} d="M2.5 10.52A.75.75 0 0 1 1 10.5c0-.276.051-.566.21-.825.164-.27.4-.433.636-.528.221-.088.45-.12.64-.133C2.67 9 2.87 9 3.045 9h.03c.177 0 .377 0 .563.014.19.014.418.045.639.133.236.095.472.258.637.528.158.259.21.548.21.825v.75a.75.75 0 0 1-.186.494L3.403 13.5H4.75a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.564-1.244l2.439-2.788v-.448l-.097-.01a7 7 0 0 0-.466-.01c-.195 0-.34 0-.466.01zM3.602 1.088A.75.75 0 0 1 4 1.75v4.5a.75.75 0 1 1-1.5 0V3.162l-.33.223a.75.75 0 0 1-.84-1.243l1.5-1.013a.75.75 0 0 1 .772-.041" fillRule="evenodd" clipRule="evenodd"/></svg>;
    case 'fill_blanks':
      return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="2" rx="1" fill={c}/><rect x="1" y="8" width="5" height="2" rx="1" fill={c}/><rect x="7" y="8" width="8" height="2" rx="1" fill={c} opacity="0.3" strokeDasharray="2 2" stroke={c} strokeWidth="0.5"/><rect x="1" y="12" width="10" height="2" rx="1" fill={c} opacity="0.5"/></svg>;
    case 'short_text':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill={c} d="M1 6.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 6.25m0 4a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75" fillRule="evenodd" clipRule="evenodd"/></svg>;
    case 'long_answer':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill={c} d="M1 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 4.25m0 4a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 8.25m0 4a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75" fillRule="evenodd" clipRule="evenodd"/></svg>;
    case 'number':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill={c} d="M5.75 1.006a.75.75 0 0 1 .65.837L6.13 4h4.74l.292-2.343a.75.75 0 0 1 1.488.186L12.38 4h1.87a.75.75 0 0 1 0 1.5h-2.057l-.625 5h2.682a.75.75 0 1 1 0 1.5h-2.87l-.292 2.343a.75.75 0 0 1-1.488-.186L9.87 12H5.13l-.292 2.343a.75.75 0 0 1-1.488-.186L3.62 12H1.75a.75.75 0 0 1 0-1.5h2.057l.625-5H1.75a.75.75 0 0 1 0-1.5h2.87l.292-2.343a.75.75 0 0 1 .837-.651M5.942 5.5l-.625 5h4.739l.625-5z" fillRule="evenodd" clipRule="evenodd"/></svg>;
    case 'dropdown':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill={c} d="m8 10.19 5.72-5.72a.75.75 0 1 1 1.06 1.06l-5.896 5.897a1.25 1.25 0 0 1-1.768 0L1.22 5.53a.75.75 0 1 1 1.06-1.06z" fillRule="evenodd" clipRule="evenodd"/></svg>;
    case 'checkbox':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill={c} d="M2.5 2.75a.25.25 0 0 1 .25-.25h10.5a.25.25 0 0 1 .25.25v10.5a.25.25 0 0 1-.25.25H2.75a.25.25 0 0 1-.25-.25zM2.75 1A1.75 1.75 0 0 0 1 2.75v10.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 13.25V2.75A1.75 1.75 0 0 0 13.25 1zm9.044 5.1a.75.75 0 0 0-1.119-1l-3.77 4.226-1.637-1.637a.75.75 0 0 0-1.06 1.06l2.198 2.199a.75.75 0 0 0 1.09-.031z" fillRule="evenodd" clipRule="evenodd"/></svg>;
    case 'opinion_scale':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill={c} d="M0 14.25a.75.75 0 0 1 .75-.75h.748l-.003-1.144v-1.604c0-.965.783-1.749 1.749-1.75l2.005-.001q.128 0 .251.018V6.747c0-.967.784-1.75 1.75-1.75h1.998q.128 0 .25.017V2.75c0-.966.784-1.75 1.75-1.75h1.997c.967 0 1.75.784 1.75 1.75V13.5h.255a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75m13.495-.75V2.75a.25.25 0 0 0-.25-.25H11.25a.25.25 0 0 0-.25.25V13.5zm-3.997 0H7V6.747a.25.25 0 0 1 .25-.25h1.998a.25.25 0 0 1 .25.249zm-3.998 0v-2.75a.25.25 0 0 0-.25-.25l-2.005.002a.25.25 0 0 0-.25.25v1.603l.003 1.145z" fillRule="evenodd" clipRule="evenodd"/></svg>;
    case 'rating':
      return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><g clipPath="url(#rating-clip)"><path fill={c} d="M8.234 1.665a.25.25 0 0 0-.468 0l-1.34 3.513a1.75 1.75 0 0 1-1.496 1.12l-3.194.256a.25.25 0 0 0-.141.44L4.013 9.03a1.75 1.75 0 0 1 .576 1.741l-.809 3.423a.25.25 0 0 0 .373.27l2.937-1.788a1.75 1.75 0 0 1 1.82 0l2.937 1.789a.25.25 0 0 0 .373-.271l-.809-3.423a1.75 1.75 0 0 1 .576-1.74l2.418-2.037a.25.25 0 0 0-.14-.44l-3.195-.256a1.75 1.75 0 0 1-1.496-1.12zM6.365 1.13c.573-1.5 2.697-1.5 3.27 0l1.34 3.513a.25.25 0 0 0 .214.16l3.195.255c1.559.125 2.184 2.076.988 3.083l-2.418 2.037a.25.25 0 0 0-.083.248l.809 3.423c.357 1.512-1.287 2.705-2.614 1.897L8.13 13.957a.25.25 0 0 0-.26 0l-2.936 1.789c-1.327.808-2.971-.385-2.614-1.897l.809-3.423a.25.25 0 0 0-.083-.248L.63 8.14c-1.197-1.007-.572-2.958.987-3.083l3.195-.255a.25.25 0 0 0 .213-.16z" fillRule="evenodd" clipRule="evenodd"/></g><defs><clipPath id="rating-clip"><path fill={c} d="M0 0h16v16H0z"/></clipPath></defs></svg>;
  }
}

function WelcomeScreenIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path fill={color} d="M6.824 1.054A1.75 1.75 0 0 1 9 2.752v10.496a1.75 1.75 0 0 1-2.176 1.698l-4.5-1.129A1.75 1.75 0 0 1 1 12.12V3.88a1.75 1.75 0 0 1 1.324-1.697zM7.5 2.752a.25.25 0 0 0-.31-.243l-4.5 1.129a.25.25 0 0 0-.19.242v8.24a.25.25 0 0 0 .19.242l4.5 1.129a.25.25 0 0 0 .31-.243zM11.25 2a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V2.75a.75.75 0 0 1 .75-.75m3 1a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-1.5 0v-8.5a.75.75 0 0 1 .75-.75" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  );
}

function EndScreenIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path fill={color} d="M8.81 2.51a.25.25 0 0 0-.31.242v10.496a.25.25 0 0 0 .31.243l4.5-1.129a.25.25 0 0 0 .19-.242V3.88a.25.25 0 0 0-.19-.242zM7 2.751a1.75 1.75 0 0 1 2.176-1.698l4.5 1.129A1.75 1.75 0 0 1 15 3.88v8.24a1.75 1.75 0 0 1-1.324 1.697l-4.5 1.129A1.75 1.75 0 0 1 7 13.248zM4.75 2a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 4.75 2m-3 1a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 1.75 3" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
  );
}

const ADD_MENU_ITEMS: { type: QuestionType; icon: string; label: string }[] = [
  { type: 'multiple_choice', icon: '◯', label: 'Multiple choice' },
  { type: 'picture_choice', icon: '🖼', label: 'Picture choice' },
  { type: 'true_false', icon: '✓✗', label: 'True / False' },
  { type: 'match', icon: '↔', label: 'Match' },
  { type: 'ordering', icon: '1↕', label: 'Ordering' },
  { type: 'fill_blanks', icon: '___', label: 'Fill in the blanks' },
  { type: 'short_text', icon: 'Aa', label: 'Short text' },
  { type: 'long_answer', icon: '¶', label: 'Long answer' },
  { type: 'number', icon: '#', label: 'Number' },
  { type: 'dropdown', icon: '⌄', label: 'Dropdown' },
  { type: 'checkbox', icon: '☑', label: 'Checkbox' },
  { type: 'opinion_scale', icon: '0–10', label: 'Opinion scale' },
  { type: 'rating', icon: '★', label: 'Rating' },
];

const SHARE_BASE = process.env.NEXT_PUBLIC_TEST_SHARE_BASE ?? 'https://test.blim.uz';
// Typeform-style preview frames:
// - Desktop fills the entire canvas as one wide white card (no chrome).
// - Mobile is a centered 427×760 white card on a faint grey canvas (bg-contrast only).
const BUILDER_PREVIEW_SIZE = {
  desktop: { width: 1280, height: 760 },
  mobile: { width: 480, height: 800 },
} as const;
const BUILDER_PREVIEW_FRAME_SIZE = {
  desktop: { width: 1280, height: 760 },
  mobile: { width: 427, height: 760 },
} as const;

type ActiveBlock =
  | { kind: 'welcome' }
  | { kind: 'question'; index: number }
  | { kind: 'end' };

const defaultWelcomeScreen = (title: string): TestScreenConfig => ({
  enabled: true,
  title: title ? `Say hi! ${title}` : 'Say hi!',
  description: '',
  buttonText: 'Start',
  showTimeToComplete: true,
  timeToCompleteText: 'Takes X minutes',
  showSubmissionCount: false,
});

const defaultEndScreen = (): TestScreenConfig => ({
  enabled: true,
  title: 'Thanks for completing this test',
  description: 'Your answers were submitted.',
  buttonText: 'Done',
  showSocialShare: false,
  buttonLinkEnabled: false,
  buttonLink: '',
});

const normalizeScreen = (
  screen: TestScreenConfig | null | undefined,
  fallback: TestScreenConfig,
): TestScreenConfig => ({
  ...fallback,
  ...(screen ?? {}),
  enabled: !!screen?.enabled,
});

interface Props {
  testId: string;
}

export function TestBuilder({ testId }: Props) {
  const { getAccessToken } = useAuth();
  const searchParams = useSearchParams();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<BuilderQuestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeBlock, setActiveBlock] = useState<ActiveBlock>({ kind: 'question', index: 0 });
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pubLoading, setPubLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState<{ limit: number } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showToolbarAddMenu, setShowToolbarAddMenu] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [openQuestionMenu, setOpenQuestionMenu] = useState<{ index: number; top: number; left: number } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [activeTopTab, setActiveTopTab] = useState<'create' | 'share' | 'results'>(() => testBuilderTab(searchParams.get('tab')));
  const questionsRef = useRef<BuilderQuestion[]>([]);
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    const tok = await getAccessToken();
    const res = await fetch(`/api/tests/${testId}`, { headers: authHeaders(tok) });
    if (!res.ok) {
      setLoadErr(res.status === 404 ? 'Test not found' : 'Failed to load');
      return;
    }
    const json = await res.json();
    setTest(json.test);
    const builderQs: BuilderQuestion[] = (json.questions as TestQuestion[]).map(q => ({
      clientId: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      required: q.required,
    }));
    setQuestions(builderQs);
    setSavedSnapshot(JSON.stringify(builderQs));
  }, [getAccessToken, testId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- setState happens inside async fetch, after await
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!openQuestionMenu) return;

    const closeMenu = () => setOpenQuestionMenu(null);

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (
        target?.closest('.tb-left__menu') ||
        target?.closest('.tb-left__item-more')
      ) {
        return;
      }
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', closeMenu, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [openQuestionMenu]);

  useEffect(() => {
    if (!showAddMenu && !showToolbarAddMenu) return;

    const closeMenus = () => {
      setShowAddMenu(false);
      setShowToolbarAddMenu(false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (
        target?.closest('.tb-add-menu') ||
        target?.closest('.tb-toolbar__left') ||
        target?.closest('.tb-left__add-wrap')
      ) {
        return;
      }
      closeMenus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAddMenu, showToolbarAddMenu]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  const dirty = useMemo(() => JSON.stringify(questions) !== savedSnapshot, [questions, savedSnapshot]);
  const canAutosaveQuestions = useMemo(
    () => questions.every(q => q.prompt.trim()),
    [questions],
  );

  const updateTest = async (patch: Partial<Pick<Test, 'title' | 'description' | 'theme' | 'welcome_screen' | 'end_screen' | 'timer_enabled' | 'time_limit_seconds' | 'is_graded'>>) => {
    const tok = await getAccessToken();
    const res = await fetch(`/api/tests/${testId}`, {
      method: 'PATCH',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const j = await res.json();
      setTest(j.test);
    }
  };

  const saveQuestions = useCallback(async (
    sourceQuestions: BuilderQuestion[] = questionsRef.current,
    options?: { silent?: boolean },
  ): Promise<boolean> => {
    const validationError = firstQuestionValidationError(sourceQuestions);
    if (validationError) {
      if (!options?.silent) {
        if (validationError.index >= 0) {
          setActiveTopTab('create');
          setActiveIdx(validationError.index);
          setActiveBlock({ kind: 'question', index: validationError.index });
        }
        alert(validationError.message);
      }
      return false;
    }

    setSaving(true);
    const sourceSnapshot = JSON.stringify(sourceQuestions);
    const tok = await getAccessToken();
    const payload = {
      questions: sourceQuestions.map(q => ({
        id: q.clientId,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        required: q.required,
      })),
    };
    const res = await fetch(`/api/tests/${testId}/questions`, {
      method: 'PUT',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      if (!options?.silent) {
        const errorBody = await res.json().catch(() => null) as { error?: unknown } | null;
        const errorMessage = typeof errorBody?.error === 'string'
          ? errorBody.error
          : 'Failed to save questions';
        alert(errorMessage);
      }
      return false;
    }
    const j = await res.json();
    const next: BuilderQuestion[] = (j.questions as TestQuestion[]).map(q => ({
      clientId: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      required: q.required,
    }));
    if (JSON.stringify(questionsRef.current) === sourceSnapshot) {
      setQuestions(next);
      setSavedSnapshot(JSON.stringify(next));
    } else {
      setSavedSnapshot(sourceSnapshot);
    }
    return true;
  }, [getAccessToken, testId]);

  useEffect(() => {
    if (!test || !dirty || saving || !canAutosaveQuestions) return;
    const timer = window.setTimeout(() => {
      void saveQuestions(questionsRef.current, { silent: true });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [canAutosaveQuestions, dirty, saveQuestions, saving, test]);

  const togglePublish = async (next: boolean) => {
    setPubLoading(true);
    setShowPaywall(null);
    const tok = await getAccessToken();
    if (next && dirty) {
      const saved = await saveQuestions(questionsRef.current);
      if (!saved) { setPubLoading(false); return; }
    }
    const res = await fetch(`/api/tests/${testId}/publish`, {
      method: 'POST',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ is_published: next }),
    });
    setPubLoading(false);
    if (res.status === 402) {
      const j = await res.json();
      setShowPaywall({ limit: j.limit ?? 3 });
      return;
    }
    if (!res.ok) {
      alert('Failed to update publish state');
      return;
    }
    const j = await res.json();
    setTest(j.test);
  };

  const addQuestion = (type: QuestionType) => {
    let options: BuilderQuestion['options'];
    if (type === 'multiple_choice') options = { choices: ['', ''], correctIndex: null, correctIndexes: [], randomize: false, allowMultiple: false };
    else if (type === 'picture_choice') options = { choices: [{ text: '' }, { text: '' }], correctIndex: null, correctIndexes: [], randomize: false, allowMultiple: false };
    else if (type === 'true_false') options = { correct: null };
    else if (type === 'match') options = { pairs: [{ left: '', right: '' }, { left: '', right: '' }] };
    else if (type === 'ordering') options = { items: ['', ''] };
    else if (type === 'fill_blanks') options = { template: '', blanks: [] };
    else if (type === 'short_text') options = { correctAnswers: [] };
    else if (type === 'long_answer') options = { maxCharactersEnabled: false };
    else if (type === 'number') options = { correctValue: null };
    else if (type === 'dropdown') options = { choices: ['', ''], correctIndex: null, randomize: false };
    else if (type === 'checkbox') options = { choices: ['', ''], correctIndexes: [], randomize: false };
    else if (type === 'opinion_scale') options = { min: 0, max: 10, minLabel: '', maxLabel: '' };
    else options = { max: 5, shape: 'star' };
    const base: BuilderQuestion = {
      clientId: newClientId(),
      type,
      prompt: '',
      required: true,
      options,
    };
    setQuestions(qs => [...qs, base]);
    setActiveIdx(questions.length);
    setActiveBlock({ kind: 'question', index: questions.length });
    setShowAddMenu(false);
    setShowToolbarAddMenu(false);
  };

  const explainPreviewDisabled = () => {
    alert('Publish the test before opening the public preview.');
  };

  const removeQuestion = (i: number) => {
    setQuestions(qs => qs.filter((_, idx) => idx !== i));
    setActiveIdx(idx => Math.max(0, idx > i ? idx - 1 : idx === i && i === questions.length - 1 ? i - 1 : idx));
    setActiveBlock(block => {
      if (block.kind !== 'question') return block;
      const nextIndex = Math.max(0, block.index > i ? block.index - 1 : block.index === i && i === questions.length - 1 ? i - 1 : block.index);
      return questions.length <= 1 ? { kind: 'end' } : { kind: 'question', index: nextIndex };
    });
  };

  const duplicateQuestion = (i: number) => {
    const source = questions[i];
    if (!source) return;
    const copy: BuilderQuestion = {
      ...source,
      clientId: newClientId(),
      prompt: source.prompt ? `${source.prompt} copy` : source.prompt,
      options: structuredClone(source.options),
    };
    setQuestions(qs => {
      const next = qs.slice();
      next.splice(i + 1, 0, copy);
      return next;
    });
    setActiveIdx(i + 1);
    setActiveBlock({ kind: 'question', index: i + 1 });
    setOpenQuestionMenu(null);
  };

  const reorderQuestion = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= questions.length || to >= questions.length) return;
    setQuestions(qs => {
      const next = qs.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setActiveIdx(current => {
      if (current === from) return to;
      if (from < current && current <= to) return current - 1;
      if (to <= current && current < from) return current + 1;
      return current;
    });
    setActiveBlock(block => {
      if (block.kind !== 'question') return block;
      if (block.index === from) return { kind: 'question', index: to };
      if (from < block.index && block.index <= to) return { kind: 'question', index: block.index - 1 };
      if (to <= block.index && block.index < from) return { kind: 'question', index: block.index + 1 };
      return block;
    });
  };

  const handleQuestionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = questions.findIndex(q => q.clientId === active.id);
    const to = questions.findIndex(q => q.clientId === over.id);
    reorderQuestion(from, to);
  };

  const setActiveQ = (q: BuilderQuestion) => {
    const index = activeBlock.kind === 'question' ? activeBlock.index : activeIdx;
    setQuestions(qs => qs.map((cur, i) => (i === index ? q : cur)));
  };

  const productionShareUrl = test ? `${SHARE_BASE}/t/${test.slug}` : '';

  const copyShareLink = () => {
    if (!test) return;
    if (!test.is_published) {
      explainPreviewDisabled();
      return;
    }
    navigator.clipboard?.writeText(productionShareUrl).catch(() => {});
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1400);
  };

  if (loadErr) return <Center><div style={{ color: '#dc2626' }}>{loadErr}</div></Center>;
  if (!test) return <Center><div style={{ color: '#94a3b8' }}>Loading…</div></Center>;

  const welcomeScreen = normalizeScreen(test.welcome_screen, defaultWelcomeScreen(test.title));
  const endScreen = normalizeScreen(test.end_screen, defaultEndScreen());
  const activeQuestionIndex = activeBlock.kind === 'question'
    ? Math.min(activeBlock.index, Math.max(questions.length - 1, 0))
    : activeIdx;
  const activeQuestion = questions[activeQuestionIndex];

  return (
    <div style={builderShell}>
      {/* ── Top toolbar ──────────────────────────── */}
      <header style={topBar}>
        <div style={topBarLeft}>
          <div style={builderBreadcrumb}>
            <TestLink href="/dashboard" style={builderBreadcrumbLink}>
              Dashboard
            </TestLink>
            <span style={builderBreadcrumbSep}>›</span>
            <input
              type="text"
              value={test.title}
              onChange={e => setTest({ ...test, title: e.target.value })}
              onBlur={() => updateTest({ title: test.title })}
              style={titleInput}
              aria-label="Test name"
            />
          </div>
        </div>
        <nav style={topTabs}>
          <button type="button" onClick={() => setActiveTopTab('create')} style={topTabButton(activeTopTab === 'create')}>
            Create
          </button>
          <button type="button" onClick={() => setActiveTopTab('share')} style={topTabButton(activeTopTab === 'share')}>
            Share
          </button>
          <button type="button" onClick={() => setActiveTopTab('results')} style={topTabButton(activeTopTab === 'results')}>
            Results
          </button>
        </nav>
        <div style={topActions}>
          <span style={saveState(dirty)}>
            {saving ? 'Saving…' : dirty ? 'Unsaved' : 'Saved'}
          </span>
          <button type="button" onClick={() => togglePublish(!test.is_published)} disabled={pubLoading} style={pubBtn(test.is_published)}>
            {pubLoading ? '…' : test.is_published ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </header>

      {activeTopTab === 'create' ? (
      <>
      {/* ── Left rail: question list ─────────────── */}
      <aside style={leftPane}>
        <div style={leftModeWrap}>
          <span style={leftModeIcon} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v2.5A1.75 1.75 0 0 1 13.25 7H2.75A1.75 1.75 0 0 1 1 5.25zm1.75-.25a.25.25 0 0 0-.25.25v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25zM1 10.75C1 9.784 1.784 9 2.75 9h10.5c.966 0 1.75.784 1.75 1.75v2.5A1.75 1.75 0 0 1 13.25 15H2.75A1.75 1.75 0 0 1 1 13.25zm1.75-.25a.25.25 0 0 0-.25.25v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25z" />
            </svg>
          </span>
          <select
            value={test.is_graded ? 'test' : 'survey'}
            onChange={(event) => {
              const isGraded = event.target.value === 'test';
              setTest({ ...test, is_graded: isGraded });
              updateTest({ is_graded: isGraded });
            }}
            style={leftModeSelect}
            aria-label="Test mode"
          >
            <option value="survey">Survey mode</option>
            <option value="test">Test mode</option>
          </select>
          <span style={leftModeChevron} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="m4.5 6.25 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <ul className="tb-left" style={{ listStyle: 'none', padding: '8px 8px 0', margin: 0, flex: 1, overflow: 'auto' }}>
          {welcomeScreen.enabled ? (
            <li className="tb-left__item-wrap">
              <button
                type="button"
                onClick={() => setActiveBlock({ kind: 'welcome' })}
                className={`tb-left__item ${activeBlock.kind === 'welcome' ? 'tb-left__item--active' : ''}`}
              >
                <span className="tb-left__item-left">
                  <span className="tb-left__add-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                    <WelcomeScreenIcon color="#b45309" />
                  </span>
                </span>
                <span className="tb-left__item-title">Welcome Screen</span>
              </button>
              <button
                type="button"
                className="tb-left__item-more"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = { ...welcomeScreen, enabled: false };
                  setTest({ ...test, welcome_screen: next });
                  updateTest({ welcome_screen: next });
                  if (activeBlock.kind === 'welcome') setActiveBlock({ kind: 'question', index: 0 });
                }}
                title="Remove welcome screen"
              >
                ×
              </button>
            </li>
          ) : null}
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleQuestionDragEnd}>
            <SortableContext items={questions.map(q => q.clientId)} strategy={verticalListSortingStrategy}>
              {questions.map((q, i) => (
                <SortableQuestionItem
                  key={q.clientId}
                  q={q}
                  index={i}
                  isActive={activeBlock.kind === 'question' && i === activeQuestionIndex}
                  isMenuOpen={openQuestionMenu?.index === i}
                  onSelect={() => {
                    setActiveIdx(i);
                    setActiveBlock({ kind: 'question', index: i });
                  }}
                  onOpenMenu={(rect) => {
                    setOpenQuestionMenu(current => current?.index === i
                      ? null
                      : { index: i, top: rect.top - 8, left: rect.right + 5 });
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
          {endScreen.enabled ? (
            <li className="tb-left__item-wrap">
              <button
                type="button"
                onClick={() => setActiveBlock({ kind: 'end' })}
                className={`tb-left__item ${activeBlock.kind === 'end' ? 'tb-left__item--active' : ''}`}
              >
                <span className="tb-left__item-left">
                  <span className="tb-left__add-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    <EndScreenIcon color="#0369a1" />
                  </span>
                </span>
                <span className="tb-left__item-title">End Screen</span>
              </button>
              <button
                type="button"
                className="tb-left__item-more"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = { ...endScreen, enabled: false };
                  setTest({ ...test, end_screen: next });
                  updateTest({ end_screen: next });
                  if (activeBlock.kind === 'end') setActiveBlock({ kind: 'question', index: 0 });
                }}
                title="Remove end screen"
              >
                ×
              </button>
            </li>
          ) : null}
        </ul>
        <div className="tb-left__add-wrap" style={{ padding: 8, borderTop: '1px solid #e2e8f0', position: 'relative' }}>
          {!welcomeScreen.enabled ? (
            <button
              type="button"
              onClick={() => {
                const next = defaultWelcomeScreen(test.title);
                setTest({ ...test, welcome_screen: next });
                updateTest({ welcome_screen: next });
                setActiveBlock({ kind: 'welcome' });
              }}
              style={screenAddBtn}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <WelcomeScreenIcon color="#b45309" />
                Add Welcome Screen
              </span>
              <span style={screenAddPlus}>+</span>
            </button>
          ) : null}
          {!endScreen.enabled ? (
            <button
              type="button"
              onClick={() => {
                const next = defaultEndScreen();
                setTest({ ...test, end_screen: next });
                updateTest({ end_screen: next });
                setActiveBlock({ kind: 'end' });
              }}
              style={screenAddBtn}
            >
              <span>▮ Add End Screen</span>
              <span style={screenAddPlus}>+</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setShowAddMenu(v => !v);
              setShowToolbarAddMenu(false);
            }}
            style={addBtn}
          >
            + Add question
          </button>
          {showAddMenu ? (
            <div className="tb-add-menu" style={addMenu}>
              <div style={addMenuTitle}>Question types</div>
              {ADD_MENU_ITEMS.map(item => (
                <button key={item.type} type="button" onClick={() => addQuestion(item.type)} className="tb-left__add-item">
                  <span className="tb-left__add-icon" style={{ background: typePalette[item.type]?.bg, color: typePalette[item.type]?.color }}>
                    <TypeIcon type={item.type} />
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </aside>

      {/* ── Center canvas: toolbar + preview ──────── */}
      <main style={centerPane}>
        {/* Typeform-style toolbar */}
        <div className="tb-toolbar">
          <div className="tb-toolbar__left" style={{ position: 'relative' }}>
            <button
              type="button"
              className="tb-toolbar__btn tb-toolbar__btn--primary"
              onClick={() => {
                setShowToolbarAddMenu(v => !v);
                setShowAddMenu(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Add content
            </button>
            {showToolbarAddMenu ? (
              <div className="tb-add-menu" style={toolbarAddMenu}>
                <div style={addMenuTitle}>Question types</div>
                {ADD_MENU_ITEMS.map(item => (
                  <button key={item.type} type="button" onClick={() => addQuestion(item.type)} className="tb-left__add-item">
                    <span className="tb-left__add-icon" style={{ background: typePalette[item.type]?.bg, color: typePalette[item.type]?.color }}>
                      <TypeIcon type={item.type} />
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
            {test.is_published ? (
              <button
                type="button"
                className="tb-toolbar__preview-btn"
                onClick={() => navigateToTestHref(`/t/${test.slug}?preview=1`)}
                title="Open public preview"
              >
                Preview
              </button>
            ) : (
              <button
                type="button"
                className="tb-toolbar__preview-btn"
                onClick={explainPreviewDisabled}
                title="Publish before previewing"
              >
                Preview
              </button>
            )}
            <button
              type="button"
              className="tb-toolbar__preview-btn"
              onClick={() => {
                if (test.is_graded) setShowAnswerKey(true);
              }}
              disabled={!test.is_graded}
              title={test.is_graded ? 'Set correct answers' : 'Answers are only used in Test mode'}
            >
              Answers
            </button>
            <button
              type="button"
              className="tb-toolbar__preview-btn"
              onClick={() => setShowTimerModal(true)}
              title="Timer settings"
              style={test.timer_enabled ? { ...timerToolbarButton, ...toolbarTimerActive } : timerToolbarButton}
            >
              <AlarmClockIcon />
              Timer
            </button>
            <button
              type="button"
              className="tb-toolbar__preview-btn"
              onClick={() => setShowThemeModal(true)}
              title="Design settings"
              style={designToolbarButton}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
                <g fill="currentColor">
                  <path d="M8 4.871a1.173 1.173 0 1 1-2.346 0 1.173 1.173 0 0 1 2.346 0M5.654 8.196a1.173 1.173 0 1 1-2.347 0 1.173 1.173 0 0 1 2.347 0M11.91 6.045a1.173 1.173 0 1 1-2.346 0 1.173 1.173 0 0 1 2.347 0" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M8 1.5a6.5 6.5 0 0 0-.021 13 8 8 0 0 0-.173-.338c-.172-.327-.399-.76-.54-1.203-.17-.532-.26-1.2.056-1.867.237-.502.6-.85 1.05-1.057.428-.196.893-.245 1.32-.238.43.006.878.07 1.296.14q.22.037.427.073c.274.048.534.094.8.13.825.114 1.349.078 1.672-.135.264-.174.613-.628.613-2.005A6.5 6.5 0 0 0 8 1.5M0 8a8 8 0 1 1 16 0c0 1.568-.395 2.67-1.287 3.258-.834.549-1.878.482-2.703.368-.292-.04-.6-.094-.889-.144l-.38-.066a7.5 7.5 0 0 0-1.072-.12c-.313-.004-.526.036-.672.103a.63.63 0 0 0-.319.333c-.088.186-.094.424.017.771.098.308.255.608.429.942l.094.181c.097.188.203.4.277.607.069.193.15.485.089.8a1.1 1.1 0 0 1-.652.805c-.28.127-.609.162-.932.162a8 8 0 0 1-8-8" />
                </g>
              </svg>
              Design
            </button>
          </div>
          <div />
          <div className="tb-toolbar__right">
            <button
              type="button"
              className={`tb-toolbar__icon-btn ${previewDevice === 'desktop' ? 'tb-toolbar__icon-btn--active' : ''}`}
              onClick={() => setPreviewDevice('desktop')}
              title="Desktop view"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="2.5" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 15h6M9 12.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <button
              type="button"
              className={`tb-toolbar__icon-btn ${previewDevice === 'mobile' ? 'tb-toolbar__icon-btn--active' : ''}`}
              onClick={() => setPreviewDevice('mobile')}
              title="Mobile view"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="4.5" y="1.5" width="9" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="14" r="0.75" fill="currentColor"/></svg>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className={`tb-canvas tb-canvas--${previewDevice}`} style={{ flex: 1, overflow: 'auto', background: '#fafafa' }}>
          {activeBlock.kind === 'welcome' ? (
            <ScreenPreviewCanvas screen={welcomeScreen} fallbackTitle={test.title} kind="welcome" questionCount={questions.length} previewDevice={previewDevice} />
          ) : activeBlock.kind === 'end' ? (
            <ScreenPreviewCanvas screen={endScreen} fallbackTitle="Submitted" kind="end" questionCount={questions.length} previewDevice={previewDevice} />
          ) : activeQuestion ? (
            <PreviewCanvas q={activeQuestion} qIndex={activeQuestionIndex} previewDevice={previewDevice} theme={test.theme} />
          ) : (
            <div style={emptyCanvas}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No questions yet</div>
              <div style={{ color: '#94a3b8', fontSize: 14 }}>
                Click <b>+ Add question</b> on the left to get started.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Right rail: settings ─────────────────── */}
      <aside style={rightPane}>
        {activeBlock.kind === 'welcome' ? (
          <ScreenSettingsPanel
            kind="welcome"
            screen={welcomeScreen}
            onChange={(next, persist) => {
              setTest({ ...test, welcome_screen: next });
              if (persist) updateTest({ welcome_screen: next });
            }}
          />
        ) : activeBlock.kind === 'end' ? (
          <ScreenSettingsPanel
            kind="end"
            screen={endScreen}
            onChange={(next, persist) => {
              setTest({ ...test, end_screen: next });
              if (persist) updateTest({ end_screen: next });
            }}
          />
        ) : activeQuestion ? (
          <SettingsPanel
            q={activeQuestion}
            isGraded={test.is_graded}
            index={activeQuestionIndex}
            total={questions.length}
            onChange={setActiveQ}
          />
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
              Test settings
            </div>
            <textarea
              value={test.description}
              onChange={e => setTest({ ...test, description: e.target.value })}
              onBlur={() => updateTest({ description: test.description })}
              placeholder="Test description (shown to students)"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '8px 10px', fontSize: 13,
                border: '1px solid #cbd5e1', borderRadius: 6,
                fontFamily: 'inherit', resize: 'vertical',
                marginBottom: 12,
              }}
            />
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
              Test mode is controlled from the left panel: Survey collects responses without scoring, Test uses correct answers and scores.
            </div>
          </div>
        )}

        {showPaywall ? (
          <div style={{ padding: 12 }}>
            <PaywallNotice limit={showPaywall.limit} />
          </div>
        ) : null}
      </aside>
      </>
      ) : activeTopTab === 'share' ? (
        <ShareTab
          test={test}
          shareUrl={productionShareUrl}
          copied={shareCopied}
          onCopy={copyShareLink}
          onPublish={() => togglePublish(true)}
          publishing={pubLoading}
        />
      ) : (
        <ResultsTab testId={test.id} />
      )}

      {activeTopTab === 'create' && showAnswerKey ? (
        <AnswerKeyModal
          questions={questions}
          onClose={() => setShowAnswerKey(false)}
          onChange={(clientId, nextOptions) => {
            setQuestions(qs => qs.map(q => (
              q.clientId === clientId ? { ...q, options: nextOptions } : q
            )));
          }}
        />
      ) : null}

      {activeTopTab === 'create' && showTimerModal ? (
        <TimerModal
          enabled={!!test.timer_enabled}
          seconds={test.time_limit_seconds ?? null}
          onClose={() => setShowTimerModal(false)}
          onChange={(patch) => {
            setTest({ ...test, ...patch });
            updateTest(patch);
          }}
        />
      ) : null}

      {activeTopTab === 'create' && showThemeModal ? (
        <ThemeModal
          theme={test.theme}
          onClose={() => setShowThemeModal(false)}
          onChange={(nextTheme) => {
            setTest({ ...test, theme: nextTheme });
            updateTest({ theme: nextTheme });
          }}
        />
      ) : null}

      {activeTopTab === 'create' && openQuestionMenu ? (
        <QuestionActionsMenu
          top={openQuestionMenu.top}
          left={openQuestionMenu.left}
          onDuplicate={() => duplicateQuestion(openQuestionMenu.index)}
          onDelete={() => {
            const index = openQuestionMenu.index;
            setOpenQuestionMenu(null);
            removeQuestion(index);
          }}
        />
      ) : null}
    </div>
  );
}

function ShareTab({ test, shareUrl, copied, onCopy, onPublish, publishing }: {
  test: Test;
  shareUrl: string;
  copied: boolean;
  onCopy: () => void;
  onPublish: () => void;
  publishing: boolean;
}) {
  return (
    <main style={singleTabShell}>
      <section style={singleTabCard}>
        <div style={singleTabKicker}>Share</div>
        <h2 style={singleTabTitle}>Share this test with students</h2>
        <p style={singleTabText}>
          {test.is_published
            ? 'Anyone with this link can open the test and submit answers.'
            : 'Publish the test first. Draft tests are hidden from students.'}
        </p>

        <div style={shareUrlBox}>
          <code style={shareUrlText}>{test.is_published ? shareUrl : 'Publish to generate a live student link'}</code>
          <button
            type="button"
            onClick={test.is_published ? onCopy : onPublish}
            disabled={publishing}
            style={sharePrimaryButton}
          >
            {test.is_published ? (copied ? 'Copied' : 'Copy link') : (publishing ? 'Publishing…' : 'Publish')}
          </button>
        </div>

        {test.is_published ? <ShareQR url={shareUrl} fileName={test.title || 'test'} /> : null}

        <div style={shareNote}>
          The public player route stays the same after edits. Unpublish hides this link without deleting responses.
        </div>
      </section>
    </main>
  );
}

function ShareQR({ url, fileName }: { url: string; fileName: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const safeName = fileName.replace(/[^a-z0-9-_]+/gi, '-').slice(0, 40) || 'test';
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${safeName}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [fileName]);

  return (
    <div style={shareQrWrap} ref={wrapRef}>
      <div style={shareQrFrame}>
        <QRCodeCanvas value={url} size={192} marginSize={2} level="M" />
      </div>
      <div style={shareQrSide}>
        <div style={shareQrLabel}>Scan to open</div>
        <p style={shareQrText}>
          Project this in class or print it on a handout. Anyone who scans gets the same link.
        </p>
        <button type="button" onClick={handleDownload} style={shareQrButton}>Download PNG</button>
      </div>
    </div>
  );
}

function ResultsTab({ testId }: { testId: string }) {
  return (
    <main style={singleTabShell}>
      <section style={{ ...singleTabCard, maxWidth: 1120 }}>
        <ResponsesTable testId={testId} />
      </section>
    </main>
  );
}

function SortableQuestionItem({
  q,
  index,
  isActive,
  isMenuOpen,
  onSelect,
  onOpenMenu,
}: {
  q: BuilderQuestion;
  index: number;
  isActive: boolean;
  isMenuOpen: boolean;
  onSelect: () => void;
  onOpenMenu: (rect: DOMRect) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: q.clientId });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
    zIndex: isDragging ? 40 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      className={`tb-left__item-wrap ${isDragging ? 'tb-left__item-wrap--dragging' : ''}`}
      style={style}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={onSelect}
        className={`tb-left__item ${isActive ? 'tb-left__item--active' : ''}`}
        aria-label={`Question ${index + 1}: ${q.prompt || 'Untitled question'}`}
      >
        <span className="tb-left__item-left">
          <TypeIcon type={q.type} />
        </span>
        <span className={`tb-left__item-title ${!q.prompt ? 'tb-left__item-title--empty' : ''}`}>
          {q.prompt || 'Untitled question'}
        </span>
      </button>
      <button
        type="button"
        className="tb-left__item-more"
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu(e.currentTarget.getBoundingClientRect());
        }}
        title="Question actions"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="12.5" r="1.2" fill="currentColor"/></svg>
      </button>
    </li>
  );
}

function QuestionActionsMenu({ top, left, onDuplicate, onDelete }: {
  top: number;
  left: number;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="tb-left__menu" role="menu" style={{ top, left }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="tb-left__menu-item"
        role="menuitem"
        onClick={onDuplicate}
      >
        <span className="tb-left__menu-icon" aria-hidden="true">
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
            <rect x="6.25" y="3.25" width="8.5" height="8.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11.75 11.75v1.25c0 .69-.56 1.25-1.25 1.25H5c-.69 0-1.25-.56-1.25-1.25V7.5c0-.69.56-1.25 1.25-1.25h1.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        Duplicate
      </button>
      <button
        type="button"
        className="tb-left__menu-item tb-left__menu-item--danger"
        role="menuitem"
        onClick={onDelete}
      >
        <span className="tb-left__menu-icon" aria-hidden="true">
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
            <path d="M6.5 4.75V3.5c0-.41.34-.75.75-.75h3.5c.41 0 .75.34.75.75v1.25M4.25 4.75h9.5M6 7v6M9 7v6M12 7v6M5.25 4.75l.5 9.25c.04.7.61 1.25 1.31 1.25h3.88c.7 0 1.27-.55 1.31-1.25l.5-9.25" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        Delete
      </button>
    </div>
  );
}

function ScreenPreviewCanvas({ screen, fallbackTitle, kind, questionCount, previewDevice }: {
  screen: TestScreenConfig;
  fallbackTitle: string;
  kind: 'welcome' | 'end';
  questionCount: number;
  previewDevice: 'desktop' | 'mobile';
}) {
  const title = screen.title || fallbackTitle;
  const description = screen.description ?? '';
  const buttonText = screen.buttonText || (kind === 'welcome' ? 'Start' : 'Done');
  const previewSize = BUILDER_PREVIEW_SIZE[previewDevice];

  return (
    <div style={screenPreviewWrap}>
      <div style={{
        ...screenPreviewCard,
        width: previewSize.width,
        height: previewSize.height,
        minHeight: previewSize.height,
        maxWidth: 'none',
        borderRadius: 7,
        padding: previewDevice === 'mobile' ? '30px 26px' : 32,
      }}>
        {screen.imageUrl ? <img src={screen.imageUrl} alt="" style={screenPreviewImage} /> : null}
        <h2 style={screenPreviewTitle}>{title}</h2>
        <p style={screenPreviewDescription}>{description || 'Description (optional)'}</p>
        {buttonText ? <button type="button" style={screenPreviewButton}>{buttonText}</button> : null}
        {kind === 'welcome' && screen.showTimeToComplete ? (
          <div style={screenPreviewMeta}>◷ {screen.timeToCompleteText || `Takes ${Math.max(1, Math.ceil(questionCount / 4))} minutes`}</div>
        ) : null}
        {kind === 'welcome' && screen.showSubmissionCount ? (
          <div style={screenPreviewMeta}>● Number of submissions</div>
        ) : null}
        {kind === 'end' && screen.showSocialShare ? (
          <div style={screenSocialPreview}>
            <span>Share</span><span>𝕏</span><span>f</span><span>in</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScreenSettingsPanel({ kind, screen, onChange }: {
  kind: 'welcome' | 'end';
  screen: TestScreenConfig;
  onChange: (screen: TestScreenConfig, persist?: boolean) => void;
}) {
  const persist = (patch: Partial<TestScreenConfig>) => onChange({ ...screen, ...patch }, true);
  const update = (patch: Partial<TestScreenConfig>) => onChange({ ...screen, ...patch }, false);

  return (
    <div style={panel}>
      <div style={screenSettingsTop}>
        <span style={screenTypeIcon}>{kind === 'welcome' ? <WelcomeScreenIcon color="#5b5260" /> : <EndScreenIcon color="#5b5260" />}</span>
        <span>{kind === 'welcome' ? 'Welcome Screen' : 'End Screen'}</span>
        <span style={{ marginLeft: 'auto' }}>⌄</span>
      </div>

      {kind === 'welcome' ? (
        <>
          <ScreenToggle label="Time to complete" checked={!!screen.showTimeToComplete} onChange={v => persist({ showTimeToComplete: v })} />
          {screen.showTimeToComplete ? (
            <input
              type="text"
              value={screen.timeToCompleteText ?? ''}
              onChange={e => update({ timeToCompleteText: e.target.value })}
              onBlur={() => persist({ timeToCompleteText: screen.timeToCompleteText ?? '' })}
              placeholder="Takes X minutes"
              style={screenInput}
            />
          ) : null}
          <ScreenToggle label="Number of submissions" checked={!!screen.showSubmissionCount} onChange={v => persist({ showSubmissionCount: v })} />
        </>
      ) : (
        <>
          <ScreenToggle label="Social share icons" checked={!!screen.showSocialShare} onChange={v => persist({ showSocialShare: v })} />
          <ScreenToggle label="Button" checked={(screen.buttonText ?? '') !== ''} onChange={v => persist({ buttonText: v ? 'Create a typeform' : '' })} />
        </>
      )}

      <div style={screenFieldLabel}>Title</div>
      <textarea
        value={screen.title}
        onChange={e => update({ title: e.target.value })}
        onBlur={() => persist({ title: screen.title })}
        rows={2}
        placeholder={kind === 'welcome' ? 'Say hi!' : 'Thanks for completing this test'}
        style={screenTextarea}
      />

      <div style={screenFieldLabel}>Description</div>
      <textarea
        value={screen.description ?? ''}
        onChange={e => update({ description: e.target.value })}
        onBlur={() => persist({ description: screen.description ?? '' })}
        rows={2}
        placeholder="Description (optional)"
        style={screenTextarea}
      />

      <div style={screenFieldLabel}>Button</div>
      <input
        type="text"
        value={screen.buttonText ?? ''}
        maxLength={24}
        onChange={e => update({ buttonText: e.target.value })}
        onBlur={() => persist({ buttonText: screen.buttonText ?? '' })}
        placeholder={kind === 'welcome' ? 'Start' : 'Done'}
        style={screenInput}
      />
      <div style={screenCharCount}>{(screen.buttonText ?? '').length}/24</div>

      {kind === 'end' ? (
        <>
          <ScreenToggle label="Button link" checked={!!screen.buttonLinkEnabled} onChange={v => persist({ buttonLinkEnabled: v })} />
          {screen.buttonLinkEnabled ? (
            <input
              type="url"
              value={screen.buttonLink ?? ''}
              onChange={e => update({ buttonLink: e.target.value })}
              onBlur={() => persist({ buttonLink: screen.buttonLink ?? '' })}
              placeholder="https://..."
              style={screenInput}
            />
          ) : null}
        </>
      ) : null}

      <div style={screenDivider} />
      <div style={screenMediaRow}>
        <span>Image or video</span>
        <button type="button" style={screenMediaPlus}>+</button>
      </div>
      <input
        type="url"
        value={screen.imageUrl ?? ''}
        onChange={e => update({ imageUrl: e.target.value })}
        onBlur={() => persist({ imageUrl: screen.imageUrl ?? '' })}
        placeholder="Image URL"
        style={screenInput}
      />
    </div>
  );
}

function ScreenToggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={screenToggleRow}>
      <span>{label}</span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{ ...screenSwitch, background: checked ? '#6d6571' : '#e8e4df' }}
      >
        <span style={{ ...screenSwitchKnob, left: checked ? 17 : 3 }} />
      </span>
    </label>
  );
}

function TimerModal({ enabled, seconds, onClose, onChange }: {
  enabled: boolean;
  seconds: number | null;
  onClose: () => void;
  onChange: (patch: Pick<Test, 'timer_enabled'> | Pick<Test, 'time_limit_seconds'> | Pick<Test, 'timer_enabled' | 'time_limit_seconds'>) => void;
}) {
  return (
    <div
      style={timerModalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Timer settings"
      onMouseDown={onClose}
    >
      <div style={timerModal} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} style={timerModalClose} aria-label="Close timer settings">
          ×
        </button>
        <TimerSettings enabled={enabled} seconds={seconds} onChange={onChange} />
      </div>
    </div>
  );
}

function TimerSettings({ enabled, seconds, onChange }: {
  enabled: boolean;
  seconds: number | null;
  onChange: (patch: Pick<Test, 'timer_enabled'> | Pick<Test, 'time_limit_seconds'> | Pick<Test, 'timer_enabled' | 'time_limit_seconds'>) => void;
}) {
  const normalizedSeconds = Math.max(60, Math.round(seconds ?? 600));
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const updateTimeLimit = (nextHours: number, nextMinutes: number) => {
    const safeHours = Math.min(24, Math.max(0, Number.isFinite(nextHours) ? nextHours : 0));
    const safeMinutes = safeHours >= 24
      ? 0
      : Math.min(59, Math.max(0, Number.isFinite(nextMinutes) ? nextMinutes : 0));
    const nextSeconds = Math.max(60, Math.min(86400, safeHours * 3600 + safeMinutes * 60));
    onChange({ time_limit_seconds: nextSeconds });
  };

  return (
    <div style={timerPanel}>
      <div style={timerHeader}>
        <span style={timerIcon}>◷</span>
        <div>
          <div style={timerTitle}>Timer</div>
          <div style={timerSubtitle}>Auto-submit when time runs out</div>
        </div>
      </div>
      <ScreenToggle
        label="Time limit"
        checked={enabled}
        onChange={(nextEnabled) => onChange({
          timer_enabled: nextEnabled,
          time_limit_seconds: nextEnabled ? (seconds ?? 600) : seconds,
        })}
      />
      {enabled ? (
        <div style={timerDurationGrid}>
          <label style={timerDurationField}>
            <span>Hours</span>
            <input
              type="number"
              min={0}
              max={24}
              value={hours}
              onChange={(event) => updateTimeLimit(Number(event.target.value), minutes)}
              style={timerInput}
            />
          </label>
          <label style={timerDurationField}>
            <span>Minutes</span>
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(event) => updateTimeLimit(hours, Number(event.target.value))}
              style={timerInput}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function ThemeModal({ theme, onClose, onChange }: {
  theme?: TestThemeConfig | null;
  onClose: () => void;
  onChange: (theme: TestThemeConfig) => void;
}) {
  const normalized = normalizeTestTheme(theme);
  const updateTheme = (patch: Partial<TestThemeConfig>) => {
    onChange(normalizeTestTheme({ ...normalized, ...patch }));
  };

  return (
    <div
      style={designModalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Design settings"
      onMouseDown={onClose}
    >
      <div style={designModal} onMouseDown={(event) => event.stopPropagation()}>
        <div style={designModalHeader}>
          <span style={designDragDots} aria-hidden="true">
            <span style={designDot} />
            <span style={designDot} />
            <span style={designDot} />
            <span style={designDot} />
            <span style={designDot} />
            <span style={designDot} />
          </span>
          <div style={designTitle}>Design</div>
          <button type="button" onClick={onClose} style={designModalClose} aria-label="Close design settings">
            ×
          </button>
        </div>
        <div style={designModalBody}>
          <div style={designTabs} role="tablist" aria-label="Design sections">
            <button type="button" style={{ ...designTab, ...designTabActive }} role="tab" aria-selected="true">
              My themes
            </button>
            <button type="button" style={designTab} role="tab" aria-selected="false">
              Gallery
            </button>
          </div>
          <div style={designSection}>
            <div style={designBrandRow}>
              <div style={designSectionTitle}>
                Brand kit themes
                <span style={designBrandBadge}>◇</span>
              </div>
              <button type="button" style={designManageButton}>Manage</button>
            </div>
            <div style={designDivider} />
            <div style={designBrandRow}>
              <div style={designSectionTitle}>My themes</div>
              <button type="button" style={designAddButton} aria-label="Add theme">+</button>
            </div>
            <div style={designControlsCard}>
              <div style={designControlsTitle}>Current theme</div>
              <ThemeColorInput label="Background" value={normalized.backgroundColor} onChange={(backgroundColor) => updateTheme({ backgroundColor })} />
              <ThemeColorInput label="Question text" value={normalized.questionColor} onChange={(questionColor) => updateTheme({ questionColor })} />
              <ThemeColorInput label="Answers" value={normalized.answerColor} onChange={(answerColor) => updateTheme({ answerColor })} />
              <ThemeColorInput label="Buttons" value={normalized.buttonColor} onChange={(buttonColor) => updateTheme({ buttonColor })} />
              <label style={themeFieldRow}>
                <span>Text size</span>
                <select
                  value={normalized.fontScale}
                  onChange={(event) => updateTheme({ fontScale: event.target.value as TestThemeConfig['fontScale'] })}
                  style={themeSelect}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
              <button
                type="button"
                style={themeResetButton}
                onClick={() => onChange(DEFAULT_TEST_THEME)}
              >
                Reset theme
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlarmClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3 2 6" />
      <path d="m22 6-3-3" />
      <path d="M6.38 18.7 4 21" />
      <path d="M17.64 18.67 20 21" />
    </svg>
  );
}

function ThemeColorInput({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitDraft = () => {
    const nextValue = draft.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(nextValue)) {
      onChange(nextValue);
      return;
    }
    setDraft(value);
  };

  return (
    <label style={themeFieldRow}>
      <span>{label}</span>
      <span style={themeColorControl}>
        <input
          type="color"
          value={value}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(event.target.value);
          }}
          style={themeColorSwatch}
          aria-label={label}
        />
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitDraft();
            }
          }}
          style={themeTextInput}
          aria-label={`${label} hex color`}
        />
      </span>
    </label>
  );
}

/* ── Preview canvas: full-screen, like the player ──────────────────────── */
function getQuestionDescription(q: BuilderQuestion): string {
  const description = (q.options as { description?: unknown }).description;
  return typeof description === 'string' ? description : '';
}

function getQuestionMedia(q: BuilderQuestion) {
  const media = (q.options as { media?: unknown }).media;
  if (!media || typeof media !== 'object') return undefined;
  const typedMedia = media as PublicQuestion['media'];
  return typedMedia?.url ? typedMedia : undefined;
}

function previewShuffle<T>(items: T[], enabled: boolean): T[] {
  return enabled ? items.slice().reverse() : items;
}

function PreviewCanvas({
  q,
  qIndex,
  previewDevice,
  theme,
}: {
  q: BuilderQuestion;
  qIndex: number;
  previewDevice: 'desktop' | 'mobile';
  theme?: TestThemeConfig | null;
}) {
  const slideSize = BUILDER_PREVIEW_SIZE[previewDevice];
  const frameSize = BUILDER_PREVIEW_FRAME_SIZE[previewDevice];
  const themeVars = useMemo(() => testThemeCssVars(theme), [theme]);
  const previewCardRef = useRef<HTMLDivElement | null>(null);
  const [previewOverflowing, setPreviewOverflowing] = useState(false);
  // Convert the builder question to the public shape (no answer keys)
  const description = getQuestionDescription(q);
  const media = getQuestionMedia(q);
  let previewQ: PublicQuestion;
  if (q.type === 'multiple_choice') {
    const opts = q.options as MultipleChoiceOptions;
    const choices = (opts.choices ?? []).map((text, i) => ({
      id: publicOptionId(q.clientId, 'choice', i),
      text,
    }));
    previewQ = {
      id: q.clientId, position: qIndex, type: 'multiple_choice',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: { choices: previewShuffle(choices, !!opts.randomize), allowMultiple: !!opts.allowMultiple },
    };
  } else if (q.type === 'dropdown') {
    const opts = q.options as DropdownOptions;
    const choices = (opts.choices ?? []).map((text, i) => ({
      id: publicOptionId(q.clientId, 'choice', i),
      text,
    }));
    previewQ = {
      id: q.clientId, position: qIndex, type: 'dropdown',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: { choices: previewShuffle(choices, !!opts.randomize) },
    };
  } else if (q.type === 'checkbox') {
    const opts = q.options as CheckboxOptions;
    const choices = (opts.choices ?? []).map((text, i) => ({
      id: publicOptionId(q.clientId, 'choice', i),
      text,
    }));
    previewQ = {
      id: q.clientId, position: qIndex, type: 'checkbox',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: { choices: previewShuffle(choices, !!opts.randomize) },
    };
  } else if (q.type === 'picture_choice') {
    const opts = q.options as PictureChoiceOptions;
    const choices = (opts.choices ?? []).map((choice, i) => ({
      id: publicOptionId(q.clientId, 'choice', i),
      text: choice.text,
      image_url: choice.image_url,
    }));
    previewQ = {
      id: q.clientId, position: qIndex, type: 'picture_choice',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: { choices: previewShuffle(choices, !!opts.randomize), allowMultiple: !!opts.allowMultiple },
    };
  } else if (q.type === 'true_false') {
    previewQ = {
      id: q.clientId, position: qIndex, type: 'true_false',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: {},
    };
  } else if (q.type === 'match') {
    const pairs = (q.options as MatchOptions).pairs ?? [];
    previewQ = {
      id: q.clientId, position: qIndex, type: 'match',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: {
        left: pairs.map((p, i) => ({ id: `left-${i}`, text: p.left })),
        right: pairs.map((p, i) => ({
          id: publicOptionId(q.clientId, 'match-right', i),
          text: p.right,
        })),
      },
    };
  } else if (q.type === 'ordering') {
    previewQ = {
      id: q.clientId, position: qIndex, type: 'ordering',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: {
        items: ((q.options as OrderingOptions).items ?? []).map((text, i) => ({
          id: publicOptionId(q.clientId, 'ordering', i),
          text,
        })),
      },
    };
  } else if (q.type === 'fill_blanks') {
    const opts = q.options as FillBlanksOptions;
    previewQ = {
      id: q.clientId, position: qIndex, type: 'fill_blanks',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: {
        template: opts.template ?? '',
        blanks: (opts.blanks ?? []).length,
        blankWidths: (opts.blanks ?? []).map(blank => Math.max(4, Math.min(32, (blank.answer ?? '').trim().length || 4))),
      },
    };
  } else if (q.type === 'long_answer') {
    const opts = q.options as LongAnswerOptions;
    previewQ = {
      id: q.clientId, position: qIndex, type: 'long_answer',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: { maxLength: opts.maxCharactersEnabled ? opts.maxLength : undefined },
    };
  } else if (q.type === 'number') {
    const opts = q.options as NumberOptions;
    previewQ = {
      id: q.clientId, position: qIndex, type: 'number',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: { min: opts.min, max: opts.max },
    };
  } else if (q.type === 'opinion_scale') {
    const opts = q.options as OpinionScaleOptions;
    previewQ = {
      id: q.clientId, position: qIndex, type: 'opinion_scale',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: { min: opts.min ?? 0, max: opts.max ?? 10, minLabel: opts.minLabel, maxLabel: opts.maxLabel },
    };
  } else if (q.type === 'rating') {
    const opts = q.options as RatingOptions;
    previewQ = {
      id: q.clientId, position: qIndex, type: 'rating',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: { max: opts.max ?? 5, shape: opts.shape ?? 'star' },
    };
  } else {
    const opts = q.options as ShortTextOptions;
    previewQ = {
      id: q.clientId, position: qIndex, type: 'short_text',
      prompt: q.prompt || 'Question text…',
      description: description || undefined,
      media,
      required: q.required,
      options: { maxLength: opts.maxCharactersEnabled ? opts.maxLength : undefined },
    };
  }

  useEffect(() => {
    const frame = previewCardRef.current;
    if (!frame) return;
    const overflowing = frame.scrollHeight > frame.clientHeight + 1;
    setPreviewOverflowing(overflowing);
    frame.scrollTop = 0;
  }, [previewDevice, q.clientId, q.prompt, description, media?.url, q.options]);

  const previewCardClassName = [
    'tb-preview-card',
    `tb-preview-card--${previewDevice}`,
    previewDevice === 'mobile' ? 'tb-preview-card--mobile-centered' : '',
    previewQ.media?.url ? 'tb-preview-card--has-media' : 'tb-preview-card--no-media',
    `tb-preview-card--type-${q.type.replaceAll('_', '-')}`,
    previewOverflowing ? 'tb-preview-card--overflowing' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className="tb-preview-wrap"
      style={{
        ...previewWrap,
        width: '100%',
        height: slideSize.height,
        minHeight: slideSize.height,
      }}
    >
      <div
        ref={previewCardRef}
        className={previewCardClassName}
        style={{
          ...previewCard,
          ...themeVars,
          width: previewDevice === 'desktop' ? '100%' : frameSize.width,
          height: frameSize.height,
          minHeight: frameSize.height,
          maxWidth: 'none',
          display: 'flex',
          flexDirection: 'column',
          // safe center: vertically center when content fits, fall back to
          // flex-start when it would overflow (prevents top-crop in one paint).
          justifyContent: 'safe center',
          overflowY: 'auto',
          // Typeform parity: desktop is full-bleed (no chrome), mobile has a
          // hairline border for visible separation against the off-white canvas.
          border: previewDevice === 'mobile' ? '1px solid #ececec' : 'none',
          borderRadius: 0,
          boxShadow: 'none',
          background: 'var(--test-theme-bg, #fff)',
          padding: previewDevice === 'mobile' ? '32px 28px' : '64px 80px',
          '--qmedia-card-pad-x': previewDevice === 'mobile' ? '28px' : '80px',
          '--qmedia-card-pad-top': previewDevice === 'mobile' ? '32px' : '64px',
        } as React.CSSProperties}
      >
        <div className="tb-preview-content">
          <QuestionMediaLayout
            media={previewQ.media}
            forceDevice={previewDevice}
            header={(
              <>
                <span className="tb-preview-number" style={previewNumberBadge}>
                  {qIndex + 1}
                </span>
                <h2 className="tb-preview-title" style={{
                  fontSize: 'calc(34px * var(--test-theme-font-scale, 1))', fontWeight: 400, margin: '0 0 10px', lineHeight: 1.12,
                  color: q.prompt ? 'var(--test-theme-question, #1c1626)' : '#cbd5e1',
                }}>
                  {q.prompt || 'Your question…'}
                </h2>
                <div className="tb-preview-hint" style={previewHint}>
                  {description || 'Description (optional)'}
                </div>
              </>
            )}
            answer={(
              <>
                <div style={previewAnswerArea}>
                  <QuestionRenderer
                    question={previewQ}
                    value={{}}
                    onChange={() => {}}
                    onSubmit={() => {}}
                  />
                </div>
                {q.type === 'multiple_choice' || q.type === 'picture_choice' ? (
                  <div className="tb-preview-footnote" style={previewFootnote}>
                    <span>Add or edit choices from the right panel.</span>
                  </div>
                ) : null}
              </>
            )}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Style helpers ─────────────────────────────────────────────────────── */

const panel: React.CSSProperties = {
  padding: 16,
  display: 'grid',
  gap: 12,
};

const screenAddBtn: React.CSSProperties = {
  width: '100%',
  marginBottom: 8,
  padding: '10px 10px',
  borderRadius: 12,
  border: '1px dashed #ded8d1',
  background: '#fbfaf8',
  color: '#2f2835',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const screenAddPlus: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 8,
  border: '1px solid #ded8d1',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff',
  fontSize: 18,
  lineHeight: 1,
};

const screenPreviewWrap: React.CSSProperties = {
  minHeight: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '44px 28px',
};

const screenPreviewCard: React.CSSProperties = {
  width: 'min(390px, 100%)',
  minHeight: 700,
  border: '1px solid #e4ded8',
  background: '#fff',
  boxShadow: '0 12px 40px rgba(47,40,53,0.08)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: 32,
};

const screenPreviewImage: React.CSSProperties = {
  width: 180,
  maxHeight: 150,
  objectFit: 'cover',
  borderRadius: 18,
  marginBottom: 26,
};

const screenPreviewTitle: React.CSSProperties = {
  margin: '0 0 12px',
  color: '#2f2835',
  fontSize: 20,
  fontStyle: 'italic',
  fontWeight: 500,
  lineHeight: 1.35,
};

const screenPreviewDescription: React.CSSProperties = {
  margin: '0 0 30px',
  color: '#a29aa6',
  fontSize: 15,
  fontStyle: 'italic',
};

const screenPreviewButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 4,
  background: '#0445b8',
  color: '#fff',
  padding: '12px 18px',
  fontSize: 18,
  fontWeight: 800,
  boxShadow: '0 6px 14px rgba(4,69,184,0.22)',
};

const screenPreviewMeta: React.CSSProperties = {
  marginTop: 14,
  color: '#111827',
  fontSize: 13,
};

const screenSocialPreview: React.CSSProperties = {
  marginTop: 18,
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  color: '#6b6470',
  fontSize: 13,
};

const screenSettingsTop: React.CSSProperties = {
  height: 34,
  border: '1px solid #ded8d1',
  borderRadius: 8,
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 10px',
  color: '#6b6470',
  fontSize: 14,
};

const screenTypeIcon: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 7,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#e8e4df',
  color: '#2f2835',
};

const screenToggleRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#6b6470',
  fontSize: 14,
  padding: '6px 0',
};

const screenSwitch: React.CSSProperties = {
  width: 36,
  height: 20,
  borderRadius: 999,
  position: 'relative',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
};

const screenSwitchKnob: React.CSSProperties = {
  position: 'absolute',
  top: 3,
  width: 14,
  height: 14,
  borderRadius: 999,
  background: '#fff',
  transition: 'left 0.15s ease',
};

const screenFieldLabel: React.CSSProperties = {
  color: '#6b6470',
  fontSize: 14,
  marginTop: 4,
};

const screenTextarea: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #ded8d1',
  borderRadius: 8,
  background: '#fff',
  color: '#2f2835',
  padding: '9px 10px',
  fontFamily: 'inherit',
  fontSize: 14,
  lineHeight: 1.4,
  resize: 'vertical',
  outline: 'none',
};

const screenInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #ded8d1',
  borderRadius: 8,
  background: '#fff',
  color: '#2f2835',
  padding: '9px 10px',
  fontFamily: 'inherit',
  fontSize: 14,
  outline: 'none',
};

const timerPanel: React.CSSProperties = {
  padding: 16,
  display: 'grid',
  gap: 10,
};

const timerHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const timerIcon: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 10,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#ede9fe',
  color: '#6b4fbb',
  fontWeight: 900,
};

const timerTitle: React.CSSProperties = {
  color: '#2f2835',
  fontSize: 14,
  fontWeight: 850,
};

const timerSubtitle: React.CSSProperties = {
  color: '#8b848f',
  fontSize: 12,
  marginTop: 2,
};

const timerDurationGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
};

const timerDurationField: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  color: '#6b6470',
  fontSize: 13,
  fontWeight: 700,
};

const timerInput: React.CSSProperties = {
  ...screenInput,
  textAlign: 'center',
  fontWeight: 800,
};

const themeFieldRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 152px',
  alignItems: 'center',
  gap: 10,
  color: '#6b6470',
  fontSize: 14,
};

const themeColorControl: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '34px 1fr',
  gap: 8,
  alignItems: 'center',
};

const themeColorSwatch: React.CSSProperties = {
  width: 34,
  height: 34,
  padding: 0,
  border: '1px solid #ded8d1',
  borderRadius: 7,
  background: '#fff',
  cursor: 'pointer',
};

const themeTextInput: React.CSSProperties = {
  ...screenInput,
  padding: '8px 9px',
  fontSize: 13,
  fontWeight: 700,
};

const themeSelect: React.CSSProperties = {
  ...screenInput,
  padding: '8px 9px',
  fontSize: 13,
  fontWeight: 700,
};

const themeResetButton: React.CSSProperties = {
  marginTop: 4,
  border: '1px solid #ded8d1',
  borderRadius: 7,
  background: '#fff',
  color: '#2f2533',
  padding: '9px 12px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
};

const designModalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 130,
  background: 'rgba(15, 23, 42, 0.16)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 18,
};

const designModal: React.CSSProperties = {
  width: 560,
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'calc(100vh - 32px)',
  overflow: 'auto',
  borderRadius: 18,
  background: '#fff',
  border: '3px solid #eeecef',
  boxShadow: '0 20px 70px rgba(47, 40, 53, 0.16)',
};

const designModalHeader: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '24px 1fr 36px',
  alignItems: 'center',
  gap: 14,
  padding: '24px 24px 22px',
  color: '#564d5b',
};

const designDragDots: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 4px)',
  gridAutoRows: 4,
  gap: 4,
  justifyContent: 'center',
};

const designDot: React.CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: 999,
  background: '#756c79',
};

const designTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: '#514857',
};

const designModalClose: React.CSSProperties = {
  width: 36,
  height: 36,
  border: 'none',
  background: 'transparent',
  color: '#5f5664',
  fontSize: 34,
  lineHeight: 1,
  cursor: 'pointer',
};

const designModalBody: React.CSSProperties = {
  margin: '0 16px 16px',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#f6f5f6',
};

const designTabs: React.CSSProperties = {
  display: 'flex',
  gap: 34,
  padding: '18px 32px 0',
  borderBottom: '2px solid #ecebed',
};

const designTab: React.CSSProperties = {
  position: 'relative',
  border: 'none',
  background: 'transparent',
  padding: '0 0 18px',
  color: '#6d6470',
  fontSize: 20,
  fontWeight: 600,
  cursor: 'pointer',
};

const designTabActive: React.CSSProperties = {
  color: '#514857',
  boxShadow: 'inset 0 -4px 0 #514857',
};

const designSection: React.CSSProperties = {
  padding: '26px 32px 24px',
  display: 'grid',
  gap: 20,
};

const designBrandRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 18,
};

const designSectionTitle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#3f3645',
  fontSize: 19,
  fontWeight: 650,
};

const designBrandBadge: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#e6fbf8',
  border: '1px solid #9bded8',
  color: '#075f5b',
  fontSize: 19,
  fontWeight: 900,
};

const designManageButton: React.CSSProperties = {
  border: '1px solid #dedde0',
  borderRadius: 8,
  background: '#fff',
  color: '#6a606e',
  padding: '8px 15px',
  fontSize: 16,
  fontWeight: 500,
  cursor: 'pointer',
};

const designDivider: React.CSSProperties = {
  height: 1,
  background: '#e2e0e3',
};

const designAddButton: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1px solid #dedde0',
  background: '#fff',
  color: '#5d5361',
  fontSize: 28,
  lineHeight: 1,
  cursor: 'pointer',
};

const designControlsCard: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 14,
  borderRadius: 10,
  background: '#fff',
  border: '1px solid #e4e0dc',
};

const designControlsTitle: React.CSSProperties = {
  color: '#3f3645',
  fontSize: 13,
  fontWeight: 850,
  textTransform: 'uppercase',
  letterSpacing: 0.35,
};

const toolbarTimerActive: React.CSSProperties = {
  border: 'none',
  background: '#f3efff',
  color: '#5b3db2',
};

const timerToolbarButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: 'none',
  boxShadow: 'none',
  color: '#6d6470',
  fontSize: 16,
  fontWeight: 600,
};

const designToolbarButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: 'none',
  boxShadow: 'none',
  color: '#6d6470',
  fontSize: 16,
  fontWeight: 600,
};

const timerModalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 130,
  background: 'rgba(15, 23, 42, 0.22)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const timerModal: React.CSSProperties = {
  position: 'relative',
  width: 360,
  maxWidth: 'calc(100vw - 32px)',
  borderRadius: 10,
  background: '#fff',
  boxShadow: '0 18px 60px rgba(47, 40, 53, 0.22), 0 1px 4px rgba(47, 40, 53, 0.12)',
  border: '1px solid #e4ded8',
};

const timerModalClose: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 10,
  width: 30,
  height: 30,
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  color: '#8b848f',
  fontSize: 24,
  lineHeight: 1,
  cursor: 'pointer',
  zIndex: 1,
};

const screenCharCount: React.CSSProperties = {
  marginTop: -8,
  color: '#a29aa6',
  textAlign: 'right',
  fontSize: 12,
};

const screenDivider: React.CSSProperties = {
  height: 1,
  background: '#e8e4df',
  margin: '4px 0',
};

const screenMediaRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#2f2835',
  fontSize: 14,
};

const screenMediaPlus: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: '1px solid #ded8d1',
  background: '#fff',
  color: '#6b6470',
  fontSize: 22,
  cursor: 'pointer',
};

const topBar: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, height: 64,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 18px', gap: 16,
  background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid #e7e2dc',
  backdropFilter: 'blur(16px)',
  zIndex: 5,
};

const builderShell: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  top: 64,
  display: 'grid',
  gridTemplateColumns: '280px minmax(0, 1fr) 340px',
  background: '#fff',
  overflow: 'hidden',
};

const singleTabShell: React.CSSProperties = {
  gridColumn: '1 / -1',
  minHeight: 0,
  overflow: 'auto',
  background: '#fff',
  padding: 32,
};

const singleTabCard: React.CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
  background: '#fff',
  border: '1px solid #e4ded8',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 8px 22px rgba(47,40,53,0.04)',
};

const singleTabKicker: React.CSSProperties = {
  color: '#8b848f',
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: 0.7,
  textTransform: 'uppercase',
  marginBottom: 8,
};

const singleTabTitle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#2f2835',
  fontSize: 28,
  lineHeight: 1.12,
  letterSpacing: -0.5,
};

const singleTabText: React.CSSProperties = {
  margin: '0 0 22px',
  color: '#6b6470',
  fontSize: 15,
  lineHeight: 1.5,
};

const shareUrlBox: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 10,
  alignItems: 'center',
  border: '1px solid #ded8d1',
  borderRadius: 14,
  background: '#fbfaf8',
  padding: 10,
};

const shareUrlText: React.CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '#2f2835',
  fontSize: 13,
};

const sharePrimaryButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 999,
  background: '#2f2533',
  color: '#fff',
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 850,
  cursor: 'pointer',
};

const shareNote: React.CSSProperties = {
  marginTop: 14,
  color: '#8b848f',
  fontSize: 13,
  lineHeight: 1.45,
};

const shareQrWrap: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 18,
  alignItems: 'center',
  marginTop: 16,
  padding: 16,
  border: '1px solid #ded8d1',
  borderRadius: 14,
  background: '#fbfaf8',
};

const shareQrFrame: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ece6df',
  borderRadius: 12,
  padding: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const shareQrSide: React.CSSProperties = {
  flex: '1 1 220px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const shareQrLabel: React.CSSProperties = {
  color: '#8b848f',
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: 0.7,
  textTransform: 'uppercase',
};

const shareQrText: React.CSSProperties = {
  margin: 0,
  color: '#6b6470',
  fontSize: 13,
  lineHeight: 1.45,
};

const shareQrButton: React.CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 6,
  border: '1px solid #ded8d1',
  borderRadius: 999,
  background: '#fff',
  color: '#2f2533',
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const topBarLeft: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  flex: 1,
};

const builderBreadcrumb: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  minWidth: 0,
  color: '#6d6571',
  fontSize: 14,
  fontWeight: 500,
};

const builderBreadcrumbLink: React.CSSProperties = {
  color: '#6d6571',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

const builderBreadcrumbSep: React.CSSProperties = {
  color: '#a49ca7',
  fontSize: 18,
  lineHeight: 1,
};

const titleInput: React.CSSProperties = {
  flex: 1, maxWidth: 360, minWidth: 80,
  fontSize: 14, fontWeight: 500,
  padding: '0',
  border: '1px solid transparent', borderRadius: 6,
  background: 'transparent', outline: 'none',
  color: '#4f4655',
};

const topTabs: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: 4,
  borderRadius: 999,
  background: '#fff',
};

const topActions: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const saveState = (dirty: boolean): React.CSSProperties => ({
  fontSize: 12,
  color: dirty ? '#b45309' : '#15803d',
  background: dirty ? '#fef3c7' : '#dcfce7',
  borderRadius: 7,
  padding: '5px 9px',
  fontWeight: 750,
});

const publishedStatus: React.CSSProperties = {
  color: '#15803d',
  background: '#dcfce7',
  borderRadius: 999,
  padding: '3px 7px',
};

const draftStatus: React.CSSProperties = {
  color: '#64748b',
  background: '#f1f5f9',
  borderRadius: 999,
  padding: '3px 7px',
};

const pubBtn = (isPub: boolean): React.CSSProperties => ({
  padding: '9px 18px', fontSize: 13, fontWeight: 800,
  background: isPub ? '#fff' : '#2f2533',
  color: isPub ? '#2f2533' : '#fff',
  border: isPub ? '1.5px solid #2f2533' : 'none', borderRadius: 7,
  cursor: 'pointer',
});

const leftPane: React.CSSProperties = {
  background: '#fff', borderRight: '1px solid #ded8d1',
  display: 'flex', flexDirection: 'column',
  minHeight: 0,
};

const centerPane: React.CSSProperties = {
  background: '#fff', minHeight: 0, overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
};

const rightPane: React.CSSProperties = {
  background: '#fff', borderLeft: '1px solid #ded8d1',
  display: 'flex', flexDirection: 'column',
  minHeight: 0, overflow: 'auto',
};

const leftModeWrap: React.CSSProperties = {
  position: 'relative',
  margin: '12px 12px 12px',
  height: 48,
  borderRadius: 10,
  background: '#f5f3f4',
  color: '#5f5864',
  display: 'flex',
  alignItems: 'center',
};

const leftModeIcon: React.CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#5f5864',
  pointerEvents: 'none',
};

const leftModeSelect: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  borderRadius: 10,
  background: 'transparent',
  color: '#5f5864',
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 500,
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  padding: '0 40px 0 42px',
  cursor: 'pointer',
};

const leftModeChevron: React.CSSProperties = {
  position: 'absolute',
  right: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#5f5864',
  pointerEvents: 'none',
};

/* listBtn removed — using .tb-left__item CSS classes instead */

const topTabButton = (active: boolean): React.CSSProperties => ({
  padding: '7px 14px',
  fontSize: 13,
  fontWeight: active ? 800 : 750,
  color: active ? '#1c1626' : '#6b6470',
  background: active ? '#fff' : 'transparent',
  border: 'none',
  borderRadius: 999,
  boxShadow: active ? '0 1px 2px rgba(47,40,53,0.08)' : 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
});

/* typeBadge removed — using TypeIcon + typePalette instead */

const addBtn: React.CSSProperties = {
  width: '100%', padding: '12px 12px',
  background: '#2f2533', color: '#fff',
  border: 'none', borderRadius: 10,
  fontSize: 13, fontWeight: 800, cursor: 'pointer',
};

const addMenu: React.CSSProperties = {
  position: 'absolute', bottom: '100%', left: 8, right: 8, marginBottom: 6,
  background: '#fff', border: '1px solid #e4ded8', borderRadius: 7,
  boxShadow: '0 18px 50px rgba(47,40,53,0.16)',
  display: 'grid', gap: 2, padding: 6, zIndex: 10,
};

const toolbarAddMenu: React.CSSProperties = {
  position: 'absolute',
  top: 44,
  left: 0,
  width: 260,
  background: '#fff',
  border: '1px solid #e4ded8',
  borderRadius: 7,
  boxShadow: '0 18px 50px rgba(47,40,53,0.16)',
  display: 'grid',
  gap: 2,
  padding: 6,
  zIndex: 100,
};

const addMenuTitle: React.CSSProperties = {
  padding: '8px 10px 6px',
  color: '#8b848f',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
};

const emptyCanvas: React.CSSProperties = {
  width: '100%', height: '100%',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  textAlign: 'center', padding: 24,
};

const previewWrap: React.CSSProperties = {
  width: '100%',
  minHeight: '100%',
  boxSizing: 'border-box',
  overflow: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

const previewCard: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  minHeight: 500,
  containerType: 'inline-size',
  borderRadius: 7,
  background: '#fff',
  border: '1px solid #e4ded8',
  boxShadow: '0 12px 36px rgba(47,40,53,0.06)',
  padding: '54px 58px 46px',
  overflow: 'hidden',
};

const previewTopline: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#6b4fbb',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  marginBottom: 22,
};

const previewNumber: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#2f2533',
  color: '#fff',
  letterSpacing: 0,
};

const requiredChip: React.CSSProperties = {
  marginLeft: 'auto',
  background: '#f3efff',
  color: '#6b4fbb',
  borderRadius: 999,
  padding: '5px 9px',
};

const previewHint: React.CSSProperties = {
  fontSize: 15,
  color: '#9b929d',
  fontStyle: 'italic',
  marginBottom: 32,
  fontWeight: 500,
};

const previewNumberBadge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 26,
  padding: '2px 7px',
  marginBottom: 14,
  background: '#262627',
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.4,
  borderRadius: 5,
  letterSpacing: 0.2,
};

const previewAnswerArea: React.CSSProperties = {
  pointerEvents: 'none',
  marginTop: 8,
};

const previewFootnote: React.CSSProperties = {
  marginTop: 18,
  paddingLeft: 4,
  color: '#8b848f',
  fontSize: 13,
  fontWeight: 650,
};

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  );
}
