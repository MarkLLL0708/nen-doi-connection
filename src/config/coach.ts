/** Options for "Gợi ý nói chuyện". The weekly free limit lives in app_settings (coach_free_weekly, default 3). */
export const COACH_USE_CASES = ["rewrite", "apologize", "space", "cute", "restart", "questions", "dialect"] as const;
export const COACH_TONES = ["gentle", "cute", "funny", "mature", "direct", "flirty", "parents"] as const;
export const COACH_DIALECTS = ["north", "south", "neutral"] as const;
export const COACH_MAX_INPUT = 1000;

export type CoachUseCase = typeof COACH_USE_CASES[number];
export type CoachTone = typeof COACH_TONES[number];
export type CoachDialect = typeof COACH_DIALECTS[number];
export type CoachVersions = { short: string; medium: string; long: string };
export type CoachResult =
  | { kind: "ok"; versions: CoachVersions; remaining: number }
  | { kind: "safety" }
  | { kind: "refuse" }
  | { kind: "limit" };

/** The three approved "Thử ví dụ" samples. */
export const COACH_EXAMPLES: { useCase: CoachUseCase; tone: CoachTone; text: string }[] = [
  { useCase: "rewrite", tone: "gentle", text: "Sao nay không trả lời tin nhắn? Bận gì mà không nhắn được một câu?" },
  { useCase: "apologize", tone: "mature", text: "Mình quên mất ngày kỷ niệm của hai đứa." },
  { useCase: "space", tone: "gentle", text: "Mình đang quá tải, muốn ở một mình tối nay." },
];
