// 반품 환불 예상 금액. 시안(mypa_361 3324:38968)의 "환불 안내" 칸을 채운다.
//
// **화면에서 세는 값이다.** 서버는 반품비를 모르고, 반품이 끝나도 환불을 일으키지 않는다(결제
// 취소로 이어지는 것은 주문 취소 하나뿐, 2026-09-23 백엔드 소스 확인). 신청하기 전에 얼마를
// 돌려받을지 가늠하도록 시안의 값으로 센다.
//
// **반품비 3,000원과 배송비 0원은 시안 값이다.** 사유와 관계없이 같다 — 시안이 사유에 따라
// 나누지 않는다. 배송비 0원은 처음 낸 배송비를 돌려주지 않는다는 뜻으로 읽었다 (#408).

/** 시안 mypa_361의 반품비 */
export const RETURN_FEE = 3000;

export type RefundEstimate = {
  /** 반품하는 상품의 개당 금액 × 수량 합 */
  productAmount: number;
  shippingFee: number;
  returnFee: number;
  /** 상품 금액에서 반품비를 뺀 것. 0 밑으로 내려가지 않는다 */
  refundAmount: number;
};

type RefundLine = { unitPrice: number; quantity: number };

export function estimateRefund(lines: RefundLine[]): RefundEstimate {
  const productAmount = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return {
    productAmount,
    shippingFee: 0,
    returnFee: RETURN_FEE,
    // 반품비보다 싼 상품을 돌려보내면 음수가 된다. 돌려받을 것이 없다는 뜻이라 0에서 멈춘다
    refundAmount: Math.max(0, productAmount - RETURN_FEE),
  };
}
