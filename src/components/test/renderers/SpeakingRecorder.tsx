'use client';

import { useEffect, useRef, useState } from 'react';

type RecState = 'idle' | 'requesting' | 'recording' | 'uploading' | 'done' | 'error';

interface Props {
  slug: string;
  responseId?: string;
  respondentToken: string;
  questionId: string;
  maxSeconds: number;
  recorded: boolean;
  onRecorded: () => void;
}

export function SpeakingRecorder({
  slug, responseId, respondentToken, questionId, maxSeconds, recorded, onRecorded,
}: Props) {
  // If the answer was already recorded (resumed from autosave), start in done.
  const [state, setState] = useState<RecState>(recorded ? 'done' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(maxSeconds);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>('');
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const clearTimers = () => {
    if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  // Cleanup on unmount: stop media + timers.
  useEffect(() => () => { clearTimers(); stopTracks(); }, []);

  const startRecording = async () => {
    if (state === 'recording' || state === 'requesting' || state === 'uploading') return;
    setErrorMsg('');
    setState('requesting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Microphone not supported in this browser.');
      setState('error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      mimeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        clearTimers();
        stopTracks();
        void uploadAudio();
      };
      recorder.start(100);
      setCountdown(maxSeconds);
      setState('recording');
      // Live countdown.
      tickRef.current = setInterval(() => {
        setCountdown(c => Math.max(0, c - 1));
      }, 1000);
      // Auto-stop at maxSeconds.
      stopTimerRef.current = setTimeout(() => stopRecording(), maxSeconds * 1000);
    } catch (err) {
      stopTracks();
      const name = (err as DOMException)?.name;
      setErrorMsg(name === 'NotFoundError' ? 'No microphone found.' : 'Microphone access denied.');
      setState('error');
    }
  };

  const stopRecording = () => {
    clearTimers();
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop(); // → onstop → uploadAudio
    }
  };

  const uploadAudio = async () => {
    setState('uploading');
    try {
      const mimeType = mimeRef.current;
      const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const formData = new FormData();
      formData.append('respondent_token', respondentToken);
      formData.append('response_id', responseId ?? '');
      formData.append('question_id', questionId);
      formData.append('audio', blob, `answer.${ext}`);

      const res = await fetch(`/api/t/${slug}/speaking-grade`, { method: 'POST', body: formData });

      if (res.ok) {
        onRecorded();
        setState('done');
        return;
      }
      let code = '';
      try {
        const data = await res.json() as { error?: string };
        code = data.error ?? '';
      } catch { /* non-JSON error body */ }
      if (res.status === 403 || code === 'not_pro') {
        setErrorMsg("Speaking grading isn't enabled for this test.");
      } else if (res.status === 429 || code === 'cap_reached') {
        setErrorMsg('Daily limit reached, try again later.');
      } else {
        setErrorMsg('Couldn’t save your recording. Try again.');
      }
      setState('error');
    } catch {
      setErrorMsg('Couldn’t save your recording. Try again.');
      setState('error');
    }
  };

  // Preview / builder: no real session → cannot record.
  if (!responseId) {
    return (
      <div className="test-speaking">
        <button type="button" className="test-speaking__record" disabled aria-disabled="true">
          <span className="test-speaking__dot" aria-hidden="true">●</span>
          Record your answer
        </button>
        <p className="test-speaking__hint">Recording works in the live test.</p>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div className="test-speaking">
        <div className="test-speaking__done" role="status">
          <span aria-hidden="true">✓</span> Recorded
        </div>
      </div>
    );
  }

  if (state === 'recording') {
    return (
      <div className="test-speaking">
        <button type="button" className="test-speaking__stop" onClick={stopRecording}>
          <span className="test-speaking__square" aria-hidden="true">■</span>
          Stop recording
        </button>
        <p className="test-speaking__countdown" aria-live="polite">{countdown}s</p>
      </div>
    );
  }

  if (state === 'uploading') {
    return (
      <div className="test-speaking">
        <div className="test-speaking__status" role="status">Saving…</div>
      </div>
    );
  }

  // idle | requesting | error
  return (
    <div className="test-speaking">
      <button
        type="button"
        className="test-speaking__record"
        onClick={startRecording}
        disabled={state === 'requesting'}
      >
        <span className="test-speaking__dot" aria-hidden="true">●</span>
        {state === 'requesting' ? 'Starting…' : 'Record your answer'}
      </button>
      {state === 'error' ? (
        <p className="test-speaking__error" role="alert">{errorMsg}</p>
      ) : (
        <p className="test-speaking__hint">You have one attempt. Max {maxSeconds}s.</p>
      )}
    </div>
  );
}
