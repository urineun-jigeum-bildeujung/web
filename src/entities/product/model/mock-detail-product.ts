// API 연동 전 상품 상세와 비교 화면이 공유하는 상품 요약 목데이터.
export const MOCK_DETAIL_PRODUCT = {
  name: "면역 지원 영양제 90정",
  price: 21_000,
  kind: "supplement" as const,
  // views/product-detail의 PET_MATCHES(petId "1" 소리)가 이 상품에 매긴 실제 점수와 맞춘다
  matchScore: 92,
};
