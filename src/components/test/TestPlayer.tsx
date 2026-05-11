'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { QuestionRenderer } from './QuestionRenderer';
import { QuestionMediaBlock, QuestionMediaLayout } from './QuestionMediaBlock';
import { ThemeLogo } from './ThemeLogo';
import type { PublicTest, PublicQuestion, AnswerSubmission } from '@/lib/test/types';
import { normalizeTestTheme, testThemeCssVars } from '@/lib/test/theme';
import './test-player.css';

interface Props {
  test: PublicTest;
  forceDevice?: 'mobile' | 'desktop';
}

type Phase = 'intro' | 'question' | 'submitting' | 'done' | 'error';

interface Done {
  score: number | null;
  total: number | null;
}

const TOKEN_KEY_PREFIX = 'blim-test-token:';

function ensureToken(slug: string): string {
  const key = TOKEN_KEY_PREFIX + slug;
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const fresh = `${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}-${Date.now()}`;
  localStorage.setItem(key, fresh);
  return fresh;
}

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

export function TestPlayer({ test, forceDevice }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [name, setName] = useState('');
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
  const [answers, setAnswers] = useState<Record<string, AnswerSubmission['value']>>({});
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardOverflowing, setCardOverflowing] = useState(false);

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
  const timerLimitSeconds = test.timer_enabled && test.time_limit_seconds && test.time_limit_seconds > 0
    ? Math.round(test.time_limit_seconds)
    : null;
  const normalizedTheme = useMemo(() => normalizeTestTheme(test.theme), [test.theme]);
  const themeVars = useMemo(() => testThemeCssVars(test.theme), [test.theme]);
  const hasChrome = Boolean(normalizedTheme.logoUrl);
  const hasLogoChrome = Boolean(normalizedTheme.logoUrl);

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
    return false;
  }, [q, answer]);

  const isLast = idx === total - 1;

  const submit = useCallback(async (timedOut = false) => {
    setPhase('submitting');
    if (timedOut) setTimeExpired(true);
    setErrMsg(null);
    const token = ensureToken(test.slug);
    const payload = {
      respondent_token: token,
      respondent_name: name,
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
    setDone({ score: j.score ?? null, total: j.total ?? null });
    setPhase('done');
  }, [answers, name, startedAt, test.slug]);

  const startQuestions = useCallback(() => {
    setStartedAt(new Date().toISOString());
    if (timerLimitSeconds) {
      setTimerEndsAt(Date.now() + timerLimitSeconds * 1000);
      setRemainingSeconds(timerLimitSeconds);
      setTimeExpired(false);
    }
    setPhase('question');
  }, [timerLimitSeconds]);

  const onChange = (v: AnswerSubmission['value']) => {
    if (!q) return;
    setAnswers({ ...answers, [q.id]: v });
  };

  // Keyboard shortcuts: Enter to advance, 1-9 to pick mc choice
  useEffect(() => {
    if (phase !== 'question' || !q) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        // Let typing happen; only Enter triggers advance for short text via Cmd+Enter
        return;
      }
      if (e.key === 'Enter') {
        if (canAdvance) {
          if (isLast) submit();
          else goToIdx(i => i + 1);
        }
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
      if (next <= 0 && !submitted) {
        submitted = true;
        void submit(true);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [phase, timerEndsAt, submit]);

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
    if (welcomeScreen) {
      const title = welcomeScreen.title || test.title;
      const description = welcomeScreen.description ?? '';
      const buttonText = welcomeScreen.buttonText || 'Start';

      return (
        <ScreenWrapper>
          <div className="test-player-screen__card" style={publicScreenCard}>
            {welcomeScreen.imageUrl ? <img src={welcomeScreen.imageUrl} alt="" style={screenImage} /> : null}
            <h1 style={publicScreenTitle}>{title}</h1>
            <p style={publicScreenDescription}>
              {description || 'Description (optional)'}
            </p>
            <button
              type="button"
              onClick={startQuestions}
              disabled={total === 0}
              style={publicScreenButton(total === 0)}
            >
              {total === 0 ? 'No questions yet' : buttonText}
            </button>
            {welcomeScreen.showTimeToComplete ? (
              <div style={publicScreenMeta}>◷ {timerLimitSeconds ? `Time limit: ${formatDuration(timerLimitSeconds)}` : welcomeScreen.timeToCompleteText || `Takes ${Math.max(1, Math.ceil(total / 4))} minutes`}</div>
            ) : null}
            <div style={publicNameBlock}>
              <label style={publicNameLabel}>Your name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Anonymous"
                style={publicNameInput}
              />
            </div>
          </div>
        </ScreenWrapper>
      );
    }

    return (
      <Wrapper themeVars={themeVars}>
        <div style={introBadge}>{test.is_graded ? 'Graded quiz' : 'Survey'}</div>
        <h1 style={introTitle}>{test.title}</h1>
        {test.description ? (
          <p style={introText}>{test.description}</p>
        ) : (
          <p style={introText}>
            Answer {total} {total === 1 ? 'question' : 'questions'} one at a time.
          </p>
        )}
        <div style={nameBlock}>
          <label style={fieldLabel}>
            Your name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Anonymous"
            style={nameInput}
          />
        </div>
        <button
          type="button"
          onClick={startQuestions}
          disabled={total === 0}
          style={primaryButton(total === 0)}
        >
          {total === 0 ? 'No questions yet' : `Start · ${total} ${total === 1 ? 'question' : 'questions'}`}
        </button>
      </Wrapper>
    );
  }

  if (phase === 'done') {
    const title = endScreen?.title || 'Submitted';
    const description = endScreen?.description || 'Your answers were submitted.';
    const buttonText = endScreen?.buttonText || '';
    return (
      <Wrapper themeVars={themeVars}>
        <div style={doneMark}>✓</div>
        {endScreen?.imageUrl ? <img src={endScreen.imageUrl} alt="" style={screenImage} /> : null}
        <h1 style={introTitle}>{title}</h1>
        {test.is_graded && done?.score != null ? (
          <p style={introText}>
            Score: <b style={{ color: '#1c1626' }}>{done.score}</b>
            {done.total != null ? <> / <b style={{ color: '#1c1626' }}>{done.total}</b></> : null}
          </p>
        ) : (
          <p style={introText}>{timeExpired ? 'Time is up. Your answers were submitted.' : description}</p>
        )}
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
            style={primaryButton(false)}
          >
            {buttonText}
          </button>
        ) : null}
      </Wrapper>
    );
  }

  if (phase === 'error') {
    return (
      <Wrapper themeVars={themeVars}>
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

  return (
    <Wrapper wallpaperActive={!!mobileWallpaperMedia} themeVars={themeVars}>
      <QuestionMediaBlock
        media={mobileWallpaperMedia}
        className={`test-player__wallpaper-bg ${forceDevice === 'mobile' ? 'test-player__wallpaper-bg--force-mobile' : ''}`}
      />
      {hasChrome ? (
        <div
          className={`test-player__chrome test-player__chrome--logo-${normalizedTheme.logoAlign}`}
          style={chromeLayer}
          aria-hidden={false}
        >
          <ThemeLogo
            theme={normalizedTheme}
            className="test-player__chrome-logo"
            style={chromeLogo(normalizedTheme.logoAlign)}
          />
        </div>
      ) : null}
      <AnimatePresence mode="wait" custom={navDirection} initial={false}>
      <motion.div
        ref={cardRef}
        key={q.id}
        custom={navDirection}
        variants={cardSlideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className={`test-player__card ${forceDevice ? `test-player__card--force-${forceDevice}` : ''} ${hasLogoChrome ? 'test-player__card--has-chrome' : ''} ${q.media?.url ? 'test-player__card--has-media' : 'test-player__card--no-media'} test-player__card--type-${q.type.replaceAll('_', '-')} ${cardOverflowing ? 'test-player__card--overflowing' : ''}`}
        style={{ ...questionCard, '--qmedia-card-pad-x': '52px', '--qmedia-card-pad-top': '48px' } as React.CSSProperties}
      >
          <QuestionMediaLayout
            media={q.media}
            forceDevice={forceDevice}
            header={(
              <>
                <h2 className="test-player__title" style={questionTitle}>
                  {q.prompt}
                </h2>
                {q.description ? (
                  <p className="test-player__description" style={questionDescription}>
                    {q.description}
                  </p>
                ) : null}
              </>
            )}
            answer={(
              <div style={answerWrap}>
                <QuestionRenderer
                  question={q}
                  value={answer}
                  onChange={onChange}
                  onSubmit={() => { if (canAdvance) { isLast ? submit() : goToIdx(idx + 1); } }}
                />
              </div>
            )}
          />
      </motion.div>
      </AnimatePresence>

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
          onClick={() => isLast ? submit() : goToIdx(idx + 1)}
          disabled={!canAdvance || phase === 'submitting'}
          style={primaryButton(!canAdvance || phase === 'submitting')}
        >
          {phase === 'submitting' ? 'Submitting…' : isLast ? 'Submit' : 'Next'}
        </button>
      </div>

      <AnimatePresence>
        {navigatorOpen ? (
          <motion.div
            style={navigatorOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNavigatorOpen(false)}
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
              <button
                type="button"
                aria-label="Close questions"
                onClick={() => setNavigatorOpen(false)}
                style={navigatorCloseButton}
              >
                ×
              </button>
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
                  <div style={navigatorGrid}>
                    {test.questions.map((question, questionIndex) => {
                      const answered = hasQuestionAnswer(question, answers[question.id]);
                      const current = questionIndex === idx;
                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => goToIdx(questionIndex)}
                          aria-current={current ? 'step' : undefined}
                          aria-label={`Go to question ${questionIndex + 1}${answered ? ', answered' : ', unanswered'}`}
                          style={navigatorQuestionButton(current, answered)}
                        >
                          {questionIndex + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
              <button
                type="button"
                onClick={() => {
                  setNavigatorOpen(false);
                  void submit();
                }}
                disabled={phase === 'submitting'}
                style={navigatorFinishButton(phase === 'submitting')}
              >
                Finish the test
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Wrapper>
  );
}

function Wrapper({
  children,
  wallpaperActive = false,
  themeVars,
}: {
  children: React.ReactNode
  wallpaperActive?: boolean
  themeVars?: Record<string, string>
}) {
  return (
    <div
      className={`test-player${wallpaperActive ? ' test-player--wallpaper-active' : ''}`}
      style={{ ...playerShell, ...themeVars }}
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
  boxShadow: '0 30px 90px rgba(47,40,53,0.14)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '42px 32px',
  boxSizing: 'border-box',
};

const publicScreenTitle: React.CSSProperties = {
  margin: '0 0 14px',
  color: '#2f2835',
  fontSize: 20,
  fontStyle: 'italic',
  fontWeight: 500,
  lineHeight: 1.35,
};

const publicScreenDescription: React.CSSProperties = {
  margin: '0 0 30px',
  color: '#a29aa6',
  fontSize: 15,
  fontStyle: 'italic',
  lineHeight: 1.45,
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
};

const publicNameBlock: React.CSSProperties = {
  width: '100%',
  maxWidth: 330,
  marginTop: 28,
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

const chromeLayer: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(env(safe-area-inset-top, 0px) + 28px)',
  left: 28,
  right: 28,
  height: 96,
  zIndex: 20,
  pointerEvents: 'none',
};

const chromeLogo = (align: 'left' | 'center' | 'right'): React.CSSProperties => ({
  position: 'absolute',
  top: -6,
  left: align === 'left' ? 0 : align === 'center' ? '50%' : 'auto',
  right: align === 'right' ? 0 : 'auto',
  transform: align === 'center' ? 'translateX(-50%)' : 'none',
  width: 'auto',
  marginBottom: 0,
  display: 'block',
  pointerEvents: 'none',
});

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

const questionTitle: React.CSSProperties = {
  fontSize: 'calc(34px * var(--test-theme-font-scale, 1) * var(--test-theme-question-scale, 1))',
  fontWeight: 400,
  margin: '0 0 12px',
  lineHeight: 1.15,
  color: 'var(--test-theme-question, #1c1626)',
  textAlign: 'var(--test-theme-question-align, left)' as React.CSSProperties['textAlign'],
  letterSpacing: -0.6,
};

const questionDescription: React.CSSProperties = {
  margin: '0 0 28px',
  color: '#8b848f',
  fontSize: 16,
  lineHeight: 1.5,
};

const answerWrap: React.CSSProperties = {
  marginTop: 4,
};

const navRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 18,
  gap: 12,
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
