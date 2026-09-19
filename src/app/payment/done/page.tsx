// 주문 완료 라우트. 경로는 임시이며 라우터 구조 확정 시 교체한다.
//
// 토스 결제창이 성공으로 돌아오면 `?paymentKey=&orderId=&amount=`가 붙는다.
// 승인은 서버에서 한 번만 불러야 해서 이 자리에서 처리하고 결과만 화면에 넘긴다 (#212).
//
// **승인 실패를 라우트 오류로 떨어뜨리지 않는다.** 여기까지 왔다는 것은 토스 결제창에서는
// 성공했다는 뜻이라, 이미 돈이 빠져나갔을 수 있다. 그 상태에서 "화면이 멈췄어요"만 보이면
// 사용자는 결제가 어떻게 됐는지도, 무엇으로 문의해야 하는지도 알 수 없다 (#260).
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE_CODE, type AppMessageCode } from "@/shared/config/app-message";
import { CheckoutDoneView, confirmPayment, type PaymentFailure } from "@/views/checkout";

type PaymentDonePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 쿼리는 문자열이거나 배열이거나 없다. 하나짜리 문자열만 받는다 */
function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

/**
 * 승인 실패를 결제 맥락의 문구로 옮긴다.
 *
 * **일반 실패 문구를 그대로 쓰면 안 된다.** 네트워크 오류는 평소에 "네트워크 상태를 확인해
 * 주세요"로 떨어지는데, 이 화면에서 그 말은 다시 시도하라는 뜻으로 읽힌다. 결제창에서는
 * 이미 성공한 뒤라 그 행동이 두 번 결제로 이어질 수 있다.
 *
 * 그래서 결제용으로 만든 문구(`payment.*`)만 그대로 쓰고 나머지는 전부 승인 실패로 모은다.
 */
function toConfirmFailureCode(error: unknown): AppMessageCode {
  const code = toAppMessageCode(error);
  return code.startsWith("payment.") ? code : APP_MESSAGE_CODE.payment.confirmFailed;
}

export default async function PaymentDonePage({ searchParams }: PaymentDonePageProps) {
  const params = await searchParams;
  const paymentKey = one(params.paymentKey);
  const orderId = one(params.orderId);
  const amount = Number(one(params.amount));

  let payment = null;
  let failure: PaymentFailure | null = null;

  // 셋이 다 있고 금액이 숫자일 때만 승인을 부른다. 주소창으로 직접 들어온 경우가 걸러진다
  if (paymentKey && orderId && Number.isFinite(amount)) {
    try {
      payment = await confirmPayment({ paymentKey, orderId, amount });
    } catch (error) {
      // **주문번호를 함께 넘긴다.** 승인이 실패하면 응답이 없어 화면이 댈 수 있는 식별자가
      // 토스에서 받은 이 값뿐이다. 문의할 때 사용자가 부르는 번호다
      failure = { orderId, code: toConfirmFailureCode(error) };
    }
  }

  return <CheckoutDoneView payment={payment} failure={failure} />;
}
