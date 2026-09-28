// API 연동 전 상품 상세와 비교 화면이 공유하는 상품 요약 목데이터.
export const MOCK_DETAIL_PRODUCT = {
  name: "면역 지원 영양제 90정",
  price: 21_000,
  kind: "supplement" as const,
  // views/product-detail의 예시 분석(EXAMPLE_ANALYSIS) 점수와 맞춘다. 둘 다 AI가 붙기 전의 예시다
  matchScore: 92,
};
