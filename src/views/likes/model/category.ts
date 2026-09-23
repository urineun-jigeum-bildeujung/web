// 좋아요 화면 카테고리 칩의 URL 값과 라벨.
// API 매핑(CATEGORY_TO_API)은 entities/product가 갖고 있다 — 홈 화면과 공유한다(#390).

export const CATEGORY_VALUES = ["all", "food", "snack", "supplement"] as const;
export type LikesCategory = (typeof CATEGORY_VALUES)[number];

export const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "food", label: "사료" },
  { value: "snack", label: "간식" },
  { value: "supplement", label: "영양제" },
] as const satisfies { value: LikesCategory; label: string }[];
