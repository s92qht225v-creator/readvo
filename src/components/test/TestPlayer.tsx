'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { QuestionRenderer } from './QuestionRenderer';
import { MathText } from './MathText';
import { detectScriptLang } from '@/lib/test/scriptLang';
import { ensureRespondentToken } from '@/lib/test/respondentToken';
import { QuestionMediaBlock, QuestionMediaLayout } from './QuestionMediaBlock';
import type { PublicTest, PublicQuestion, PublicSection, AnswerSubmission } from '@/lib/test/types';
import type { SectionScore } from '@/lib/test/grade';
import { normalizeTestTheme, testThemeCssVars } from '@/lib/test/theme';
import './test-player.css';

interface Props {
  test: PublicTest;
  forceDevice?: 'mobile' | 'desktop';
  /* Server-issued session row id from POST /api/t/[slug]/session.
     Threaded through to the submission payload so the server updates
     the existing row (with its locked shuffle seed) instead of
     inserting a fresh one. Also keys the per-session answer autosave in
     localStorage. */
  responseId?: string;
  /* Server-recorded session start (ISO) from POST /api/t/[slug]/session.
     The countdown timer is anchored to this instead of the client clock
     so it survives a page refresh and can't be reset by reloading. */
  sessionStartedAt?: string;
  /* Play-once listening tracks this respondent already consumed (section
     ids and/or 'global'), from POST /session. Seeds the local consumed
     set so a refresh re-locks them instead of replaying. */
  initialConsumedAudio?: string[];
}

type Phase = 'intro' | 'question' | 'submitting' | 'done' | 'error';

interface Done {
  score: number | null;
  total: number | null;
  sections: SectionScore[];
}

type RespondentProfile = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

function formatClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutesAfterHours = Math.ceil((totalSeconds % 3600) / 60);
  if (hours > 0) {
    const hourLabel = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return minutesAfterHours > 0 ? `${hourLabel} ${minutesAfterHours} min` : hourLabel;
  }
  const minutes = Math.max(1, Math.ceil(totalSeconds / 60));
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

function respondentLabel(profile: RespondentProfile) {
  return [
    [profile.firstName.trim(), profile.lastName.trim()].filter(Boolean).join(' '),
    profile.email.trim(),
    profile.phone.trim(),
  ].filter(Boolean).join(' · ').slice(0, 80);
}

function welcomeCollectorFields(screen: { collectFirstName?: boolean; collectLastName?: boolean; collectPhone?: boolean; collectEmail?: boolean }) {
  const fields: Array<{
    key: keyof RespondentProfile;
    label: string;
    placeholder: string;
    type: string;
    prefix?: string;
  }> = [];
  if (screen.collectFirstName) fields.push({ key: 'firstName', label: 'Name', placeholder: 'Name', type: 'text' });
  if (screen.collectLastName) fields.push({ key: 'lastName', label: 'Last name', placeholder: 'Last name', type: 'text' });
  if (screen.collectPhone) fields.push({ key: 'phone', label: 'Phone number', placeholder: '', type: 'tel', prefix: '+998' });
  if (screen.collectEmail) fields.push({ key: 'email', label: 'Email', placeholder: 'name@example.com', type: 'email' });
  return fields;
}

function phoneLocalValue(value: string) {
  return value.replace(/^\+?998\s*/, '');
}

function normalizeUzbekPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '');
  const withoutCountry = digits.startsWith('998') ? digits.slice(3) : digits;
  return withoutCountry ? `+998${withoutCountry}` : '';
}

function hasQuestionAnswer(question: PublicQuestion, value?: AnswerSubmission['value']): boolean {
  if (!value) return false;
  if (question.type === 'multiple_choice' || question.type === 'picture_choice') {
    return typeof value.selected === 'number'
      || (typeof value.selectedId === 'string' && value.selectedId.length > 0)
      || (Array.isArray(value.selectedIds) && value.selectedIds.length > 0);
  }
  if (question.type === 'short_text' || question.type === 'long_answer' || question.type === 'number') {
    return typeof value.text === 'string' && value.text.trim().length > 0;
  }
  if (question.type === 'dropdown') {
    return typeof value.selectedId === 'string' && value.selectedId.length > 0;
  }
  if (question.type === 'checkbox') {
    return Array.isArray(value.selectedIds) && value.selectedIds.length > 0;
  }
  if (question.type === 'opinion_scale' || question.type === 'rating') {
    return typeof value.selected === 'number';
  }
  if (question.type === 'true_false') {
    return typeof value.bool === 'boolean';
  }
  if (question.type === 'match') {
    return (Array.isArray(value.pairs) && value.pairs.length > 0)
      || (Array.isArray(value.matches) && value.matches.some(match => typeof match === 'string' && match.length > 0));
  }
  if (question.type === 'ordering') {
    return Array.isArray(value.order) && value.order.length > 0;
  }
  if (question.type === 'fill_blanks') {
    return Array.isArray(value.blanks) && value.blanks.some(blank => typeof blank === 'string' && blank.trim().length > 0);
  }
  return Object.keys(value).length > 0;
}

export function TestPlayer({ test, forceDevice, responseId, sessionStartedAt, initialConsumedAudio }: Props) {
  // Single source of truth for "which device layout are we rendering".
  // Surfaces declare device explicitly (forceDevice) when they're known
  // to be a preview/builder; live runtime derives it from viewport width.
  // Component CSS reads CSS custom properties set by data-test-device on
  // the .test-player root — no @container / @media branches needed.
  const [liveDevice, setLiveDevice] = useState<'mobile' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth <= 640 ? 'mobile' : 'desktop';
  });
  useEffect(() => {
    if (forceDevice) return;
    const onResize = () => setLiveDevice(window.innerWidth <= 640 ? 'mobile' : 'desktop');
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [forceDevice]);
  const device: 'mobile' | 'desktop' = forceDevice ?? liveDevice;

  /* localStorage key for autosaving in-progress answers, so an
     accidental refresh (or tab crash) restores them instead of wiping
     the test. Keyed by the per-session responseId when available; falls
     back to slug + respondent token so it's still per-respondent if the
     session row couldn't be opened. Preview/builder surfaces
     (forceDevice set) skip autosave entirely — they're for authoring,
     not real attempts. */
  const answersStorageKey = useMemo(() => {
    if (forceDevice) return null;
    if (responseId) return `blim-test-answers:${responseId}`;
    if (typeof window === 'undefined') return null;
    try { return `blim-test-answers:${test.slug}:${ensureRespondentToken(test.slug)}`; }
    catch { return null; }
  }, [forceDevice, responseId, test.slug]);

  const [phase, setPhase] = useState<Phase>('intro');
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<RespondentProfile>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [idx, setIdx] = useState(0);
  // 1 = forward (next), -1 = backward (prev). Drives slide direction.
  const [navDirection, setNavDirection] = useState<1 | -1>(1);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const goToIdx = useCallback((nextIdx: number | ((prev: number) => number)) => {
    setNavigatorOpen(false);
    setIdx(prev => {
      const next = typeof nextIdx === 'function' ? nextIdx(prev) : nextIdx;
      setNavDirection(next >= prev ? 1 : -1);
      return next;
    });
  }, []);
  /* Scroll-mode "current question" — the one the focus ring is on.
     Lifted here (rather than living inside ScrollBody) so the shared
     navigator can highlight it and the scroll-mode footer can render
     "i/total". Initialised to the first question and kept in sync by
     ScrollBody via setScrollActiveId. */
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(() => test.questions[0]?.id ?? null);
  /* Answers map — declared above the section block because the
     strict-mode per-section guard (goToNextSection) reads it. */
  const [answers, setAnswers] = useState<Record<string, AnswerSubmission['value']>>({});

  /* ── Sections (stage-b) ──────────────────────────────────────────
     `sectionGroups` is the ordered list of { section, questions } when
     the test has sections — LAYOUT-AGNOSTIC (used by both scroll's
     section-by-section paging AND card mode's navigator grouping +
     per-section audio). An implicit trailing group holds any
     unsectioned questions so nothing is ever dropped. `null` when the
     test has no sections (behaves exactly as stage-a). Declared up here
     because attemptSubmit/navigatorFinish reference it. */
  const sectionGroups = useMemo(() => {
    const secs = [...(test.sections ?? [])].sort((a, b) => a.position - b.position);
    if (secs.length === 0) return null;
    const groups: Array<{ section: PublicSection | null; questions: PublicQuestion[] }> =
      secs.map(s => ({ section: s, questions: test.questions.filter(qq => qq.section_id === s.id) }));
    const known = new Set(secs.map(s => s.id));
    const unsectioned = test.questions.filter(qq => !qq.section_id || !known.has(qq.section_id));
    if (unsectioned.length) groups.push({ section: null, questions: unsectioned });
    return groups.filter(g => g.questions.length > 0);
  }, [test.sections, test.questions]);

  /* Scroll-mode section-by-section paging applies only in scroll layout. */
  const isSectioned = !!sectionGroups && sectionGroups.length > 0 && test.layout === 'scroll';
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const currentGroup = isSectioned ? sectionGroups![Math.min(currentSectionIdx, sectionGroups!.length - 1)] : null;
  const isLastSection = !isSectioned || currentSectionIdx >= (sectionGroups!.length - 1);

  /* Advance to the next section: scroll to top, focus its first
     question. In strict mode there's no going back (the Back control is
     hidden in the footer), so we MUST enforce the current section's
     required questions before leaving it — otherwise a blank required
     answer becomes unfixable. In non-strict mode the student can return
     via Back, so Next-section advances freely (consistent with the
     "navigation never blocks" rule; the final Submit still validates). */
  const goToNextSection = useCallback(() => {
    if (!sectionGroups) return;
    if (test.strict_sections) {
      const group = sectionGroups[currentSectionIdx];
      const firstMissing = group?.questions.find(qq => qq.required && !hasQuestionAnswer(qq, answers[qq.id]));
      if (firstMissing) {
        setSubmitAttempted(true);
        setScrollActiveId(firstMissing.id);
        const el = typeof document !== 'undefined'
          ? document.querySelector(`[data-qid="${firstMissing.id}"]`) as HTMLElement | null
          : null;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return; // block advance until the section's required are answered
      }
    }
    setCurrentSectionIdx(prev => {
      const next = Math.min(prev + 1, sectionGroups.length - 1);
      const firstQ = sectionGroups[next]?.questions[0];
      if (firstQ) setScrollActiveId(firstQ.id);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
      return next;
    });
  }, [sectionGroups, test.strict_sections, currentSectionIdx, answers]);

  const goToPrevSection = useCallback(() => {
    if (!sectionGroups) return;
    setCurrentSectionIdx(prev => {
      const next = Math.max(prev - 1, 0);
      const firstQ = sectionGroups[next]?.questions[0];
      if (firstQ) setScrollActiveId(firstQ.id);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
      return next;
    });
  }, [sectionGroups]);

  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardOverflowing, setCardOverflowing] = useState(false);

  /* ── Play-once listening audio ───────────────────────────────────
     `playOnce` (test setting, off in preview) drives the locked
     ListeningAudioBar. `consumedAudio` is the set of tracks (section id
     or 'global') already played by this respondent — seeded from the
     server session so a refresh re-locks them. `markAudioConsumed`
     records a track locally + persists it so the lock survives reload. */
  const playOnce = !!test.play_once_audio && !forceDevice;
  const [consumedAudio, setConsumedAudio] = useState<Set<string>>(() => new Set(initialConsumedAudio ?? []));
  const markAudioConsumed = useCallback((trackId: string) => {
    setConsumedAudio(prev => {
      if (prev.has(trackId)) return prev;
      const next = new Set(prev);
      next.add(trackId);
      return next;
    });
    if (forceDevice) return; // preview: don't persist
    void (async () => {
      try {
        await fetch(`/api/t/${test.slug}/audio-consumed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondent_token: ensureRespondentToken(test.slug),
            response_id: responseId,
            track_id: trackId,
          }),
        });
      } catch { /* best-effort; the local set still locks for this load */ }
    })();
  }, [forceDevice, responseId, test.slug]);

  /* ── Audio-lock gating ───────────────────────────────────────────
     When `test.audio_lock` is on, a SECTION's audio must finish before
     the respondent can leave that section (card mode) / advance past it
     (scroll mode). Per-question `audioMustFinish` gates Next while that
     question's own audio media hasn't completed. `audioDone` is the set
     of audio tracks (section id, 'global', or 'q:{questionId}') that
     have played through at least once this session. A play-once track
     consumed before a refresh counts as heard, so we seed from
     `consumedAudio`. Replays stay unlocked — once a track is in the set
     it never leaves it. Preview/builder (forceDevice) is never locked. */
  const [audioDone, setAudioDone] = useState<Set<string>>(() => new Set(initialConsumedAudio ?? []));
  const markAudioDone = useCallback((key: string) => {
    setAudioDone(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  /* ── Refresh-resilient autosave ──────────────────────────────────
     Persist the in-progress attempt (answers + collected respondent
     info + a "started" flag) to localStorage so an accidental refresh
     or tab crash restores everything instead of wiping the test. */
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !answersStorageKey) return;
    restoredRef.current = true;
    try {
      const raw = window.localStorage.getItem(answersStorageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        answers?: Record<string, AnswerSubmission['value']>;
        name?: string;
        profile?: RespondentProfile;
        started?: boolean;
        sectionIdx?: number;
        audioDone?: string[];
      };
      if (saved.answers && typeof saved.answers === 'object') setAnswers(saved.answers);
      if (typeof saved.name === 'string') setName(saved.name);
      if (saved.profile && typeof saved.profile === 'object') setProfile(saved.profile);
      /* Restore which audio tracks were already heard so an accidental
         refresh doesn't re-arm the audio-lock and force a re-listen. */
      if (Array.isArray(saved.audioDone) && saved.audioDone.length) {
        setAudioDone(prev => new Set([...prev, ...saved.audioDone!]));
      }
      /* Restore the section the student was on (scroll sectioned mode)
         so a refresh doesn't bounce them back to section 1. */
      if (typeof saved.sectionIdx === 'number' && saved.sectionIdx >= 0) setCurrentSectionIdx(saved.sectionIdx);
      /* If they'd already begun the questions, skip the welcome screen on
         resume so a refresh drops them straight back where they were. */
      if (saved.started) setPhase('question');
    } catch { /* ignore corrupt / blocked storage */ }
  }, [answersStorageKey]);

  /* Seed worked-example answers with their (revealed) correct value so they
     submit + satisfy the required-guard. Runs after the restore effect above
     (defined later = applied to the post-restore state) and only ADDS example
     keys, so a resume isn't clobbered. Example inputs are locked, so this value
     can never be changed by the student; grading ignores examples entirely. */
  const exampleSeededRef = useRef(false);
  useEffect(() => {
    if (exampleSeededRef.current) return;
    exampleSeededRef.current = true;
    const seed: Record<string, AnswerSubmission['value']> = {};
    for (const question of test.questions) {
      if (question.isExample && question.exampleValue) seed[question.id] = question.exampleValue;
    }
    if (Object.keys(seed).length) setAnswers(prev => ({ ...prev, ...seed }));
  }, [test.questions]);

  /* Autosave on any change to the things worth restoring. Skips empty
     pre-start state so we never clobber a fresh restore with blanks. */
  useEffect(() => {
    if (!answersStorageKey || !restoredRef.current) return;
    const started = phase === 'question' || phase === 'submitting';
    if (!started && Object.keys(answers).length === 0) return;
    try {
      window.localStorage.setItem(answersStorageKey, JSON.stringify({ answers, name, profile, started, sectionIdx: currentSectionIdx, audioDone: [...audioDone] }));
    } catch { /* quota / private mode — autosave is best-effort */ }
  }, [answers, name, profile, phase, currentSectionIdx, audioDone, answersStorageKey]);

  const total = test.questions.length;
  const q: PublicQuestion | undefined = test.questions[idx];
  const answer = useMemo(() => (q ? (answers[q.id] ?? {}) : {}), [q, answers]);
  const answeredCount = useMemo(
    () => test.questions.filter(question => hasQuestionAnswer(question, answers[question.id])).length,
    [answers, test.questions],
  );
  const mobileWallpaperMedia = undefined;
  const welcomeScreen = test.welcome_screen?.enabled ? test.welcome_screen : null;
  const endScreen = test.end_screen?.enabled ? test.end_screen : null;

  /* Skip the intro phase entirely when the test owner has disabled the
     welcome screen — go straight to the first question. Without this
     guard the player would render a fallback "Survey" intro card built
     from the test title even when the teacher explicitly turned the
     welcome screen off. */
  useEffect(() => {
    if (phase === 'intro' && !welcomeScreen) setPhase('question');
  }, [phase, welcomeScreen]);
  const timerLimitSeconds = test.timer_enabled && test.time_limit_seconds && test.time_limit_seconds > 0
    ? Math.round(test.time_limit_seconds)
    : null;
  const normalizedTheme = useMemo(() => normalizeTestTheme(test.theme), [test.theme]);
  const themeVars = useMemo(() => testThemeCssVars(test.theme), [test.theme]);

  const canAdvance = useMemo(() => {
    if (!q) return false;
    if (!q.required) return true;
    if (q.type === 'multiple_choice' || q.type === 'picture_choice') {
      const opts = q.options as { allowMultiple?: boolean };
      if (opts.allowMultiple) return Array.isArray(answer.selectedIds) && answer.selectedIds.length > 0;
      return typeof answer.selected === 'number' || typeof answer.selectedId === 'string';
    }
    if (q.type === 'short_text' || q.type === 'long_answer' || q.type === 'number') {
      return !!answer.text && answer.text.trim().length > 0;
    }
    if (q.type === 'dropdown') return typeof answer.selectedId === 'string' && answer.selectedId.length > 0;
    if (q.type === 'checkbox') return Array.isArray(answer.selectedIds) && answer.selectedIds.length > 0;
    if (q.type === 'opinion_scale' || q.type === 'rating') return typeof answer.selected === 'number';
    if (q.type === 'true_false') return typeof answer.bool === 'boolean';
    if (q.type === 'match') {
      const need = (q.options as { left?: unknown[] }).left?.length ?? 0;
      if (Array.isArray(answer.pairs)) {
        const lefts = new Set<number>();
        const rights = new Set<string>();
        answer.pairs.forEach(pair => {
          if (Number.isInteger(pair.leftIndex) && typeof pair.rightId === 'string' && pair.rightId.length > 0) {
            lefts.add(pair.leftIndex);
            rights.add(pair.rightId);
          }
        });
        return lefts.size === need && rights.size === need;
      }
      return Array.isArray(answer.matches) && answer.matches.length === need
        && answer.matches.every(v => typeof v === 'string' && v.length > 0);
    }
    if (q.type === 'ordering') {
      const need = (q.options as { items?: unknown[] }).items?.length ?? 0;
      return Array.isArray(answer.order) && answer.order.length === need
        && answer.order.every(v => typeof v === 'string' && v.length > 0);
    }
    if (q.type === 'fill_blanks') {
      const need = (q.options as { blanks?: number }).blanks ?? 0;
      return Array.isArray(answer.blanks)
        && answer.blanks.length === need
        && answer.blanks.every(s => typeof s === 'string' && s.trim().length > 0);
    }
    if (q.type === 'scramble') {
      const need = (q.options as { tiles?: unknown[] }).tiles?.length ?? 0;
      return Array.isArray(answer.tileIds)
        && answer.tileIds.length === need
        && answer.tileIds.every(id => typeof id === 'string' && id.length > 0);
    }
    return false;
  }, [q, answer]);

  const isLast = idx === total - 1;

  const submit = useCallback(async (timedOut = false) => {
    setPhase('submitting');
    if (timedOut) setTimeExpired(true);
    setErrMsg(null);
    const token = ensureRespondentToken(test.slug);
    const profileName = respondentLabel(profile);
    const payload = {
      respondent_token: token,
      /* When the page opened a session up front (POST /session), the
         server-side responses route will UPDATE that row instead of
         INSERTing a new one — preserving the shuffle seed tied to
         this respondent. */
      response_id: responseId,
      respondent_name: profileName || name,
      respondent_profile: {
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        email: profile.email,
      },
      started_at: startedAt ?? new Date().toISOString(),
      timed_out: timedOut,
      answers: Object.entries(answers).map(([qid, value]) => ({ question_id: qid, value })),
    };
    const res = await fetch(`/api/t/${test.slug}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErrMsg(j.error ?? 'Submission failed');
      setPhase('error');
      return;
    }
    const j = await res.json();
    setDone({ score: j.score ?? null, total: j.total ?? null, sections: Array.isArray(j.sections) ? j.sections : [] });
    setPhase('done');
    /* Clear the session marker + autosaved answers now that the row has
       been completed — a refresh of the done screen would otherwise
       post-submit the same row and 409, and stale answers shouldn't
       linger for a fresh attempt. */
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(`blim-test-session-${test.slug}`); } catch { /* ignore */ }
      if (answersStorageKey) {
        try { window.localStorage.removeItem(answersStorageKey); } catch { /* ignore */ }
      }
    }
  }, [answers, answersStorageKey, name, profile, responseId, startedAt, test.slug]);

  /* Warn before an accidental refresh / tab-close while a test is in
     progress with unsaved-to-server work. Answers are autosaved to
     localStorage so they survive anyway, but the native prompt prevents
     most accidental reloads in the first place. Only armed during the
     question phase with at least one answer entered. */
  useEffect(() => {
    if (forceDevice) return; // never in builder/preview
    if (phase !== 'question') return;
    if (Object.keys(answers).length === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [forceDevice, phase, answers]);

  /* Index of the first required question with no answer (across the
     whole test, not just the current one), or -1 if all required are
     answered. Used to block submission and jump the respondent to the
     gap — covers navigator jumps + the "Finish the test" button, which
     otherwise reach submit() with required questions still blank. */
  const firstMissingRequiredIdx = useMemo(() => {
    for (let i = 0; i < test.questions.length; i++) {
      const qq = test.questions[i];
      if (qq.required && !hasQuestionAnswer(qq, answers[qq.id])) return i;
    }
    return -1;
  }, [test.questions, answers]);

  /* Set true once the user has tried to finish with a required question
     still blank. While true, the "this question is required" message is
     shown on EVERY unanswered required question as the user navigates
     to it (not just the one we jumped to). Reset on a clean submit. */
  const [submitAttempted, setSubmitAttempted] = useState(false);

  /* Single entry point for finishing the test. Navigation (Next) never
     blocks on required questions — only this finish path validates. If
     a required question is unanswered, jump to the first one and arm the
     per-question required messages instead of letting the server reject
     with missing_required. */
  const attemptSubmit = useCallback(() => {
    if (firstMissingRequiredIdx >= 0) {
      setNavigatorOpen(false);
      goToIdx(firstMissingRequiredIdx);
      setSubmitAttempted(true);
      return;
    }
    setSubmitAttempted(false);
    void submit();
  }, [firstMissingRequiredIdx, goToIdx, submit]);

  /* Scroll the target question to the centre of the *visible* viewport
     (i.e. excluding the fixed footer at the bottom and, when present,
     the listening audio bar at the top). `Element.scrollIntoView({
     block: 'center' })` centres against the raw 100vh viewport, which
     places the question visually low because the bottom band is
     covered by the footer. Computing the offset manually against the
     unobstructed visible region puts it where the eye expects. */
  const centreInViewport = useCallback((el: HTMLElement) => {
    if (typeof window === 'undefined') return;
    /* Approximate fixed-chrome heights. The footer is ~80px on
       desktop, slightly taller on mobile because of the safe area. */
    const audioBarHeight = test.listening_audio_url ? 96 : 0;
    const footerHeight = window.innerWidth <= 640 ? 96 : 80;
    const visibleTop = audioBarHeight;
    const visibleBottom = window.innerHeight - footerHeight;
    const visibleCentre = (visibleTop + visibleBottom) / 2;
    const rect = el.getBoundingClientRect();
    const elementCentre = rect.top + rect.height / 2;
    const delta = elementCentre - visibleCentre;
    window.scrollTo({ top: window.scrollY + delta, behavior: 'smooth' });
  }, [test.listening_audio_url]);

  /* Layout-aware "go to question N" used by the shared Navigator
     overlay. Card mode jumps the current index; scroll mode scrolls the
     target item into the visible-region centre (and updates the active
     id so the focus ring moves immediately, without waiting for the
     IntersectionObserver). */
  const navigatorGoTo = useCallback((targetIdx: number) => {
    setNavigatorOpen(false);
    const target = test.questions[targetIdx];
    if (!target) return;
    if (test.layout === 'scroll') {
      const el = typeof document !== 'undefined'
        ? document.querySelector(`[data-qid="${target.id}"]`) as HTMLElement | null
        : null;
      if (el) centreInViewport(el);
      setScrollActiveId(target.id);
    } else {
      goToIdx(targetIdx);
    }
  }, [centreInViewport, test.layout, test.questions, goToIdx]);

  /* Layout-aware "finish the test" used by both the Navigator overlay
     and the scroll-mode footer Submit button. Card mode goes through
     `attemptSubmit` (which jumps + flags). Scroll mode scrolls to the
     first missing required question; otherwise it submits. */
  const navigatorFinish = useCallback(() => {
    setNavigatorOpen(false);
    if (test.layout === 'scroll') {
      if (firstMissingRequiredIdx >= 0) {
        const missing = test.questions[firstMissingRequiredIdx];
        setSubmitAttempted(true); // arm per-item required messages
        /* Sectioned: if the missing required is in a different section,
           switch to that section first (its item then renders with the
           required note). Same section → just scroll to it. */
        if (sectionGroups) {
          const targetSecIdx = sectionGroups.findIndex(g => g.questions.some(qq => qq.id === missing.id));
          if (targetSecIdx >= 0 && targetSecIdx !== currentSectionIdx) {
            setCurrentSectionIdx(targetSecIdx);
            setScrollActiveId(missing.id);
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
            return;
          }
        }
        const el = typeof document !== 'undefined'
          ? document.querySelector(`[data-qid="${missing.id}"]`) as HTMLElement | null
          : null;
        if (el) centreInViewport(el);
        setScrollActiveId(missing.id);
        return;
      }
      setSubmitAttempted(false);
      void submit();
    } else {
      attemptSubmit();
    }
  }, [attemptSubmit, centreInViewport, firstMissingRequiredIdx, submit, test.layout, test.questions, sectionGroups, currentSectionIdx]);

  /* For the shared Navigator + scroll-mode footer progress display. */
  const scrollActiveIdx = useMemo(() => {
    if (test.layout !== 'scroll') return idx;
    if (!scrollActiveId) return 0;
    const i = test.questions.findIndex(qq => qq.id === scrollActiveId);
    return i >= 0 ? i : 0;
  }, [test.layout, scrollActiveId, idx, test.questions]);

  const startQuestions = useCallback(() => {
    /* Timer is anchored to the server session start (see the effect
       below), NOT stamped here — so it doesn't reset on refresh and a
       reload can't buy more time. We only flip the phase; startedAt and
       timerEndsAt are derived from sessionStartedAt. */
    setTimeExpired(false);
    setPhase('question');
  }, []);

  /* Anchor the countdown to the server-recorded session start. Computed
     whenever sessionStartedAt + a time limit are known, so on a refresh
     it recomputes the SAME end time and the clock continues from where
     it was. Also fixes timers on tests with no welcome screen (where
     startQuestions was never called). Falls back to "now" only if the
     server didn't supply a start (offline session-open failure). */
  useEffect(() => {
    /* Authoring surfaces (builder/preview, `forceDevice` set) must NOT
       anchor to the real session's `started_at`. A timed test whose
       session was opened earlier is already past its limit, so anchoring
       to it would make the preview load with the clock at 0 and instantly
       auto-submit to the end screen. Anchor preview to "now" so it shows a
       fresh full countdown purely for display (auto-submit is also gated
       off below). */
    const anchorIso = forceDevice ? new Date().toISOString() : sessionStartedAt;
    const anchorMs = anchorIso ? new Date(anchorIso).getTime() : NaN;
    const startMs = Number.isFinite(anchorMs) ? anchorMs : Date.now();
    setStartedAt(anchorIso ?? new Date(startMs).toISOString());
    if (timerLimitSeconds) {
      const ends = startMs + timerLimitSeconds * 1000;
      setTimerEndsAt(ends);
      setRemainingSeconds(Math.max(0, Math.ceil((ends - Date.now()) / 1000)));
    }
  }, [sessionStartedAt, timerLimitSeconds, forceDevice]);

  const onChange = (v: AnswerSubmission['value']) => {
    if (!q) return;
    setAnswers({ ...answers, [q.id]: v });
  };

  /* Scroll mode answers any question (not just the active one), so it
     needs an id-addressed setter rather than the active-q `onChange`. */
  const setAnswerFor = useCallback((qid: string, v: AnswerSubmission['value']) => {
    setAnswers(prev => ({ ...prev, [qid]: v }));
  }, []);

  // Keyboard shortcuts: Enter to advance, 1-9 to pick mc choice
  useEffect(() => {
    if (phase !== 'question' || !q) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        // Let typing happen; only Enter triggers advance for short text via Cmd+Enter
        return;
      }
      if (e.key === 'Enter') {
        /* Enter advances freely (mirrors the Next button) — required
           questions are only enforced at the final Submit. */
        if (isLast) attemptSubmit();
        else goToIdx(i => i + 1);
        return;
      }
      if ((q.type === 'multiple_choice' || q.type === 'checkbox') && /^[1-9]$/.test(e.key)) {
        const opts = q.options as { choices: { id: string }[]; allowMultiple?: boolean };
        const i = parseInt(e.key, 10) - 1;
        const choice = opts.choices[i];
        if (!choice) return;
        if (q.type === 'multiple_choice' && !opts.allowMultiple) {
          onChange({ selectedId: choice.id });
          return;
        }
        const current = answer.selectedIds ?? [];
        onChange({
          selectedIds: current.includes(choice.id)
            ? current.filter(id => id !== choice.id)
            : [...current, choice.id],
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  useEffect(() => {
    if (phase !== 'question' || !timerEndsAt) return;

    let submitted = false;
    const tick = () => {
      const next = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
      setRemainingSeconds(next);
      /* Preview/builder (forceDevice) never auto-submits — it's authoring,
         not a real attempt. The countdown is display-only there. */
      if (next <= 0 && !submitted && !forceDevice) {
        submitted = true;
        void submit(true);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [phase, timerEndsAt, submit, forceDevice]);

  useEffect(() => {
    if (phase !== 'question') return;
    const card = cardRef.current;
    if (!card) return;

    const measure = () => {
      const overflowing = card.scrollHeight > card.clientHeight + 1;
      setCardOverflowing(overflowing);
      if (overflowing && card.scrollTop < 1) card.scrollTop = 0;
    };

    measure();
    const raf = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    window.addEventListener('resize', measure);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [phase, q?.id, answer]);

  if (phase === 'intro') {
    /* Welcome screen disabled — render nothing while the effect above
       advances to 'question'. Prevents one-tick flash of the fallback
       Survey/Quiz intro. */
    if (!welcomeScreen) return null;
    const title = welcomeScreen.title || test.title;
      const description = welcomeScreen.description ?? '';
      const buttonText = welcomeScreen.buttonText || 'Start';
      const collectorFields = welcomeCollectorFields(welcomeScreen);
      const hasCollectorFields = collectorFields.length > 0;
      const hasMedia = !!welcomeScreen.imageUrl;
      /* Content alignment is the single switch on desktop: it always
         drives a 50/50 split. The content occupies its half; the
         other half holds the media (if uploaded) or stays empty.
         Either way the content's position is identical, so toggling
         media on/off doesn't shift the form.

         Mobile ignores all of this — content centers, media hidden. */
      /* Alignment drives the 50/50 split unconditionally on desktop —
         fields off or on, the content stays in its half so the layout
         doesn't shift when fields toggle. */
      const alignmentModifier =
        welcomeScreen.collectorLayout === 'left'
          ? 'test-player-screen__card--align-left'
          : 'test-player-screen__card--align-right';

      return (
        <ScreenWrapper>
          <div
            className={[
              'test-player-screen__card',
              hasCollectorFields ? 'test-player-screen__card--with-collector' : '',
              alignmentModifier,
            ].filter(Boolean).join(' ')}
            data-test-device={device}
            style={publicScreenCard}
          >
            {/* Always render the media element when content is split-aligned
                (desktop only — mobile hides via @media). When no imageUrl,
                the half stays visually empty but the layout is identical
                to the with-media case, so the content position doesn't
                shift when an image is added or removed. */}
            <div
              className="test-player-screen__media"
              style={hasMedia ? { backgroundImage: `url(${welcomeScreen.imageUrl})` } : undefined}
              aria-hidden
            />
            <div className="test-player-screen__content" style={publicScreenContent}>
              <h1 style={publicScreenTitle}>{title}</h1>
              {description ? (
                <p style={publicScreenDescription}>{description}</p>
              ) : null}
              {/* Collector fields go between description and the Start
                  button so the CTA sits at the natural bottom of the
                  form. Field labels are omitted — the placeholder
                  inside each input already labels it. */}
              {hasCollectorFields ? (
                <div className="test-player-screen__collector" style={publicCollectorBlock}>
                  {collectorFields.map(field => (
                    <div key={field.key} style={publicNameBlock}>
                      {field.key === 'phone' ? (
                        <span style={publicPhoneInputWrap}>
                          <span style={publicPhonePrefix}>+998</span>
                          <input
                            type={field.type}
                            inputMode="numeric"
                            value={phoneLocalValue(profile.phone)}
                            onChange={event => setProfile(current => ({ ...current, phone: normalizeUzbekPhoneInput(event.target.value) }))}
                            placeholder={field.placeholder}
                            aria-label={field.label}
                            style={{ ...publicNameInput, ...publicPhoneInput }}
                          />
                        </span>
                      ) : (
                        <input
                          type={field.type}
                          value={profile[field.key]}
                          onChange={event => setProfile(current => ({ ...current, [field.key]: event.target.value }))}
                          placeholder={field.placeholder}
                          aria-label={field.label}
                          style={publicNameInput}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={startQuestions}
                disabled={total === 0}
                style={publicScreenButton(total === 0)}
              >
                {total === 0 ? 'No questions yet' : buttonText}
              </button>
              {welcomeScreen.showTimeToComplete ? (
                <div style={publicScreenMeta}>
                  <AlarmClockIcon />
                  <span>{timerLimitSeconds ? `Time limit: ${formatDuration(timerLimitSeconds)}` : welcomeScreen.timeToCompleteText || `Takes ${Math.max(1, Math.ceil(total / 4))} minutes`}</span>
                </div>
              ) : null}
              {test.show_branding ? (
                <a
                  href="https://test.blim.uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="test-player-screen__branding"
                >
                  Made with Blim
                </a>
              ) : null}
            </div>
          </div>
        </ScreenWrapper>
      );
  }

  if (phase === 'done') {
    const title = endScreen?.title || 'Submitted';
    const description = endScreen?.description || 'Your answers were submitted.';
    const buttonText = endScreen?.buttonText || '';
    /* End screen reuses the welcome-screen card shell so colour, font,
       centering and mobile chrome all match. No alignment/media split
       — end screen always centers its content column inside the card. */
    return (
      <ScreenWrapper>
        <div
          className="test-player-screen__card"
          data-test-device={device}
          style={publicScreenCard}
        >
          <div className="test-player-screen__content" style={publicScreenContent}>
            {endScreen?.imageUrl ? <img src={endScreen.imageUrl} alt="" style={screenImage} /> : null}
            <h1 style={publicScreenTitle}>{title}</h1>
            {test.is_graded && done?.score != null ? (
              <p style={publicScreenDescription}>
                Score: <b style={{ color: '#1c1626' }}>{done.score}</b>
                {done.total != null ? <> / <b style={{ color: '#1c1626' }}>{done.total}</b></> : null}
              </p>
            ) : (
              <p style={publicScreenDescription}>
                {timeExpired ? 'Time is up. Your answers were submitted.' : description}
              </p>
            )}
            {test.is_graded && done?.sections && done.sections.length > 0 ? (
              <SectionScoreBreakdown sections={done.sections} />
            ) : null}
            {endScreen?.showSocialShare ? (
              <div style={socialRow}>
                <span>Share</span><span>𝕏</span><span>f</span><span>in</span>
              </div>
            ) : null}
            {buttonText ? (
              <button
                type="button"
                onClick={() => {
                  if (endScreen?.buttonLinkEnabled && endScreen.buttonLink) {
                    window.location.href = endScreen.buttonLink;
                  }
                }}
                style={publicScreenButton(false)}
              >
                {buttonText}
              </button>
            ) : null}
          </div>
        </div>
      </ScreenWrapper>
    );
  }

  if (phase === 'error') {
    return (
      <Wrapper themeVars={themeVars} device={device}>
        <h1 style={{ ...introTitle, color: '#b91c1c' }}>
          Submission failed
        </h1>
        <p style={introText}>{errMsg}</p>
        <button
          type="button"
          onClick={() => submit()}
          style={primaryButton(false)}
        >Try again</button>
      </Wrapper>
    );
  }

  if (!q) return null;

  /* Continuous listening audio is independent of layout. Which track
     plays depends on whether the test has sections:
     - SCROLL + sections → the CURRENT section's track (switches when the
       student advances to the next section).
     - CARD + sections → the CURRENT card question's section track
       (switches as Next/Back crosses a section boundary).
     - no sections → the test-level `listening_audio_url`.
     The `audioKey` forces a fresh <audio> on each track change so the
     new file actually loads + autoplays. The bar is fixed to the top of
     the viewport above whichever layout renders below. */
  const cardQuestionSection = sectionGroups
    ? sectionGroups.find(g => g.section && g.questions.some(qq => qq.id === q.id))?.section ?? null
    : null;
  const activeAudioUrl = isSectioned
    ? (currentGroup?.section?.audio_url ?? null)
    : (sectionGroups ? (cardQuestionSection?.audio_url ?? null) : (test.listening_audio_url ?? null));
  const audioKey = isSectioned
    ? `sec-${currentSectionIdx}`
    : (sectionGroups ? `card-sec-${cardQuestionSection?.id ?? 'none'}` : 'global');
  /* Track identity for play-once consumption: the section's id when the
     audio belongs to a section, else 'global' for the test-level track. */
  const activeAudioTrackId = isSectioned
    ? (currentGroup?.section?.id ?? 'global')
    : (sectionGroups ? (cardQuestionSection?.id ?? 'global') : 'global');
  const audioActive = !!activeAudioUrl && phase === 'question';
  const listeningBar = audioActive ? (
    <ListeningAudioBar
      key={audioKey}
      url={activeAudioUrl!}
      playOnce={playOnce}
      consumed={consumedAudio.has(activeAudioTrackId)}
      onConsumed={() => markAudioConsumed(activeAudioTrackId)}
      onEnded={() => markAudioDone(activeAudioTrackId)}
    />
  ) : null;

  /* ── Audio-lock gating (card mode) ────────────────────────────────
     Two independent locks, never applied in preview (forceDevice):
     1. SECTION / listening audio — when `test.audio_lock` is on, the
        current ListeningAudioBar track must finish before a Next that
        LEAVES that track (crosses into a question on a different track,
        or Submits on the last question). Advancing within the same
        track is free. For a sectionless test this means the global
        track only gates the final Submit.
     2. PER-QUESTION audio — `q.audioMustFinish` blocks Next until this
        question's own audio media has played through once. */
  const nextQuestion = isLast ? null : test.questions[idx + 1];
  const nextAudioTrackId = nextQuestion
    ? (sectionGroups
        ? (sectionGroups.find(g => g.section && g.questions.some(qq => qq.id === nextQuestion.id))?.section?.id ?? 'global')
        : 'global')
    : null;
  const sectionAudioLocked = !forceDevice && audioActive && !!test.audio_lock
    && !audioDone.has(activeAudioTrackId)
    && (isLast || nextAudioTrackId !== activeAudioTrackId);
  const questionAudioLocked = !forceDevice && !!q.audioMustFinish
    && q.media?.type === 'audio' && !audioDone.has(`q:${q.id}`);
  const audioLocked = sectionAudioLocked || questionAudioLocked;
  const nextBlocked = phase === 'submitting' || audioLocked;

  /* ── Scroll mode (IELTS / SurveyMonkey-style) ──────────────────────
     All questions stacked on one scrollable page; the active question
     (nearest viewport centre) stays lit while the rest dim. Shares every
     other concern (answers, grading, submission, required-guard) with
     card mode. */
  if (test.layout === 'scroll') {
    return (
      <>
        {listeningBar}
        <ScrollBody
          test={test}
          items={isSectioned ? currentGroup!.questions : test.questions}
          device={device}
          themeVars={themeVars}
          answers={answers}
          onAnswer={setAnswerFor}
          onSubmit={navigatorFinish}
          onOpenNavigator={() => setNavigatorOpen(true)}
          responseId={responseId}
          activeId={scrollActiveId}
          setActiveId={setScrollActiveId}
          activeIdx={scrollActiveIdx}
          phase={phase}
          total={total}
          submitAttempted={submitAttempted}
          audioActive={audioActive}
          audioLockEnabled={!!test.audio_lock && !forceDevice}
          audioDone={audioDone}
          markAudioDone={markAudioDone}
          activeAudioTrackId={activeAudioTrackId}
          forceDevice={forceDevice}
          section={isSectioned ? {
            title: currentGroup!.section?.title || `Section ${currentSectionIdx + 1}`,
            index: currentSectionIdx,
            count: sectionGroups!.length,
            isLast: isLastSection,
            strict: !!test.strict_sections,
            onNext: goToNextSection,
            onPrev: goToPrevSection,
          } : null}
        />
        {/* phase is already narrowed to 'question'|'submitting' here
            by the earlier intro/done/error early returns. The numbered
            navigator is hidden in sectioned mode (cross-section jumps
            conflict with one-section-at-a-time + forward-only; a
            section-aware navigator is a later refinement). */}
        {navigatorOpen && !isSectioned ? (
          <NavigatorOverlay
            questions={test.questions}
            answers={answers}
            currentIdx={scrollActiveIdx}
            answeredCount={answeredCount}
            total={total}
            remainingSeconds={remainingSeconds}
            submitting={phase === 'submitting'}
            /* Sectionless scroll only reaches here (sectioned scroll
               hides the navigator), so no grouping. */
            sectionGroups={null}
            onClose={() => setNavigatorOpen(false)}
            onGoTo={navigatorGoTo}
            onFinish={navigatorFinish}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
    {listeningBar}
    <Wrapper wallpaperActive={!!mobileWallpaperMedia} themeVars={themeVars} device={device} audioActive={audioActive}>
      <QuestionMediaBlock
        media={mobileWallpaperMedia}
        className={`test-player__wallpaper-bg ${forceDevice === 'mobile' ? 'test-player__wallpaper-bg--force-mobile' : ''}`}
      />
      <AnimatePresence mode="wait" custom={navDirection} initial={false}>
      <motion.div
        ref={cardRef}
        key={q.id}
        custom={navDirection}
        variants={cardSlideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className={`test-player__card ${forceDevice ? `test-player__card--force-${forceDevice}` : ''} ${q.media?.url ? 'test-player__card--has-media' : 'test-player__card--no-media'} test-player__card--type-${q.type.replaceAll('_', '-')} ${cardOverflowing ? 'test-player__card--overflowing' : ''}`}
        style={{ ...questionCard, '--qmedia-card-pad-x': '52px', '--qmedia-card-pad-top': '48px' } as React.CSSProperties}
      >
          <QuestionMediaLayout
            media={q.media}
            forceDevice={forceDevice}
            onAudioEnded={() => markAudioDone(`q:${q.id}`)}
            /* Auto-start a locked question's audio so the student isn't
               stranded on a disabled Next. Only when the lock is on and
               not in preview. */
            autoPlayAudio={!forceDevice && !!q.audioMustFinish && q.media?.type === 'audio'}
            header={(
              <>
                {q.isExample ? <span className="test-player__example-badge" style={exampleBadge}>Example</span> : null}
                {q.instruction ? (
                  <p className="test-player__instruction" style={questionInstruction} dir="auto" lang={detectScriptLang(q.instruction)}>
                    <MathText>{q.instruction}</MathText>
                  </p>
                ) : null}
                <h2 className="test-player__title" style={questionTitle} dir="auto" lang={detectScriptLang(q.prompt)}>
                  {q.prompt ? <MathText>{q.prompt}</MathText> : '…'}
                </h2>
                {q.description ? (
                  <p className="test-player__description" style={questionDescription} dir="auto" lang={detectScriptLang(q.description)}>
                    <MathText>{q.description}</MathText>
                  </p>
                ) : null}
              </>
            )}
            answer={(
              <div style={answerWrap}>
                <div style={q.isExample ? exampleLockedWrap : undefined} aria-disabled={q.isExample || undefined}>
                  <QuestionRenderer
                    question={q}
                    value={q.isExample ? (q.exampleValue ?? {}) : answer}
                    onChange={q.isExample ? noop : onChange}
                    onSubmit={q.isExample ? noop : (() => { if (audioLocked) return; isLast ? attemptSubmit() : goToIdx(idx + 1); })}
                    slug={test.slug}
                    responseId={responseId}
                    respondentToken={ensureRespondentToken(test.slug)}
                  />
                </div>
              </div>
            )}
          />
      </motion.div>
      </AnimatePresence>

      {/* Shown on every unanswered required question once a finish was
          attempted — `!canAdvance` is true only for a required question
          that's still blank. */}
      {submitAttempted && !canAdvance && q.required ? (
        <div role="alert" style={requiredWarnBar}>
          This question is required — please answer it to finish.
        </div>
      ) : null}

      {/* Audio-lock hint — shown while a Next is blocked because the
          section/listening audio or this question's own audio hasn't
          finished playing yet. */}
      {audioLocked ? (
        <div role="status" style={audioLockBar}>
          Listen to the audio to continue.
        </div>
      ) : null}

      <div className="test-player__nav" style={navRow}>
        <button
          type="button"
          onClick={() => setNavigatorOpen(true)}
          style={secondaryButton(false)}
        >
          Questions
        </button>
        <div className="test-player__progress" style={navProgress}>
          {idx + 1} / {total}
        </div>
        <button
          type="button"
          onClick={() => { if (nextBlocked) return; isLast ? attemptSubmit() : goToIdx(idx + 1); }}
          /* Next never blocks on required questions — only the final
             Submit validates (and jumps to the first missing one).
             Disabled while a submission is in flight OR while an
             audio-lock is active (audio must finish first). */
          disabled={nextBlocked}
          style={primaryButton(nextBlocked)}
        >
          {phase === 'submitting' ? 'Submitting…' : isLast ? 'Submit' : 'Next'}
        </button>
      </div>

    </Wrapper>
    {/* Same Navigator used by scroll mode, supplied with card-mode
        handlers (goToIdx + attemptSubmit) so the existing card
        behaviour is preserved exactly. */}
    {navigatorOpen ? (
      <NavigatorOverlay
        questions={test.questions}
        answers={answers}
        currentIdx={idx}
        answeredCount={answeredCount}
        total={total}
        remainingSeconds={remainingSeconds}
        submitting={phase === 'submitting'}
        sectionGroups={sectionGroups}
        onClose={() => setNavigatorOpen(false)}
        onGoTo={(targetIdx) => { setNavigatorOpen(false); goToIdx(targetIdx); }}
        onFinish={() => { setNavigatorOpen(false); attemptSubmit(); }}
      />
    ) : null}
    </>
  );
}

/* Shared question-navigator overlay — numbered grid of all questions
   with answered/current state, optional time-left card, and a Finish
   button. Used by both card mode (Questions button in the card-mode
   nav row) and scroll mode (Questions button in the scroll footer).
   The two modes differ only in what `onGoTo` and `onFinish` do. */
function NavigatorOverlay({
  questions,
  answers,
  currentIdx,
  answeredCount,
  total,
  remainingSeconds,
  submitting,
  sectionGroups,
  onClose,
  onGoTo,
  onFinish,
}: {
  questions: PublicQuestion[];
  answers: Record<string, AnswerSubmission['value']>;
  currentIdx: number;
  answeredCount: number;
  total: number;
  remainingSeconds: number | null;
  submitting: boolean;
  /* When the test has sections, the grid is grouped under section
     titles. Each button still navigates by GLOBAL question index
     (computed from `questions`), so onGoTo semantics are unchanged. */
  sectionGroups: Array<{ section: PublicSection | null; questions: PublicQuestion[] }> | null;
  onClose: () => void;
  onGoTo: (targetIdx: number) => void;
  onFinish: () => void;
}) {
  const globalIdxById = new Map(questions.map((qq, i) => [qq.id, i] as const));
  const renderButton = (question: PublicQuestion) => {
    const questionIndex = globalIdxById.get(question.id) ?? 0;
    const answered = hasQuestionAnswer(question, answers[question.id]);
    const current = questionIndex === currentIdx;
    return (
      <button
        key={question.id}
        type="button"
        onClick={() => onGoTo(questionIndex)}
        aria-current={current ? 'step' : undefined}
        aria-label={`Go to question ${questionIndex + 1}${answered ? ', answered' : ', unanswered'}`}
        style={navigatorQuestionButton(current, answered)}
      >
        {questionIndex + 1}
      </button>
    );
  };
  return (
    <AnimatePresence>
      <motion.div
        style={navigatorOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Question navigator"
          style={navigatorPanel}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          onClick={event => event.stopPropagation()}
        >
          <button type="button" aria-label="Close questions" onClick={onClose} style={navigatorCloseButton}>×</button>
          {remainingSeconds != null ? (
            <section style={navigatorCard}>
              <div style={navigatorCardHeader}>
                <h3 style={navigatorCardTitle}>Time left</h3>
                <div style={navigatorTimerPill}>
                  <AlarmClockIcon />
                  <span>{formatClock(remainingSeconds)}</span>
                </div>
              </div>
            </section>
          ) : null}
          <section style={navigatorCard}>
            <div style={navigatorCardHeader}>
              <h3 style={navigatorCardTitle}>All questions</h3>
              <span style={navigatorCount}>{answeredCount}/{total}</span>
            </div>
            <div style={navigatorGridScroller}>
              {sectionGroups ? (
                /* Sectioned: each section gets a sub-header + its own grid. */
                sectionGroups.map((group, gi) => (
                  <div key={group.section?.id ?? `unsectioned-${gi}`} style={navigatorSectionBlock}>
                    <div style={navigatorSectionLabel}>
                      {group.section?.title || (group.section ? `Section ${gi + 1}` : 'Other questions')}
                    </div>
                    <div style={navigatorGrid}>
                      {group.questions.map(renderButton)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={navigatorGrid}>
                  {questions.map(renderButton)}
                </div>
              )}
            </div>
          </section>
          <button
            type="button"
            onClick={onFinish}
            disabled={submitting}
            style={navigatorFinishButton(submitting)}
          >
            Finish the test
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Wrapper({
  children,
  wallpaperActive = false,
  themeVars,
  device,
  audioActive = false,
}: {
  children: React.ReactNode
  wallpaperActive?: boolean
  themeVars?: Record<string, string>
  device?: 'mobile' | 'desktop'
  audioActive?: boolean
}) {
  /* When the global listening audio bar is mounted above this shell,
     push the centered card down so the bar doesn't obscure its top. */
  const shellStyle = audioActive
    ? { ...playerShell, paddingTop: 96, ...themeVars }
    : { ...playerShell, ...themeVars };
  return (
    <div
      className={`test-player${wallpaperActive ? ' test-player--wallpaper-active' : ''}`}
      data-test-device={device}
      style={shellStyle}
    >
      <div className="test-player__inner" style={playerInner}>{children}</div>
    </div>
  );
}

function ScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="test-player-screen" style={publicScreenShell}>
      {children}
    </div>
  );
}

function HeadphonesGlyph() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <path d="M21 17a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3z" />
      <path d="M3 17a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z" />
    </svg>
  );
}

/* Global listening-audio bar — fixed to the top of the viewport above
   whichever layout (card or scroll) is rendering. Audio is independent
   of layout: a test can have audio in either mode, or neither. The
   parent shells pad their top edges (96px) to keep their content from
   sliding under the bar. */
/* Results-by-section breakdown shown on the student's done screen (graded
   tests with sections). Each row: section title + correct/total. */
function SectionScoreBreakdown({ sections }: { sections: SectionScore[] }) {
  return (
    <div style={sectionBreakdownWrap}>
      {sections.map((s, i) => (
        <div key={s.section_id ?? `none-${i}`} style={sectionBreakdownRow}>
          <span style={sectionBreakdownTitle}>{s.title}</span>
          <span style={sectionBreakdownScore}>
            <b style={{ color: '#1c1626' }}>{s.correct}</b>
            <span style={{ opacity: 0.55 }}> / {s.total}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function ListeningAudioBar({ url, playOnce, consumed, onConsumed, onEnded }: {
  url: string;
  /* Play-once mode: no seek/replay; consumption persisted (refresh-proof). */
  playOnce: boolean;
  /* Whether THIS track was already consumed by the respondent (e.g. before
     a refresh). Snapshotted at mount to decide the locked state. */
  consumed: boolean;
  onConsumed: () => void;
  /* Fired when the track plays through to the end (audio-lock gating).
     Also fired once at mount when the track was already consumed before a
     refresh, so the lock doesn't strand a respondent who already heard it. */
  onEnded?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /* Snapshot `consumed` at mount: a track already consumed (after refresh)
     mounts locked. We deliberately ignore later `consumed` changes for THIS
     instance — when playback starts we mark the track consumed, which flips
     the prop, but the live bar must keep playing rather than re-lock. */
  const [lockedOnMount] = useState(playOnce && consumed);
  /* `started` flips true the moment playback begins (autoplay or the
     one-time Play tap), hiding the Play button so the bar is status-only
     from then on — no pause, scrub, or replay. */
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ended, setEnded] = useState(false);
  const maxTimeRef = useRef(0);
  const endedRef = useRef(false);
  const consumedFiredRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  /* Try to autoplay. Works when the student arrived via a Start click;
     otherwise the browser blocks it and the visible Play control lets them
     start it manually. Locked tracks never load/play. */
  useEffect(() => {
    const el = audioRef.current;
    if (!el || lockedOnMount) return;
    el.play().catch(() => { /* autoplay blocked — control remains */ });
  }, [url, lockedOnMount]);

  /* A track that mounts locked (play-once, already consumed before a
     refresh) has effectively been "heard" — fire onEnded once so the
     audio-lock gate doesn't trap a respondent who already listened. */
  useEffect(() => {
    if (lockedOnMount) onEndedRef.current?.();
  }, [lockedOnMount]);

  /* Locked: already played once. No audio element, no replay. */
  if (playOnce && lockedOnMount) {
    return (
      <div className="test-listening-bar" style={listeningBarStyle}>
        <div style={listeningBarInner}>
          <span style={listeningBarLabel}><HeadphonesGlyph /> Listening</span>
          <span style={listeningLockedNote}>Audio already played</span>
        </div>
      </div>
    );
  }

  /* Normal mode: full native controls (seek + replay allowed). */
  if (!playOnce) {
    return (
      <div className="test-listening-bar" style={listeningBarStyle}>
        <div style={listeningBarInner}>
          <span style={listeningBarLabel}><HeadphonesGlyph /> Listening</span>
          <audio
            ref={audioRef}
            src={url}
            controls
            style={{ flex: 1, minWidth: 0 }}
            onEnded={() => onEndedRef.current?.()}
          />
        </div>
      </div>
    );
  }

  /* Play-once, not yet consumed: status-only player. A one-time Play
     button before playback (needed because browsers block silent
     autoplay), then nothing but a progress bar — no pause, no scrub, no
     replay. Plays straight through, exactly once. */
  const fireConsumed = () => {
    if (!consumedFiredRef.current) { consumedFiredRef.current = true; onConsumed(); }
  };
  /* Block ALL user seeks — forward skip AND rewind. Natural playback never
     fires 'seeking', so any seek event is a user jump: snap back to the
     furthest point reached. The 0.4s tolerance stops the snap from
     re-triggering itself once currentTime is already at maxTime. */
  const clampSeek = () => {
    const el = audioRef.current;
    if (el && Math.abs(el.currentTime - maxTimeRef.current) > 0.4) el.currentTime = maxTimeRef.current;
  };
  return (
    <div className="test-listening-bar" style={listeningBarStyle}>
      <div style={listeningBarInner}>
        <span style={listeningBarLabel}><HeadphonesGlyph /> Listening</span>
        {!started ? (
          <button
            type="button"
            style={listeningPlayBtn(false)}
            aria-label="Play audio"
            onClick={() => { audioRef.current?.play().catch(() => {}); }}
          >
            ▶
          </button>
        ) : null}
        <span style={listeningProgressTrack} aria-hidden="true">
          <span style={{ ...listeningProgressFill, width: `${Math.round(progress * 100)}%` }} />
        </span>
        {ended ? <span style={listeningFinishedNote}>Finished</span> : null}
        <audio
          ref={audioRef}
          src={url}
          style={{ display: 'none' }}
          onPlay={() => { setStarted(true); fireConsumed(); }}
          onPause={() => {
            /* No pausing allowed: silently resume unless the clip ended
               (guards against OS media keys / system pauses). */
            const el = audioRef.current;
            if (el && !endedRef.current && el.duration && el.currentTime < el.duration - 0.3) {
              el.play().catch(() => {});
            }
          }}
          onEnded={() => { endedRef.current = true; setEnded(true); setProgress(1); onEndedRef.current?.(); }}
          onSeeking={clampSeek}
          onTimeUpdate={() => {
            const el = audioRef.current;
            if (!el) return;
            if (el.currentTime > maxTimeRef.current + 0.4) { el.currentTime = maxTimeRef.current; return; }
            maxTimeRef.current = Math.max(maxTimeRef.current, el.currentTime);
            if (el.duration > 0) setProgress(Math.min(1, el.currentTime / el.duration));
          }}
        />
      </div>
    </div>
  );
}

/* Scroll-mode body: every question stacked on one scrollable page, the
   one nearest the viewport centre stays lit while the rest dim out
   (SurveyMonkey-style). A single continuous audio track is pinned at the
   top for listening exams. */
function ScrollBody({
  test,
  items,
  device,
  themeVars,
  answers,
  onAnswer,
  onSubmit,
  onOpenNavigator,
  activeId,
  setActiveId,
  activeIdx,
  phase,
  total,
  submitAttempted,
  audioActive,
  audioLockEnabled,
  audioDone,
  markAudioDone,
  activeAudioTrackId,
  forceDevice,
  section,
  responseId,
}: {
  test: PublicTest;
  /* The questions to render. Defaults (sectionless) to the whole test;
     in sectioned mode it's just the current section's questions. */
  items: PublicQuestion[];
  device: 'mobile' | 'desktop';
  themeVars?: Record<string, string>;
  answers: Record<string, AnswerSubmission['value']>;
  onAnswer: (qid: string, v: AnswerSubmission['value']) => void;
  /* Layout-aware finish — supplied by TestPlayer; scrolls to the first
     missing required question if any, otherwise submits. */
  onSubmit: () => void;
  /* Open the shared Navigator overlay (numbered grid). */
  onOpenNavigator: () => void;
  /* Lifted to TestPlayer so the shared Navigator + footer progress
     can read/display it. */
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  activeIdx: number;
  phase: Phase;
  total: number;
  /* When set, the test is in sectioned mode: render a section header
     and a section footer (Prev/"Section X of Y"/Next-section or Submit)
     instead of the flat Questions/progress/Submit footer. */
  section: {
    title: string;
    index: number;
    count: number;
    isLast: boolean;
    strict: boolean;
    onNext: () => void;
    onPrev: () => void;
  } | null;
  /* True once a finish was attempted with a required question blank —
     unanswered required items then show their "required" note. */
  submitAttempted: boolean;
  /* Whether the global ListeningAudioBar is mounted above this body, so
     scrolled content has room to clear it. The bar itself lives at the
     top-level TestPlayer render (independent of layout). */
  audioActive: boolean;
  /* Audio-lock: when enabled, the section/listening audio (and any
     per-question `audioMustFinish` audio in the section) must finish
     before the respondent can advance past the section / submit. Always
     false in preview. `audioDone` is the shared set of finished tracks
     (section id / 'global' / 'q:{id}'); `markAudioDone` records one.
     `activeAudioTrackId` is the current section/listening track. */
  audioLockEnabled: boolean;
  audioDone: Set<string>;
  markAudioDone: (key: string) => void;
  activeAudioTrackId: string;
  forceDevice?: 'mobile' | 'desktop';
  /* Per-session response id, threaded to the speaking recorder so it can
     POST to /speaking-grade. Undefined in preview/builder. */
  responseId?: string;
}) {
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  /* Focus follows the topmost question crossing a band around the
     viewport centre. A thin band (±45%) means usually one item is inside
     it, so the lit question tracks the scroll position smoothly. */
  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).dataset.qid;
        if (!id) continue;
        if (e.isIntersecting) visible.add(id);
        else visible.delete(id);
      }
      const first = items.find(qq => visible.has(qq.id));
      if (first) setActiveId(first.id);
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    itemRefs.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [items, setActiveId]);

  /* Edge guard — the IntersectionObserver's centre band misses the
     first and last questions when the user is scrolled all the way to
     the top or bottom (those items sit above/below the band at rest).
     A scroll listener pins the first/last as active in those zones so
     they always highlight. The threshold is loose (~140px) so it
     triggers as soon as the viewport is near an edge. */
  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const viewportBottom = top + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const EDGE = 140;
      if (top < EDGE) {
        const first = items[0];
        if (first) setActiveId(first.id);
      } else if (viewportBottom >= docHeight - EDGE) {
        const last = items[items.length - 1];
        if (last) setActiveId(last.id);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [items, setActiveId]);

  const setItemRef = (id: string) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  };

  /* Audio-lock (scroll mode): block advancing past the section / submit
     until (a) the section/listening audio has finished (when audio_lock
     is on) and (b) every per-question `audioMustFinish` audio in the
     visible section has played through. */
  const sectionAudioLocked = audioLockEnabled && audioActive && !audioDone.has(activeAudioTrackId);
  const questionAudioLocked = !forceDevice && items.some(it =>
    it.audioMustFinish && it.media?.type === 'audio' && !audioDone.has(`q:${it.id}`));
  const audioLockedScroll = sectionAudioLocked || questionAudioLocked;
  const advanceBlocked = phase === 'submitting' || audioLockedScroll;

  return (
    <div className="test-scroll" data-test-device={device} style={{ ...scrollShell, ...themeVars }}>
      <div className="test-scroll__list" style={audioActive ? { ...scrollList, paddingTop: 96 } : scrollList}>
        {section ? (
          <div style={scrollSectionHeader}>
            <span style={scrollSectionKicker}>Section {section.index + 1} of {section.count}</span>
            {section.title ? <h2 style={scrollSectionTitle}>{section.title}</h2> : null}
          </div>
        ) : null}
        {items.map((question) => {
          const active = question.id === activeId;
          return (
            <section
              key={question.id}
              ref={setItemRef(question.id)}
              data-qid={question.id}
              aria-current={active ? 'true' : undefined}
              onFocusCapture={() => setActiveId(question.id)}
              /* Each scroll item *is* a card — wears `test-player__card`
                 so all existing card-mode rules (chrome, height, border,
                 padding, mobile chrome-strip, preview-shell sizing)
                 apply automatically. `test-scroll__item` only carries
                 the scroll-specific behaviour (focus dim, transitions).
                 Media flag mirrors card mode's `--has-media` / `--no-media`
                 modifier so the same centering rules kick in. */
              className={`test-scroll__item test-player__card ${active ? 'test-scroll__item--active' : 'test-scroll__item--dim'} ${question.media?.url ? 'test-player__card--has-media' : 'test-player__card--no-media'}`}
              style={scrollItem}
            >
              {/* Match card-mode chrome exactly: no inline number badge
                  (progress lives in the footer + Questions navigator),
                  same title/description styling. */}
              <QuestionMediaLayout
                media={question.media}
                onAudioEnded={() => markAudioDone(`q:${question.id}`)}
                header={(
                  <>
                    {question.isExample ? <span className="test-player__example-badge" style={exampleBadge}>Example</span> : null}
                    {question.instruction ? (
                      <p className="test-player__instruction" style={questionInstruction} dir="auto" lang={detectScriptLang(question.instruction)}>
                        <MathText>{question.instruction}</MathText>
                      </p>
                    ) : null}
                    <h2 className="test-player__title" style={questionTitle} dir="auto" lang={detectScriptLang(question.prompt)}>
                      {question.prompt ? <MathText>{question.prompt}</MathText> : '…'}
                    </h2>
                    {question.description ? (
                      <p className="test-player__description" style={questionDescription} dir="auto" lang={detectScriptLang(question.description)}>
                        <MathText>{question.description}</MathText>
                      </p>
                    ) : null}
                  </>
                )}
                answer={(
                  <div style={answerWrap}>
                    <div style={question.isExample ? exampleLockedWrap : undefined} aria-disabled={question.isExample || undefined}>
                      <QuestionRenderer
                        question={question}
                        value={question.isExample ? (question.exampleValue ?? {}) : (answers[question.id] ?? {})}
                        onChange={question.isExample ? noop : ((v) => onAnswer(question.id, v))}
                        onSubmit={noop}
                        slug={test.slug}
                        responseId={responseId}
                        respondentToken={ensureRespondentToken(test.slug)}
                      />
                    </div>
                    {/* Required note appears once a finish was attempted
                        and this required question is still blank. Examples are
                        pre-filled so they never trip this. */}
                    {!question.isExample && submitAttempted && question.required && !hasQuestionAnswer(question, answers[question.id]) ? (
                      <div role="alert" style={scrollItemWarnText}>
                        This question is required — please answer it to finish.
                      </div>
                    ) : null}
                  </div>
                )}
              />
            </section>
          );
        })}
      </div>

      {/* Footer. Sectioned: [Back?] · "Section X of Y" · [Next section →
          / Submit]. Back is hidden in strict (forward-only) mode and on
          the first section. Sectionless: the original Questions /
          progress / Submit row. */}
      {audioLockedScroll ? (
        <div role="status" style={{ ...audioLockBar, maxWidth: 1120, margin: '0 auto 12px', width: '100%' }}>
          Listen to the audio to continue.
        </div>
      ) : null}
      <div className="test-scroll__footer" style={scrollFooter}>
        <div style={scrollFooterInner}>
          {section ? (
            <>
              {!section.strict && section.index > 0 ? (
                <button type="button" onClick={section.onPrev} style={secondaryButton(false)}>
                  Back
                </button>
              ) : <span />}
              <div style={navProgress}>Section {section.index + 1} / {section.count}</div>
              <button
                type="button"
                onClick={() => { if (advanceBlocked) return; (section.isLast ? onSubmit : section.onNext)(); }}
                disabled={advanceBlocked}
                style={primaryButton(advanceBlocked)}
              >
                {phase === 'submitting' ? 'Submitting…' : section.isLast ? 'Submit' : 'Next section'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenNavigator}
                style={secondaryButton(false)}
              >
                Questions
              </button>
              <div style={navProgress}>{activeIdx + 1} / {total}</div>
              <button
                type="button"
                onClick={() => { if (advanceBlocked) return; onSubmit(); }}
                disabled={advanceBlocked}
                style={primaryButton(advanceBlocked)}
              >
                {phase === 'submitting' ? 'Submitting…' : 'Submit'}
              </button>
            </>
          )}
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

const playerShell: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '36px 18px',
  background: '#ffffff',
  fontFamily: 'var(--test-theme-font-family, inherit)',
  position: 'relative',
  overflow: 'hidden',
};

const playerInner: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  width: '100%',
  maxWidth: 1120,
};

const questionCard: React.CSSProperties = {
  position: 'relative',
  background: '#fff',
  border: '1px solid #e4ded8',
  borderRadius: 7,
  boxShadow: '0 30px 90px rgba(47,40,53,0.14)',
  padding: '48px 52px',
  containerType: 'inline-size',
};

const introBadge: React.CSSProperties = {
  display: 'inline-flex',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#efe9ff',
  color: '#6b4fbb',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  marginBottom: 14,
};

const introTitle: React.CSSProperties = {
  margin: '0 0 12px',
  color: '#1c1626',
  fontSize: 42,
  lineHeight: 1.05,
  fontWeight: 850,
  letterSpacing: -1.2,
};

const introText: React.CSSProperties = {
  margin: '0 0 28px',
  color: '#6b6470',
  fontSize: 18,
  lineHeight: 1.5,
};

const nameBlock: React.CSSProperties = {
  marginBottom: 18,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 12,
  color: '#8b848f',
  fontWeight: 850,
  display: 'block',
  marginBottom: 8,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
};

const nameInput: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  fontSize: 16,
  border: '1px solid #ded8d1',
  borderRadius: 12,
  boxSizing: 'border-box',
  maxWidth: 360,
  color: '#1c1626',
  background: '#fff',
  outline: 'none',
};

const doneMark: React.CSSProperties = {
  width: 62,
  height: 62,
  borderRadius: 20,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#dcfce7',
  color: '#15803d',
  fontSize: 34,
  fontWeight: 900,
  marginBottom: 18,
};

const publicScreenShell: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '36px 18px',
  background: '#fff',
};

const publicScreenCard: React.CSSProperties = {
  width: '100%',
  maxWidth: 1120,
  minHeight: 'min(620px, calc(100vh - 72px))',
  border: '1px solid #e4ded8',
  borderRadius: 7,
  background: '#fff',
  boxShadow: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '42px 32px',
  boxSizing: 'border-box',
};

const publicScreenContent: React.CSSProperties = {
  width: '100%',
  maxWidth: 360,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
};

const publicScreenTitle: React.CSSProperties = {
  width: '100%',
  maxWidth: 360,
  margin: '0 0 14px',
  color: '#2f2835',
  fontSize: 20,
  fontStyle: 'italic',
  fontWeight: 500,
  lineHeight: 1.35,
};

const publicScreenDescription: React.CSSProperties = {
  width: '100%',
  maxWidth: 360,
  margin: '0 0 30px',
  color: '#a29aa6',
  fontSize: 15,
  fontStyle: 'italic',
  lineHeight: 1.45,
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
};

const publicScreenButton = (disabled: boolean): React.CSSProperties => ({
  border: 'none',
  borderRadius: 4,
  background: '#0445b8',
  color: '#fff',
  padding: '12px 18px',
  fontSize: 18,
  fontWeight: 800,
  boxShadow: disabled ? 'none' : '0 6px 14px rgba(4,69,184,0.22)',
  opacity: disabled ? 0.45 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const publicScreenMeta: React.CSSProperties = {
  marginTop: 14,
  color: '#111827',
  fontSize: 13,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

const publicCollectorBlock: React.CSSProperties = {
  width: '100%',
  maxWidth: 360,
  display: 'grid',
  gap: 12,
  marginBottom: 24,
  textAlign: 'left',
};

const publicNameBlock: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
};

const publicNameLabel: React.CSSProperties = {
  display: 'block',
  color: '#a29aa6',
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  marginBottom: 8,
};

const publicNameInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 12px',
  border: '1px solid #ded8d1',
  borderRadius: 8,
  background: '#fff',
  color: '#2f2835',
  fontSize: 15,
  outline: 'none',
};

const publicPhoneInputWrap: React.CSSProperties = {
  position: 'relative',
  display: 'block',
  width: '100%',
};

const publicPhonePrefix: React.CSSProperties = {
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#6f6874',
  fontSize: 15,
  lineHeight: 1,
  pointerEvents: 'none',
};

const publicPhoneInput: React.CSSProperties = {
  paddingLeft: 52,
};

const screenImage: React.CSSProperties = {
  width: 180,
  maxHeight: 150,
  objectFit: 'cover',
  borderRadius: 18,
  marginBottom: 22,
};

const screenMeta: React.CSSProperties = {
  marginTop: 14,
  color: '#6b6470',
  fontSize: 13,
  fontWeight: 700,
};

const socialRow: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  color: '#6b6470',
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 18,
};

const questionMeta: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#6b4fbb',
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  marginBottom: 24,
};

const questionNumber: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#2f2533',
  color: '#fff',
};

const requiredPill: React.CSSProperties = {
  marginLeft: 'auto',
  borderRadius: 999,
  background: '#f3efff',
  color: '#6b4fbb',
  padding: '5px 9px',
};

// Typeform-style page transition: forward slides up, backward slides down.
// `custom` is the direction (1 = next, -1 = prev) injected from AnimatePresence.
const cardSlideVariants: Variants = {
  enter: (dir: 1 | -1) => ({
    opacity: 0,
    y: 36 * dir,
  }),
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir: 1 | -1) => ({
    opacity: 0,
    y: -36 * dir,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  }),
};

// Vertical spacing for the title / description / answer block lives on
// the qmedia-content flex column (gap) and .qmedia-header (gap), not as
// per-element margins. Keeping these as pure typography means the
// content's CSS box height matches its visible bounds so the grid's
// align-items: center actually centres it relative to the media.
const questionTitle: React.CSSProperties = {
  fontSize: 'calc(34px * var(--test-theme-font-scale, 1))',
  fontWeight: 400,
  margin: 0,
  lineHeight: 1.15,
  color: 'var(--test-theme-question, #1c1626)',
  letterSpacing: -0.6,
};

const questionDescription: React.CSSProperties = {
  margin: 0,
  color: 'var(--test-theme-description, #8b848f)',
  fontSize: 16,
  lineHeight: 1.5,
};

/* Directive shown ABOVE the question title (e.g. "Read and select the best
   option."). Muted + semibold so it reads as an instruction, not the question.
   margin:0 — spacing comes from the qmedia header flex-gap, like the
   description. */
const questionInstruction: React.CSSProperties = {
  margin: 0,
  color: 'var(--test-theme-description, #8b848f)',
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.4,
  letterSpacing: -0.2,
};

const noop = () => {};

/* "Example" chip shown above a worked-example question (HSK style). */
const exampleBadge: React.CSSProperties = {
  display: 'inline-block',
  alignSelf: 'flex-start',
  background: '#2f2835',
  color: '#fff',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.3,
  padding: '3px 10px',
  borderRadius: 5,
};

/* Locks an example's answer inputs — the correct answer is shown pre-selected
   and the student can't change it. */
const exampleLockedWrap: React.CSSProperties = {
  pointerEvents: 'none',
};

const answerWrap: React.CSSProperties = {};

const navRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 18,
  gap: 12,
};

const requiredWarnBar: React.CSSProperties = {
  marginTop: 16,
  padding: '10px 14px',
  borderRadius: 8,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'center',
};

const audioLockBar: React.CSSProperties = {
  marginTop: 16,
  padding: '10px 14px',
  borderRadius: 8,
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1d4ed8',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'center',
};

const navProgress: React.CSSProperties = {
  minWidth: 58,
  textAlign: 'center',
  color: '#6f6772',
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: 0.2,
  whiteSpace: 'nowrap',
};

const primaryButton = (disabled: boolean): React.CSSProperties => ({
  padding: '12px 22px',
  minHeight: 48,
  background: 'var(--test-theme-button, #2f2533)',
  color: 'var(--test-theme-button-text, #fff)',
  border: 'none',
  borderRadius: 14,
  fontWeight: 850,
  fontSize: 15,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.45 : 1,
  boxShadow: disabled ? 'none' : '0 12px 28px color-mix(in srgb, var(--test-theme-button, #2f2533) 22%, transparent)',
});

const secondaryButton = (disabled: boolean): React.CSSProperties => ({
  padding: '11px 18px',
  minHeight: 48,
  background: '#fff',
  color: 'var(--test-theme-button, #2f2533)',
  border: '1px solid #d8d2cc',
  borderRadius: 14,
  fontSize: 15,
  fontWeight: 800,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.45 : 1,
});

const navigatorOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 120,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 18,
  background: 'rgba(28, 22, 38, 0.28)',
  backdropFilter: 'blur(6px)',
};

const navigatorPanel: React.CSSProperties = {
  width: 'min(390px, calc(100vw - 28px))',
  maxHeight: 'min(720px, calc(100dvh - 36px))',
  overflow: 'visible',
  scrollbarWidth: 'none',
  background: 'transparent',
  border: 'none',
  borderRadius: 0,
  boxShadow: 'none',
  padding: 0,
  color: '#2f2533',
  position: 'relative',
};

const navigatorCard: React.CSSProperties = {
  width: 'min(368px, 100%)',
  marginInline: 'auto',
  background: '#fff',
  border: '1px solid rgba(47, 37, 51, 0.08)',
  borderRadius: 3,
  boxShadow: '0 1px 2px rgba(47, 37, 51, 0.04)',
  padding: 20,
  marginBottom: 10,
};

const navigatorCardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
};

const navigatorCardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.25,
  fontWeight: 800,
  color: '#17121c',
};

const navigatorCloseButton: React.CSSProperties = {
  position: 'absolute',
  top: -42,
  right: 2,
  width: 36,
  height: 36,
  border: 'none',
  borderRadius: 3,
  background: '#fff',
  color: '#6d6670',
  fontSize: 28,
  lineHeight: '32px',
  cursor: 'pointer',
  boxShadow: '0 1px 8px rgba(47, 37, 51, 0.12)',
};

const navigatorTimerPill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 3,
  background: '#f7f7f6',
  color: '#02ad1b',
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap',
};

const navigatorCount: React.CSSProperties = {
  color: '#8b858c',
  fontSize: 15,
  fontWeight: 800,
};

const navigatorGridScroller: React.CSSProperties = {
  width: '100%',
  maxHeight: 288,
  marginTop: 18,
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollbarWidth: 'none',
};

const navigatorSectionBlock: React.CSSProperties = {
  marginBottom: 14,
};

const navigatorSectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: '#8b858c',
  marginBottom: 10,
};

const navigatorGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  columnGap: 16,
  rowGap: 14,
};

const navigatorQuestionButton = (current: boolean, answered: boolean): React.CSSProperties => ({
  width: 36,
  height: 36,
  justifySelf: 'center',
  border: 'none',
  borderRadius: 3,
  background: current
    ? 'var(--test-theme-button, #2f2533)'
    : answered
      ? 'rgba(2, 173, 27, 0.1)'
      : '#fafafa',
  color: current
    ? 'var(--test-theme-button-text, #fff)'
    : answered
      ? '#02ad1b'
      : '#555',
  fontSize: 16,
  fontWeight: 800,
  cursor: 'pointer',
});

const navigatorFinishButton = (disabled: boolean): React.CSSProperties => ({
  width: 'min(368px, 100%)',
  minHeight: 52,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  border: 'none',
  borderRadius: 3,
  background: 'var(--test-theme-button, #2f2533)',
  color: 'var(--test-theme-button-text, #fff)',
  fontSize: 15,
  fontWeight: 850,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  boxShadow: '0 10px 24px rgba(47, 37, 51, 0.16)',
});

/* ── Scroll mode ──────────────────────────────────────────────────── */

const scrollShell: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--test-theme-background, #fff)',
  fontFamily: 'var(--test-theme-font-family, inherit)',
  /* padding-bottom owned by `.test-scroll` CSS (centres last card). */
};

const sectionBreakdownWrap: React.CSSProperties = {
  width: '100%',
  marginTop: 4,
  border: '1px solid rgba(28, 22, 38, 0.1)',
  borderRadius: 10,
  overflow: 'hidden',
};
const sectionBreakdownRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 14px',
  fontSize: 15,
  borderTop: '1px solid rgba(28, 22, 38, 0.07)',
};
const sectionBreakdownTitle: React.CSSProperties = {
  color: 'var(--test-theme-description, #475569)',
  textAlign: 'left',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
const sectionBreakdownScore: React.CSSProperties = {
  flexShrink: 0,
  fontVariantNumeric: 'tabular-nums',
};

const listeningLockedNote: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 13,
  fontWeight: 600,
  color: '#94a3b8',
  fontStyle: 'italic',
};
const listeningPlayBtn = (ended: boolean): React.CSSProperties => ({
  flexShrink: 0,
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: 'none',
  background: ended ? '#cbd5e1' : 'var(--test-theme-button, #1c1626)',
  color: ended ? '#475569' : 'var(--test-theme-button-text, #fff)',
  fontSize: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: ended ? 'default' : 'pointer',
});
const listeningProgressTrack: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 6,
  borderRadius: 3,
  background: 'rgba(28, 22, 38, 0.12)',
  overflow: 'hidden',
};
const listeningProgressFill: React.CSSProperties = {
  display: 'block',
  height: '100%',
  borderRadius: 3,
  background: 'var(--test-theme-button, #1c1626)',
  transition: 'width 200ms linear',
};
const listeningFinishedNote: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
};

const listeningBarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  background: 'rgba(255, 255, 255, 0.96)',
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid #ece7e1',
};

const listeningBarInner: React.CSSProperties = {
  maxWidth: 1120,
  margin: '0 auto',
  padding: '10px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const listeningBarLabel: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  fontWeight: 800,
  color: '#6b4fbb',
  whiteSpace: 'nowrap',
};

const scrollList: React.CSSProperties = {
  /* Width and centering only. `.test-scroll__list` CSS owns the
     display/flex/gap; each item wears `.test-player__card` and
     inherits all card-mode rules (width, height, padding, chrome,
     mobile strip, preview-shell sizing), so this file no longer
     duplicates any of that. */
  maxWidth: 1120,
  margin: '0 auto',
};

/* Sectioned scroll mode — header above the section's questions. */
const scrollSectionHeader: React.CSSProperties = {
  maxWidth: 1120,
  margin: '0 auto',
  padding: '0 8px',
};

const scrollSectionKicker: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  color: '#6b4fbb',
  marginBottom: 4,
};

const scrollSectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  lineHeight: 1.25,
  color: 'var(--test-theme-question, #1c1626)',
};

/* Scroll items render borderless by design — the focus dim (opacity)
   and the subtle padding/spacing carry the "card" feel, not an
   outline. Background + radius + active/warn rings all live in
   `.test-scroll__item` CSS so they aren't sharing or competing with
   the card-mode shell's inline border. */
const scrollItem: React.CSSProperties = {
  position: 'relative',
  /* Padding mirrors card mode's `questionCard` inline style (48×52),
     where card mode also keeps padding inline rather than in CSS. The
     mobile chrome-strip rule (`.test-player__card { padding: 0
     !important }` in @media max-width:640px) overrides this on phones,
     so scroll items stay edge-to-edge on mobile just like card mode. */
  padding: '48px 52px',
  containerType: 'inline-size',
  scrollMarginTop: 96,
  '--qmedia-card-pad-x': '52px',
  '--qmedia-card-pad-top': '48px',
} as React.CSSProperties;

const scrollItemNumRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 14,
};

const scrollItemNumBadge = (answered: boolean): React.CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 850,
  background: answered ? 'rgba(2, 173, 27, 0.12)' : '#f3eff7',
  color: answered ? '#02ad1b' : '#6b4fbb',
});

const scrollRequiredStar: React.CSSProperties = {
  color: '#dc2626',
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1,
};

const scrollItemTitle: React.CSSProperties = {
  fontSize: 'calc(22px * var(--test-theme-font-scale, 1))',
  fontWeight: 500,
  margin: 0,
  lineHeight: 1.25,
  color: 'var(--test-theme-question, #1c1626)',
};

const scrollItemDesc: React.CSSProperties = {
  margin: 0,
  color: 'var(--test-theme-description, #8b848f)',
  fontSize: 15,
  lineHeight: 1.5,
};

const scrollItemWarnText: React.CSSProperties = {
  marginTop: 12,
  color: '#b91c1c',
  fontSize: 13,
  fontWeight: 700,
};

const scrollFooter: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 40,
  background: 'rgba(255, 255, 255, 0.97)',
  backdropFilter: 'blur(8px)',
  borderTop: '1px solid #ece7e1',
};

const scrollFooterInner: React.CSSProperties = {
  maxWidth: 1120,
  margin: '0 auto',
  padding: '12px 18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const scrollFooterMeta: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
};

const scrollFooterCount: React.CSSProperties = {
  color: '#6f6772',
  fontSize: 14,
  fontWeight: 800,
  whiteSpace: 'nowrap',
};

const scrollTimerPill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 999,
  background: '#f7f7f6',
  color: '#02ad1b',
  fontSize: 13,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};
