// 홈 카테고리의 URL 값과 라벨, 잘못된 쿼리 정규화.
// 서버 page.tsx와 클라이언트 view가 공유하므로 "use client" 경계 밖의 model에 둔다.
// API 매핑(CATEGORY_TO_API)은 entities/product가 갖고 있다 — 홈·좋아요 등 여러
// 화면이 같은 매핑을 쓴다(#390).

export const CATEGORIES = ["all", "food", "snack", "supplement"] as const;
export type HomeCategory = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<HomeCategory, string> = {
  all: "전체",
  food: "사료",
  snack: "간식",
  supplement: "영양제",
};

/** 클라이언트의 `parseAsStringLiteral`만 믿지 않는다. 서버 페이지가 searchParams를
 *  직접 읽을 때도 같은 규칙으로 걸러야 잘못된 값이 그대로 API로 새지 않는다 */
export function normalizeCategory(value: string | undefined): HomeCategory {
  return (CATEGORIES as readonly string[]).includes(value ?? "") ? (value as HomeCategory) : "all";
}
