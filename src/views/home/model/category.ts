// 홈 카테고리의 URL 값과 API 매핑.
// 서버 page.tsx와 클라이언트 view가 공유하므로 "use client" 경계 밖의 model에 둔다.

import type { ProductCategory } from "@/entities/product";

export const CATEGORIES = ["all", "food", "snack", "supplement"] as const;
export type HomeCategory = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<HomeCategory, string> = {
  all: "전체",
  food: "사료",
  snack: "간식",
  supplement: "영양제",
};

/** 화면 카테고리 → 백엔드 `CategoryCode`. "전체"는 대응하는 백엔드 값이 없어
 *  이 맵에 없다 — 호출부가 "all"이면 category 자체를 안 보낸다.
 *  snack→TREAT는 단순 대문자 변환이 아니다(CategoryCode.java로 직접 확인, #289) */
export const CATEGORY_TO_API: Record<Exclude<HomeCategory, "all">, ProductCategory> = {
  food: "FOOD",
  snack: "TREAT",
  supplement: "SUPPLEMENT",
};

/** 클라이언트의 `parseAsStringLiteral`만 믿지 않는다. 서버 페이지가 searchParams를
 *  직접 읽을 때도 같은 규칙으로 걸러야 잘못된 값이 그대로 API로 새지 않는다 */
export function normalizeCategory(value: string | undefined): HomeCategory {
  return (CATEGORIES as readonly string[]).includes(value ?? "") ? (value as HomeCategory) : "all";
}
