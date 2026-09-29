// 주문 완료 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
//
// **쿼리만 읽어 넘긴다.** 토스 결제창이 성공으로 돌아오면 `?paymentType=&orderId=&paymentKey=&amount=`가
// 붙고, 거기에 우리가 결제창에 들어가기 전 실어 둔 숫자 주문 id(`?order=`)가 함께 온다 (#301).
//
// **승인은 여기서 부르지 않는다.** 이 파일은 서버 컴포넌트라 `accessToken`이 없다 — 토큰은
// 브라우저 메모리에만 있어 서버 렌더에서는 `Authorization`이 붙지 않고, 백엔드
// `confirmPayment(@MemberId …)`가 회원을 못 찾아 막는다. 서버용 주소(`API_BASE_URL_INTERNAL`)도
// 없어 `apiRequest`가 그 앞에서 던진다. 승인은 화면 쪽 클라이언트 컴포넌트가 맡는다 (#308).

import { CheckoutDoneView, ORDER_PARAM, readOrderId } from "@/views/checkout";

type PaymentDonePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 쿼리는 문자열이거나 배열이거나 없다. 하나짜리 문자열만 받는다 */
function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function PaymentDonePage({ searchParams }: PaymentDonePageProps) {
  const params = await searchParams;

  return (
    <CheckoutDoneView
      paymentKey={one(params.paymentKey)}
      // **토스가 붙이는 `orderId`는 문자열 주문번호다.** 승인 본문에 그대로 들어가는 값이고,
      // 주문 상세 라우트가 받는 숫자 id가 아니다 (payment-flow-contract "orderId가 두 개")
      tossOrderId={one(params.orderId)}
      amount={Number(one(params.amount))}
      orderId={readOrderId(one(params[ORDER_PARAM]))}
    />
  );
}
