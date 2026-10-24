export const CATEGORIES = [
  "LLM/생성AI",
  "로보틱스",
  "이미지/영상AI",
  "AI 칩/인프라",
  "정책/규제",
  "비즈니스/투자",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];
