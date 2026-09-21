// "작성 가능한 리뷰" 목데이터. 그 목록 API가 백엔드에 아직 없어 쓴다(#291).
//
// 화면이 상수를 직접 보면 목록이 늘 차 있어 빈 상태가 닿지 않는다(#159).
// 라우트가 이 값을 넘기고, 연동하면 그 자리에 조회 결과가 들어간다.
// 값은 UI 시안(mypa_041_작성가능)의 것이다. 작성한 리뷰는 서버에서 받는다.

/** 아직 후기를 안 쓴 구매 항목 */
export type WritableReview = {
  id: string;
  name: string;
  imageUrl?: string;
  /** "26.08.28" */
  purchasedAt: string;
  /** 작성 기한까지 남은 날 */
  daysLeft: number;
};

export const MOCK_WRITABLE: WritableReview[] = [
  { id: "0", name: "저자극 덴탈껌 14개입", purchasedAt: "26.08.28", daysLeft: 30 },
  { id: "1", name: "베터 글루코사민", purchasedAt: "26.08.17", daysLeft: 30 },
  { id: "2", name: "잘먹는 독 기호성 사료 2kg", purchasedAt: "26.08.09", daysLeft: 30 },
];
