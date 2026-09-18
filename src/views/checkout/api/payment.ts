// 결제 승인을 백엔드에 맡긴다. 토스 결제창이 성공으로 돌아온 뒤 한 번 부른다.
//
// **승인을 우리가 하지 않는 이유는 시크릿 키다.** 토스 승인 API는 시크릿 키로 인증하는데
// 그것이 브라우저에 닿으면 누구나 결제를 승인할 수 있다. 백엔드가 쥐고 부른다
// (2026-08-28 백엔드 협의).
//
// **승인 경로는 `POST /payments/confirm`이다** (2026-09-18 백엔드 확정, #255).
//
// **이 파일은 결제 흐름의 [2]와 [5]를 맡는다.** [1] 주문 생성은 `orders.ts`에 있다.
// 순서는 주문 생성 → 결제 요청 → 위젯 → 복귀 → 승인이고, 건너뛰면 승인에서 막힌다.
//
// **`orderId`가 두 개다.** `[2]`에 넘기는 것은 주문의 **숫자 PK**이고, 위젯과 승인에 쓰는
// 것은 `[2]`가 돌려주는 **문자열 주문번호**(`tossOrderId`)다. 이름이 비슷해 섞이기 쉽다.

import { apiRequest } from "@/shared/api/client";

const PAYMENTS_PATH = "/payments";

/** 결제 요청에 보내는 것. 주문 생성이 돌려준 숫자 PK다 */
export type PreparePaymentRequest = {
  orderId: number;
};

/**
 * 결제창을 띄우는 데 필요한 값 전부.
 *
 * **`tossOrderId`는 토스가 보는 주문번호다.** 그전에는 프론트가 UUID로 만들어 썼는데,
 * 그러면 백엔드가 승인 때 어느 주문인지 찾지 못한다.
 */
export type PreparePaymentResult = {
  tossOrderId: string;
  amount: number;
  orderName: string;
  /** 위젯이 이 사용자를 알아보는 키. 익명(`ANONYMOUS`)으로 두면 결제수단이 저장되지 않는다 */
  customerKey: string;
};

/** 주문을 결제할 준비를 시키고 위젯에 넘길 값을 받는다 */
export function preparePayment(request: PreparePaymentRequest): Promise<PreparePaymentResult> {
  return apiRequest<PreparePaymentResult>(PAYMENTS_PATH, { method: "POST", body: request });
}

/** 토스가 성공 주소에 실어 보내는 값 */
export type PaymentConfirmRequest = {
  /** 이 결제를 가리키는 토스 쪽 키 */
  paymentKey: string;
  orderId: string;
  /** 토스가 돌려준 금액. 요청한 금액과 같은지 확인한 뒤에만 보낸다 */
  amount: number;
};

export type PaymentConfirmResult = {
  paymentId: number;
  /** 사용자에게 보여주는 주문번호 */
  orderNumber: string;
  /** 즉시 승인되는 수단만 다루므로 성공이면 `DONE`이다 */
  paymentStatus: string;
  /** 승인된 금액 */
  amount: number;
  /** "토스페이"처럼 이미 다듬어진 문자열 */
  method: string;
  approvedAt: string;
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
  return apiRequest<PaymentConfirmResult>(`${PAYMENTS_PATH}/confirm`, {
    method: "POST",
    body: request,
  });
}
