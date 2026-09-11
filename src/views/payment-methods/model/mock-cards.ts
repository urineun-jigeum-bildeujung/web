// 간편결제 카드 목데이터. API 계약이 정해지기 전까지 쓴다.
//
// 화면이 상수를 직접 보면 목록이 늘 차 있어 빈 상태가 닿지 않는다(#159).
// 라우트가 이 값을 넘기고, 연동하면 그 자리에 조회 결과가 들어간다.

export type PaymentCard = {
  id: string;
  /** 카드사 약칭. 로고가 붙기 전까지 이 글자를 보인다 */
  issuer: string;
  name: string;
  /** 가려진 카드번호. 원본은 앱에 남지 않는다 */
  masked: string;
};

export const MOCK_CARDS: PaymentCard[] = [
  { id: "1", issuer: "KB", name: "KB국민카드", masked: "****-****-****-1234" },
  { id: "2", issuer: "KB", name: "엄마카드", masked: "****-****-****-1234" },
  { id: "3", issuer: "KB", name: "내 카드", masked: "****-****-****-1234" },
];
