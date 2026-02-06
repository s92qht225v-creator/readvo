/**
 * Audio Player Hook
 *
 * Manages audio playback with strict concurrency control.
 *
 * INVARIANTS:
 * - Only ONE audio can play at a time (globally)
 * - Starting new audio ALWAYS stops previous audio
 * - Audio state is always consistent with actual playback
 * - No race conditions between load/play/stop operations
 */

import { useCallback, useRef, useState, useEffect } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface AudioState {
  /** Currently playing sentence ID (null if nothing playing) */
  playingSentenceId: string | null;

  /** Sentence ID that is currently loading (null if not loading) */
  loadingSentenceId: string | null;

  /** Error message if last operation failed */
  error: string | null;
}

export interface AudioPlayerControls {
  /** Current audio state */
  state: AudioState;

  /** Play audio for a sentence. Stops any currently playing audio first. */
  play: (sentenceId: string, audioUrl: string) => void;

  /** Stop currently playing audio */
  stop: () => void;

  /** Check if a specific sentence is playing */
  isPlaying: (sentenceId: string) => boolean;

  /** Check if a specific sentence is loading */
  isLoading: (sentenceId: string) => boolean;
}

// =============================================================================
// SINGLETON AUDIO ELEMENT
// =============================================================================

/**
 * Single audio element shared across all hook instances.
 * This is the key to preventing concurrent playback.
 */
let globalAudioElement: HTMLAudioElement | null = null;
let globalCurrentSentenceId: string | null = null;
let globalStateListeners: Set<(state: AudioState) => void> = new Set();

function getGlobalAudio(): HTMLAudioElement {
  if (!globalAudioElement) {
    globalAudioElement = new Audio();

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (globalAudioElement) {
          globalAudioElement.pause();
          globalAudioElement.src = '';
        }
      });
    }
  }
  return globalAudioElement;
}

function notifyListeners(state: AudioState): void {
  globalStateListeners.forEach((listener) => listener(state));
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useAudioPlayer(): AudioPlayerControls {
  const [state, setState] = useState<AudioState>({
    playingSentenceId: null,
    loadingSentenceId: null,
    error: null,
  });

  // Track if this hook instance is mounted
  const isMountedRef = useRef(true);

  // Register this component as a listener for global state changes
  useEffect(() => {
    isMountedRef.current = true;

    const listener = (newState: AudioState) => {
      if (isMountedRef.current) {
        setState(newState);
      }
    };

    globalStateListeners.add(listener);

    // Sync with current global state on mount
    if (globalCurrentSentenceId) {
      const audio = getGlobalAudio();
      setState({
        playingSentenceId: audio.paused ? null : globalCurrentSentenceId,
        loadingSentenceId: null,
        error: null,
      });
    }

    return () => {
      isMountedRef.current = false;
      globalStateListeners.delete(listener);
    };
  }, []);

  /**
   * Stop any currently playing audio.
   * This is the foundation of the concurrency guard.
   */
  const stop = useCallback(() => {
    const audio = getGlobalAudio();

    // Remove all listeners to prevent stale callbacks
    audio.oncanplaythrough = null;
    audio.onended = null;
    audio.onerror = null;
    audio.onpause = null;

    // Stop playback
    audio.pause();
    audio.currentTime = 0;
    audio.src = '';

    // Update global state
    globalCurrentSentenceId = null;

    const newState: AudioState = {
      playingSentenceId: null,
      loadingSentenceId: null,
      error: null,
    };

    notifyListeners(newState);
  }, []);

  /**
   * Play audio for a sentence.
   * ALWAYS stops any currently playing audio first.
   */
  const play = useCallback(
    (sentenceId: string, audioUrl: string) => {
      const audio = getGlobalAudio();

      // CRITICAL: Stop any current playback first
      // This is the concurrency guard
      stop();

      // If clicking the same sentence that was playing, just stop (toggle behavior)
      if (globalCurrentSentenceId === sentenceId) {
        return;
      }

      // Update to loading state
      globalCurrentSentenceId = sentenceId;

      const loadingState: AudioState = {
        playingSentenceId: null,
        loadingSentenceId: sentenceId,
        error: null,
      };
      notifyListeners(loadingState);

      // Set up event handlers BEFORE setting src
      audio.oncanplaythrough = () => {
        // Double-check this is still the current sentence
        // (guards against rapid clicks)
        if (globalCurrentSentenceId !== sentenceId) {
          return;
        }

        const playingState: AudioState = {
          playingSentenceId: sentenceId,
          loadingSentenceId: null,
          error: null,
        };
        notifyListeners(playingState);

        // Actually start playback
        audio.play().catch((err) => {
          console.error('Audio play failed:', err);
          const errorState: AudioState = {
            playingSentenceId: null,
            loadingSentenceId: null,
            error: `Failed to play: ${err.message}`,
          };
          notifyListeners(errorState);
        });
      };

      audio.onended = () => {
        if (globalCurrentSentenceId === sentenceId) {
          globalCurrentSentenceId = null;
          const endedState: AudioState = {
            playingSentenceId: null,
            loadingSentenceId: null,
            error: null,
          };
          notifyListeners(endedState);
        }
      };

      audio.onerror = () => {
        if (globalCurrentSentenceId === sentenceId) {
          globalCurrentSentenceId = null;
          const errorState: AudioState = {
            playingSentenceId: null,
            loadingSentenceId: null,
            error: `Failed to load audio: ${audioUrl}`,
          };
          notifyListeners(errorState);
        }
      };

      // Start loading
      audio.src = audioUrl;
      audio.load();
    },
    [stop]
  );

  /**
   * Check if a specific sentence is playing.
   */
  const isPlaying = useCallback(
    (sentenceId: string): boolean => {
      return state.playingSentenceId === sentenceId;
    },
    [state.playingSentenceId]
  );

  /**
   * Check if a specific sentence is loading.
   */
  const isLoading = useCallback(
    (sentenceId: string): boolean => {
      return state.loadingSentenceId === sentenceId;
    },
    [state.loadingSentenceId]
  );

  return {
    state,
    play,
    stop,
    isPlaying,
    isLoading,
  };
}

// =============================================================================
// IMPERATIVE API (for use outside React)
// =============================================================================

/**
 * Stop all audio playback (imperative, non-React API).
 * Useful for page navigation or cleanup.
 */
export function stopAllAudio(): void {
  if (globalAudioElement) {
    globalAudioElement.pause();
    globalAudioElement.currentTime = 0;
    globalAudioElement.src = '';
    globalCurrentSentenceId = null;

    notifyListeners({
      playingSentenceId: null,
      loadingSentenceId: null,
      error: null,
    });
  }
}
