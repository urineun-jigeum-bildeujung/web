// 나의 상품 후기 목데이터. API 계약이 정해지기 전까지 쓴다.
//
// 화면이 상수를 직접 보면 목록이 늘 차 있어 빈 상태가 닿지 않는다(#159).
// 라우트가 이 값을 넘기고, 연동하면 그 자리에 조회 결과가 들어간다.

/** 아직 후기를 안 쓴 구매 항목 */
export type WritableReview = {
  id: string;
  name: string;
  option: string;
  /** "26.08.28" */
  purchasedAt: string;
  /** 작성 기한까지 남은 날 */
  daysLeft: number;
};

/** 이미 쓴 후기 */
export type WrittenReview = {
  id: string;
  name: string;
  /** "26.08.28" */
  writtenAt: string;
  /** 0~5 */
  rating: number;
  content: string;
};

export const MOCK_WRITABLE: WritableReview[] = Array.from({ length: 4 }, (_, index) => ({
  id: String(index),
  name: "상품명",
  option: "상품 옵션",
  purchasedAt: "26.08.28",
  daysLeft: 30,
}));

export const MOCK_WRITTEN: WrittenReview[] = Array.from({ length: 4 }, (_, index) => ({
  id: String(index),
  name: "상품명",
  writtenAt: "26.08.28",
  rating: 4,
  content:
    "후기 더미 - 입맛 까다로운 우리 아이도 잔여 없이 그릇을 싹싹 비울 만큼 기호성이 정말 좋아요! 잘...",
}));
