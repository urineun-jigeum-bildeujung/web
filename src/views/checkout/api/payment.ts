// 결제 승인을 백엔드에 맡긴다. 토스 결제창이 성공으로 돌아온 뒤 한 번 부른다.
//
// **승인을 우리가 하지 않는 이유는 시크릿 키다.** 토스 승인 API는 시크릿 키로 인증하는데
// 그것이 브라우저에 닿으면 누구나 결제를 승인할 수 있다. 백엔드가 쥐고 부른다
// (2026-08-28 백엔드 협의, API 명세 `POST /payments/confirm`).
//
// 화면이 이 함수만 보게 해 두면 API가 생겼을 때 이 안이 `apiRequest` 호출로 바뀌고
// 화면 코드는 그대로 둘 수 있다.

/** 토스가 성공 주소에 실어 보내는 값 */
export type PaymentConfirmRequest = {
  /** 이 결제를 가리키는 토스 쪽 키 */
  paymentKey: string;
  orderId: string;
  /** 토스가 돌려준 금액. 요청한 금액과 같은지 확인한 뒤에만 보낸다 */
  amount: number;
};

export type PaymentConfirmResult = {
  orderId: string;
  /** 주문 상세로 가는 식별자. 주문번호와 같은 값인지는 API 계약이 정해져야 안다 */
  orderNo: string;
  /** 승인된 금액 */
  amount: number;
  /** "토스페이"처럼 이미 다듬어진 문자열 */
  payMethod: string;
};

/**
 * 결제를 최종 승인한다.
 *
 * **부르기 전에 금액을 맞춰 봐야 한다.** 주소창의 `amount`는 사용자가 고칠 수 있어
 * 그대로 믿으면 1원짜리 승인이 지나간다. 토스 문서가 요구하는 검증이다.
 */
export async function confirmPayment(
  request: PaymentConfirmRequest,
): Promise<PaymentConfirmResult> {
  // API 계약이 정해지면 이 자리가 `apiRequest<PaymentConfirmResult>("/payments/confirm", …)`가 된다.
  // 명세(`POST /payments/confirm`)는 있지만 아직 "시작 전"이다.
  return {
    orderId: request.orderId,
    orderNo: "20260829-1234567",
    amount: request.amount,
    payMethod: "토스페이",
  };
}
