/**
 * Per-speaker TTS voices for dialogues, so A/B (and the occasional C) sound
 * like different people.
 *
 * Shared by the dialogue reader and the role-play (Practice) tab — they must
 * agree, or the same line comes back in a different voice per tab and the
 * two-person effect is lost. Lives here rather than in DialogueReader because
 * that module imports DialogueRolePlay (importing back would be circular).
 *
 * An unmapped speaker → undefined → the /api/tts route's default voice.
 */
export const DIALOGUE_VOICE: Record<string, string> = { A: '茉莉', B: '白桦', C: '苏打' };

/**
 * Resolve a line's voice, honouring a per-dialogue override (e.g. swapping the
 * A/B genders for one dialogue) layered over the global map.
 */
export const voiceForWith = (
  s: { speaker?: string },
  override?: Record<string, string>,
): string | undefined =>
  (s.speaker && ((override && override[s.speaker]) || DIALOGUE_VOICE[s.speaker])) || undefined;
