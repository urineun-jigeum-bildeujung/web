// 화면 카테고리 값과 백엔드 CategoryCode 매핑. 여러 화면(홈·좋아요 등)이 공유한다.

import type { ProductCategory } from "../api/products";

export const CATEGORY_VALUES = ["food", "snack", "supplement"] as const;
export type CategoryValue = (typeof CATEGORY_VALUES)[number];

/** 화면 카테고리 → 백엔드 `CategoryCode`. snack→TREAT는 단순 대문자 변환이 아니다
 *  (CategoryCode.java로 직접 확인, #289) */
export const CATEGORY_TO_API: Record<CategoryValue, ProductCategory> = {
  food: "FOOD",
  snack: "TREAT",
  supplement: "SUPPLEMENT",
};
