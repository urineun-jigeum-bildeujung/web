// 주문 완료 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
//
// 토스 결제창이 성공으로 돌아오면 `?paymentKey=&orderId=&amount=`가 붙는다.
// 승인은 서버에서 한 번만 불러야 해서 이 자리에서 처리하고 결과만 화면에 넘긴다 (#212).
import { CheckoutDoneView, confirmPayment } from "@/views/checkout";

type PaymentDonePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 쿼리는 문자열이거나 배열이거나 없다. 하나짜리 문자열만 받는다 */
function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function PaymentDonePage({ searchParams }: PaymentDonePageProps) {
  const params = await searchParams;
  const paymentKey = one(params.paymentKey);
  const orderId = one(params.orderId);
  const amount = Number(one(params.amount));

  // 셋이 다 있고 금액이 숫자일 때만 승인을 부른다. 주소창으로 직접 들어온 경우가 걸러진다
  const payment =
    paymentKey && orderId && Number.isFinite(amount)
      ? await confirmPayment({ paymentKey, orderId, amount })
      : null;

  return <CheckoutDoneView payment={payment} />;
}
