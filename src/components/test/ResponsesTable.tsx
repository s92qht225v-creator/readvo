'use client';

import { useEffect, useState, useCallback, type CSSProperties } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authHeaders } from '@/lib/test/clientFetch';
import type {
  Test, TestQuestion, MultipleChoiceOptions, PictureChoiceOptions,
  MatchOptions, OrderingOptions, FillBlanksOptions,
  DropdownOptions, CheckboxOptions,
} from '@/lib/test/types';
import { publicOptionId } from '@/lib/test/sanitize';

interface ResponseRow {
  id: string;
  respondent_name: string;
  started_at: string | null;
  completed_at: string | null;
  score: number | null;
  timed_out?: boolean;
}

interface AnswerRow {
  response_id: string;
  question_id: string;
  value: {
    selected?: number;
    selectedId?: string;
    selectedIds?: string[];
    text?: string;
    bool?: boolean;
    pairs?: { leftIndex: number; rightId: string }[];
    matches?: string[];
    order?: string[];
    blanks?: string[];
  };
  is_correct: boolean | null;
}

interface Props {
  testId: string;
}

export function ResponsesTable({ testId }: Props) {
  const { getAccessToken } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const tok = await getAccessToken();
    const headers = authHeaders(tok);
    const [testRes, respRes] = await Promise.all([
      fetch(`/api/tests/${testId}`, { headers }),
      fetch(`/api/tests/${testId}/responses`, { headers }),
    ]);
    if (testRes.ok) {
      const j = await testRes.json();
      setTest(j.test);
      setQuestions(j.questions);
    }
    if (respRes.ok) {
      const j = await respRes.json();
      setResponses(j.responses);
      setAnswers(j.answers);
    }
    setLoading(false);
  }, [getAccessToken, testId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- setState happens inside async fetch, after await
  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: '#94a3b8' }}>Loading…</div>;
  if (!test) return <div style={{ color: '#dc2626' }}>Test not found</div>;

  const total = questions.length;
  const stats = computeStats(questions, answers);
  const gradableAnswers = Array.from(stats.values()).reduce((sum, s) => sum + s.gradable, 0);
  const correctAnswers = Array.from(stats.values()).reduce((sum, s) => sum + s.correct, 0);
  const averageScore = test.is_graded
    ? average(responses.map(r => r.score).filter((score): score is number => typeof score === 'number'))
    : null;
  const correctRate = gradableAnswers > 0 ? Math.round((correctAnswers / gradableAnswers) * 100) : null;
  const latestCompletedAt = responses.find(r => r.completed_at)?.completed_at ?? null;
  const responseDurations = test.timer_enabled ? responseDurationsMs(responses) : [];
  const averageResponseTime = test.timer_enabled && responseDurations.length > 0
    ? average(responseDurations)
    : null;

  return (
    <div style={resultsShell}>
      <header style={resultsHero}>
        <div>
          <div style={eyebrow}>Results</div>
          <h1 style={resultsTitle}>{test.title}</h1>
          <p style={resultsSubtitle}>
            {responses.length === 1 ? '1 response' : `${responses.length} responses`} · {test.is_graded ? 'Graded quiz' : 'Survey'}
          </p>
        </div>
        <button type="button" onClick={load} style={refreshButton}>
          Refresh
        </button>
      </header>

      <section style={summaryGrid}>
        <SummaryCard label="Responses" value={responses.length.toString()} helper={latestCompletedAt ? `Latest ${formatDate(latestCompletedAt)}` : 'No submissions yet'} />
        <SummaryCard
          label="Average score"
          value={test.is_graded && averageScore != null ? `${averageScore}/${total}` : '—'}
          helper={test.is_graded ? 'Across submitted quizzes' : 'Scoring is off'}
        />
        <SummaryCard
          label="Avg response time"
          value={averageResponseTime != null ? formatResponseTime(averageResponseTime) : '—'}
          helper={!test.timer_enabled ? 'Timer is off' : averageResponseTime != null ? 'From start to submit' : 'Waiting for timed responses'}
        />
        <SummaryCard
          label="Correct rate"
          value={correctRate != null ? `${correctRate}%` : '—'}
          helper={gradableAnswers > 0 ? `${correctAnswers} correct answers counted` : 'Waiting for graded answers'}
        />
      </section>

      {test.is_graded ? (
        <section style={sectionCard}>
          <SectionHeader
            title="Question performance"
            description="See which questions students are getting right or missing."
          />
          <div style={questionStatsGrid}>
            {questions.map(q => {
              const s = stats.get(q.id);
              if (!s) return null;
              const pct = s.gradable > 0 ? Math.round((s.correct / s.gradable) * 100) : 0;
              const needsAttention = s.gradable > 0 && pct < 70;
              return (
                <div key={q.id} style={questionStatCard}>
                  <div style={questionStatTop}>
                    <div>
                      <div style={questionMeta}>{q.position + 1}. {questionTypeLabel(q.type)}</div>
                      <div style={questionPrompt}>{q.prompt}</div>
                    </div>
                    <div style={needsAttention ? attentionBadge : scoreBadge}>
                      {s.gradable > 0 ? `${pct}%` : 'No data'}
                    </div>
                  </div>
                  <div style={progressTrack}>
                    <div style={{ ...progressFill, width: `${pct}%`, background: needsAttention ? '#ef4444' : '#111827' }} />
                  </div>
                  <div style={statLine}>
                    <span>{s.correct} / {s.gradable} correct</span>
                    {needsAttention ? <span style={attentionText}>Needs review</span> : null}
                  </div>
                  {q.type === 'multiple_choice' || q.type === 'picture_choice' || q.type === 'dropdown' || q.type === 'checkbox' ? (
                    <div style={choiceList}>
                      {choiceStatsOptions(q).map((c, i) => {
                        const cnt = s.choiceCounts?.[i] ?? 0;
                        const choiceTotal = s.choiceCounts?.reduce((a, b) => a + b, 0) ?? 0;
                        const choicePct = choiceTotal > 0 ? Math.round((cnt / choiceTotal) * 100) : 0;
                        return (
                          <div key={i} style={choiceRow}>
                            <div style={choiceText}>
                              <span style={choiceNumber}>{i + 1}</span>
                              <span>{c.text}</span>
                            </div>
                            <div style={choiceMetric}>
                              <span>{cnt}</span>
                              <span style={miniTrack}><span style={{ ...miniFill, width: `${choicePct}%` }} /></span>
                              <span>{choicePct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section style={sectionCard}>
        <SectionHeader
          title="Individual responses"
          description="Open a submission to inspect every answer."
        />
        {responses.length === 0 ? (
          <div style={emptyState}>
            No responses yet.
          </div>
        ) : (
          <div style={responseList}>
            {responses.map(r => {
              const open = openId === r.id;
              const myAnswers = answers.filter(a => a.response_id === r.id);
              return (
                <div key={r.id} style={responseCard}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : r.id)}
                    style={responseButton}
                  >
                    <div style={responseIdentity}>
                      <div style={avatarCircle}>{initials(r.respondent_name || 'Anonymous')}</div>
                      <div>
                        <div style={responseName}>{r.respondent_name || 'Anonymous'}</div>
                        <div style={responseDate}>
                          {r.completed_at ? formatDate(r.completed_at) : ''}
                        </div>
                      </div>
                    </div>
                    <div style={responseRight}>
                      {test.is_graded && r.score != null ? (
                        <div style={responseScorePill}>
                          {r.score} / {total}
                        </div>
                      ) : null}
                      {r.timed_out ? (
                        <div style={timedOutPill}>
                          Timed out
                        </div>
                      ) : null}
                      <span style={chevron}>{open ? '▾' : '▸'}</span>
                    </div>
                  </button>
                  {open ? (
                    <div style={answerDetailGrid}>
                      {questions.map(q => {
                        const a = myAnswers.find(x => x.question_id === q.id);
                        return (
                          <div key={q.id} style={answerDetailCard}>
                            <div style={answerQuestionLine}>
                              <span>{q.position + 1}. {q.prompt}</span>
                              {test.is_graded && a?.is_correct != null ? (
                                <span style={a.is_correct ? correctMark : incorrectMark}>
                                  {a.is_correct ? 'Correct' : 'Wrong'}
                                </span>
                              ) : null}
                            </div>
                            <div style={answerValue}>
                              {renderAnswer(q, a?.value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function renderAnswer(q: TestQuestion, value: AnswerRow['value'] | undefined) {
  if (!value) return <span style={{ color: '#cbd5e1' }}>—</span>;
  if (q.type === 'multiple_choice') {
    const opts = q.options as MultipleChoiceOptions;
    if (typeof value.selected === 'number') {
      return <span>{opts.choices[value.selected] ?? `(choice ${value.selected})`}</span>;
    }
    const indexes = submittedChoiceIndexes(q.id, value);
    if (indexes.length > 0) {
      return <span>{indexes.map(idx => opts.choices[idx] ?? `(choice ${idx})`).join(', ')}</span>;
    }
    return <span style={{ color: '#cbd5e1' }}>—</span>;
  }
  if (q.type === 'picture_choice') {
    const opts = q.options as PictureChoiceOptions;
    if (typeof value.selected === 'number') {
      const c = opts.choices[value.selected];
      return <span>{c?.text || `(choice ${value.selected})`}</span>;
    }
    const indexes = submittedChoiceIndexes(q.id, value);
    if (indexes.length > 0) {
      return <span>{indexes.map(idx => opts.choices[idx]?.text || `(choice ${idx})`).join(', ')}</span>;
    }
    return <span style={{ color: '#cbd5e1' }}>—</span>;
  }
  if (q.type === 'short_text' || q.type === 'long_answer' || q.type === 'number') {
    return <span>{value.text ?? ''}</span>;
  }
  if (q.type === 'dropdown') {
    const opts = q.options as DropdownOptions;
    const indexes = submittedChoiceIndexes(q.id, value);
    if (indexes.length > 0) return <span>{opts.choices[indexes[0]] ?? `(choice ${indexes[0]})`}</span>;
    return <span style={{ color: '#cbd5e1' }}>—</span>;
  }
  if (q.type === 'checkbox') {
    const opts = q.options as CheckboxOptions;
    const indexes = submittedChoiceIndexes(q.id, value);
    if (indexes.length > 0) return <span>{indexes.map(idx => opts.choices[idx] ?? `(choice ${idx})`).join(', ')}</span>;
    return <span style={{ color: '#cbd5e1' }}>—</span>;
  }
  if (q.type === 'opinion_scale' || q.type === 'rating') {
    if (typeof value.selected === 'number') return <span>{value.selected}</span>;
    return <span style={{ color: '#cbd5e1' }}>—</span>;
  }
  if (q.type === 'true_false') {
    if (typeof value.bool === 'boolean') return <span>{value.bool ? 'True' : 'False'}</span>;
    return <span style={{ color: '#cbd5e1' }}>—</span>;
  }
  if (q.type === 'match') {
    const opts = q.options as MatchOptions;
    const submitted = submittedMatchPairs(q.id, value as AnswerRow['value'], opts.pairs.length);
    return (
      <div style={{ display: 'grid', gap: 2 }}>
        {opts.pairs.map((p, i) => {
          const r = submitted.get(i);
          const rightIdx = opts.pairs.findIndex((_, idx) => publicOptionId(q.id, 'match-right', idx) === r);
          const right = rightIdx >= 0 ? opts.pairs[rightIdx]?.right ?? '?' : '—';
          const ok = r === publicOptionId(q.id, 'match-right', i);
          return (
            <span key={i} style={{ fontSize: 13, color: ok ? '#15803d' : '#b91c1c' }}>
              {p.left} → {right}
            </span>
          );
        })}
      </div>
    );
  }
  if (q.type === 'ordering') {
    const opts = q.options as OrderingOptions;
    const order = (value as { order?: string[] }).order ?? [];
    return (
      <div style={{ display: 'grid', gap: 2 }}>
        {order.map((itemId, i) => {
          const originalIdx = opts.items.findIndex((_, idx) => publicOptionId(q.id, 'ordering', idx) === itemId);
          return (
            <span key={i} style={{ fontSize: 13 }}>
              {i + 1}. {originalIdx >= 0 ? opts.items[originalIdx] : '?'}
            </span>
          );
        })}
      </div>
    );
  }
  if (q.type === 'fill_blanks') {
    const opts = q.options as FillBlanksOptions;
    const blanks = (value as { blanks?: string[] }).blanks ?? [];
    const parts = (opts.template ?? '').split(/\{(\d+)\}/g);
    return (
      <span>
        {parts.map((p, idx) => {
          if (idx % 2 === 0) return <span key={idx}>{p}</span>;
          const blankIdx = parseInt(p, 10) - 1;
          const ans = blanks[blankIdx] ?? '';
          const expected = opts.blanks?.[blankIdx]?.answer ?? '';
          const ok = ans.trim().toLowerCase() === expected.trim().toLowerCase();
          return (
            <span key={idx} style={{
              padding: '0 4px', borderRadius: 3,
              background: ok ? '#dcfce7' : '#fee2e2',
              color: ok ? '#15803d' : '#b91c1c',
            }}>{ans || '—'}</span>
          );
        })}
      </span>
    );
  }
  return null;
}

function computeStats(questions: TestQuestion[], answers: AnswerRow[]) {
  const map = new Map<string, { correct: number; gradable: number; choiceCounts?: number[] }>();
  for (const q of questions) {
    if (q.type === 'multiple_choice') {
      const opts = q.options as MultipleChoiceOptions;
      map.set(q.id, { correct: 0, gradable: 0, choiceCounts: new Array(opts.choices.length).fill(0) });
    } else if (q.type === 'picture_choice') {
      const opts = q.options as PictureChoiceOptions;
      map.set(q.id, { correct: 0, gradable: 0, choiceCounts: new Array(opts.choices.length).fill(0) });
    } else if (q.type === 'dropdown') {
      const opts = q.options as DropdownOptions;
      map.set(q.id, { correct: 0, gradable: 0, choiceCounts: new Array(opts.choices.length).fill(0) });
    } else if (q.type === 'checkbox') {
      const opts = q.options as CheckboxOptions;
      map.set(q.id, { correct: 0, gradable: 0, choiceCounts: new Array(opts.choices.length).fill(0) });
    } else {
      map.set(q.id, { correct: 0, gradable: 0 });
    }
  }
  for (const a of answers) {
    const s = map.get(a.question_id);
    if (!s) continue;
    if (a.is_correct != null) {
      s.gradable += 1;
      if (a.is_correct) s.correct += 1;
    }
    if (s.choiceCounts) {
      for (const selected of submittedChoiceIndexes(a.question_id, a.value)) {
        if (selected >= 0 && selected < s.choiceCounts.length) s.choiceCounts[selected] += 1;
      }
    }
  }
  return map;
}

function choiceStatsOptions(q: TestQuestion): Array<{ text: string }> {
  if (q.type === 'multiple_choice') {
    return ((q.options as MultipleChoiceOptions).choices ?? []).map(text => ({ text }));
  }
  if (q.type === 'picture_choice') {
    return ((q.options as PictureChoiceOptions).choices ?? []).map(choice => ({ text: choice.text }));
  }
  if (q.type === 'dropdown') {
    return ((q.options as DropdownOptions).choices ?? []).map(text => ({ text }));
  }
  if (q.type === 'checkbox') {
    return ((q.options as CheckboxOptions).choices ?? []).map(text => ({ text }));
  }
  return [];
}

function submittedChoiceIndexes(questionId: string, value: AnswerRow['value']): number[] {
  if (typeof value.selected === 'number') return [value.selected];
  if (typeof value.selectedId === 'string') {
    const idx = choiceIdToIndex(questionId, value.selectedId);
    return idx == null ? [] : [idx];
  }
  if (Array.isArray(value.selectedIds)) {
    return value.selectedIds.flatMap(id => {
      const idx = choiceIdToIndex(questionId, id);
      return idx == null ? [] : [idx];
    });
  }
  return [];
}

function choiceIdToIndex(questionId: string, id: string): number | null {
  for (let i = 0; i < 100; i++) {
    if (publicOptionId(questionId, 'choice', i) === id) return i;
  }
  return null;
}

function submittedMatchPairs(
  questionId: string,
  value: AnswerRow['value'],
  pairCount: number,
): Map<number, string> {
  const validRightIds = new Set(
    Array.from({ length: pairCount }, (_, i) => publicOptionId(questionId, 'match-right', i)),
  );
  const rawPairs = Array.isArray(value.pairs)
    ? value.pairs
    : (value.matches ?? []).map((rightId, leftIndex) => ({ leftIndex, rightId }));
  const result = new Map<number, string>();
  const usedRightIds = new Set<string>();
  rawPairs.forEach(pair => {
    if (!Number.isInteger(pair.leftIndex) || pair.leftIndex < 0 || pair.leftIndex >= pairCount) return;
    if (typeof pair.rightId !== 'string' || !validRightIds.has(pair.rightId)) return;
    if (result.has(pair.leftIndex) || usedRightIds.has(pair.rightId)) return;
    result.set(pair.leftIndex, pair.rightId);
    usedRightIds.add(pair.rightId);
  });
  return result;
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div style={summaryCard}>
      <div style={summaryLabel}>{label}</div>
      <div style={summaryValue}>{value}</div>
      <div style={summaryHelper}>{helper}</div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div style={sectionHeader}>
      <h2 style={sectionTitle}>{title}</h2>
      <p style={sectionDescription}>{description}</p>
    </div>
  );
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function responseDurationsMs(responses: ResponseRow[]) {
  return responses.flatMap(response => {
    if (!response.started_at || !response.completed_at) return [];
    const started = new Date(response.started_at).getTime();
    const completed = new Date(response.completed_at).getTime();
    if (!Number.isFinite(started) || !Number.isFinite(completed)) return [];
    const duration = completed - started;
    return duration > 0 ? [duration] : [];
  });
}

function formatResponseTime(ms: number) {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'A';
}

function questionTypeLabel(type: TestQuestion['type']) {
  return type
    .split('_')
    .map(word => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

const resultsShell: CSSProperties = {
  display: 'grid',
  gap: 24,
  color: '#111827',
};

const resultsHero: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
};

const eyebrow: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#8b5cf6',
  marginBottom: 8,
};

const resultsTitle: CSSProperties = {
  fontSize: 30,
  lineHeight: 1.05,
  fontWeight: 900,
  margin: 0,
  letterSpacing: '-0.04em',
};

const resultsSubtitle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 14,
  color: '#6b7280',
};

const refreshButton: CSSProperties = {
  border: '1px solid #e7e5e4',
  background: '#fff',
  borderRadius: 999,
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 800,
  color: '#292524',
  cursor: 'pointer',
};

const summaryGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 12,
};

const summaryCard: CSSProperties = {
  border: '1px solid #eee7df',
  background: '#fff',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 18px 40px rgba(17, 24, 39, 0.04)',
};

const summaryLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#78716c',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const summaryValue: CSSProperties = {
  fontSize: 32,
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: '-0.05em',
  marginTop: 10,
};

const summaryHelper: CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: '#78716c',
};

const sectionCard: CSSProperties = {
  border: '1px solid #eee7df',
  background: '#fff',
  borderRadius: 22,
  padding: 20,
  boxShadow: '0 18px 50px rgba(17, 24, 39, 0.05)',
};

const sectionHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 16,
  marginBottom: 16,
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: '-0.03em',
};

const sectionDescription: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: '#78716c',
  maxWidth: 420,
};

const questionStatsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12,
};

const questionStatCard: CSSProperties = {
  border: '1px solid #f0ebe5',
  background: '#fffdfb',
  borderRadius: 16,
  padding: 14,
};

const questionStatTop: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
};

const questionMeta: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: '#a8a29e',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 6,
};

const questionPrompt: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  lineHeight: 1.3,
};

const scoreBadge: CSSProperties = {
  flex: '0 0 auto',
  borderRadius: 999,
  background: '#f5f5f4',
  color: '#292524',
  padding: '5px 9px',
  fontSize: 12,
  fontWeight: 900,
};

const attentionBadge: CSSProperties = {
  ...scoreBadge,
  background: '#fee2e2',
  color: '#b91c1c',
};

const progressTrack: CSSProperties = {
  height: 8,
  background: '#f3f0ec',
  borderRadius: 999,
  overflow: 'hidden',
  marginTop: 14,
};

const progressFill: CSSProperties = {
  height: '100%',
  borderRadius: 999,
  transition: 'width 160ms ease',
};

const statLine: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  marginTop: 8,
  fontSize: 12,
  color: '#78716c',
};

const attentionText: CSSProperties = {
  color: '#b91c1c',
  fontWeight: 800,
};

const choiceList: CSSProperties = {
  marginTop: 12,
  display: 'grid',
  gap: 8,
};

const choiceRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 10,
  alignItems: 'center',
  fontSize: 12,
  color: '#57534e',
};

const choiceText: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  minWidth: 0,
};

const choiceNumber: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  height: 18,
  borderRadius: 6,
  background: '#f5f5f4',
  color: '#78716c',
  fontSize: 10,
  fontWeight: 900,
};

const choiceMetric: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '20px 56px 32px',
  alignItems: 'center',
  gap: 6,
  color: '#78716c',
  fontVariantNumeric: 'tabular-nums',
};

const miniTrack: CSSProperties = {
  display: 'block',
  height: 5,
  background: '#f3f0ec',
  borderRadius: 999,
  overflow: 'hidden',
};

const miniFill: CSSProperties = {
  display: 'block',
  height: '100%',
  background: '#a78bfa',
  borderRadius: 999,
};

const emptyState: CSSProperties = {
  background: '#fffdfb',
  border: '1px dashed #d6d3d1',
  borderRadius: 16,
  padding: 32,
  textAlign: 'center',
  color: '#78716c',
};

const responseList: CSSProperties = {
  display: 'grid',
  gap: 8,
};

const responseCard: CSSProperties = {
  background: '#fffdfb',
  border: '1px solid #f0ebe5',
  borderRadius: 16,
  overflow: 'hidden',
};

const responseButton: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '14px 16px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
};

const responseIdentity: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
};

const avatarCircle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 12,
  background: '#292524',
  color: '#fff',
  fontSize: 12,
  fontWeight: 900,
};

const responseName: CSSProperties = {
  fontSize: 14,
  fontWeight: 850,
  color: '#1c1917',
};

const responseDate: CSSProperties = {
  marginTop: 3,
  fontSize: 12,
  color: '#a8a29e',
};

const responseRight: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flex: '0 0 auto',
};

const responseScorePill: CSSProperties = {
  padding: '5px 10px',
  background: '#dcfce7',
  color: '#15803d',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const timedOutPill: CSSProperties = {
  padding: '5px 10px',
  background: '#fee2e2',
  color: '#b91c1c',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const chevron: CSSProperties = {
  color: '#a8a29e',
  fontSize: 16,
};

const answerDetailGrid: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: '12px 16px 16px',
  borderTop: '1px solid #f0ebe5',
};

const answerDetailCard: CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 12,
  borderRadius: 12,
  background: '#fff',
  border: '1px solid #f5f0ea',
};

const answerQuestionLine: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  fontSize: 13,
  fontWeight: 800,
  color: '#57534e',
};

const answerValue: CSSProperties = {
  fontSize: 14,
  color: '#111827',
};

const correctMark: CSSProperties = {
  flex: '0 0 auto',
  color: '#15803d',
  fontSize: 12,
  fontWeight: 900,
};

const incorrectMark: CSSProperties = {
  ...correctMark,
  color: '#b91c1c',
};
