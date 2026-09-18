// 토스 결제 UI. 결제수단 고르기를 위젯이 그리고 결제창까지 띄운다.
//
// 결제수단 목록·할부 개월·간편결제 분기를 우리가 만들지 않는 이유는 component-convention의
// "외부 위젯이 그린다" 항목이다. 카드 정보 입력창은 아예 토스가 띄우는 별도 창이다.
//
// **승인은 여기서 하지 않는다.** 시크릿 키를 쥔 백엔드가 `POST /payments/confirm`으로 맡는다.
// 우리는 결제창을 띄우고 돌아온 값을 완료 화면으로 넘기는 데까지다 (#212·#255).

"use client";

import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useEffect, useRef, useState } from "react";

/**
 * 결제창에 실을 주문. **위젯을 띄울 때가 아니라 결제창을 열 때 받는다.**
 *
 * 두 값 모두 `[2] POST /payments`가 주는데, 그 호출은 결제 버튼을 누른 뒤에야 일어난다 —
 * `[1]` 주문 생성에 배송 요청사항이 들어가기 때문이다. 위젯은 그전에 결제수단을 그려 두어야
 * 하므로 이 둘을 prop으로 받을 수 없다 (#255).
 */
export type TossPaymentOrder = {
  /** 토스가 6~64자 고유값을 요구한다. 백엔드가 준 `tossOrderId`를 그대로 넘긴다 */
  orderId: string;
  orderName: string;
};

type TossPaymentWidgetProps = {
  /** 결제할 금액. 위젯이 이 값으로 할부 개월 같은 것을 정한다 */
  amount: number;
  /** 결제창을 띄울 수 있게 준비됐는지 알린다. 버튼 잠금에 쓴다 */
  onReady: (requestPayment: ((order: TossPaymentOrder) => Promise<void>) | null) => void;
  /** 백엔드 `POST /payments`가 준 값. 없으면 비회원으로 연다 */
  customerKey?: string;
};

/** 위젯을 띄울 자리. 토스가 CSS 선택자로 찾는다 */
const METHODS_SELECTOR = "toss-payment-methods";

/** 키가 없거나 위젯을 못 띄웠을 때. 원인은 화면에 내보내지 않는다 */
const LOAD_FAILED = "결제 수단을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";

/** 위젯을 띄우고 그 조작 객체를 준다. 두 번 부르면 토스가 AlreadyRenderedError를 던진다 */
async function renderWidgets(clientKey: string, amount: number, customerKey: string) {
  const tossPayments = await loadTossPayments(clientKey);
  // **`customerKey`는 백엔드 `POST /payments`가 준다.** 그 값으로 열어야 승인 때 같은 사용자로
  // 이어진다. 값이 없으면 비회원(`ANONYMOUS`)으로 여는데, 그 경우 결제수단이 저장되지 않는다
  const widgets = tossPayments.widgets({ customerKey: customerKey || ANONYMOUS });

  await widgets.setAmount({ currency: "KRW", value: amount });
  await widgets.renderPaymentMethods({ selector: `#${METHODS_SELECTOR}` });

  return widgets;
}

export function TossPaymentWidget({ amount, onReady, customerKey = "" }: TossPaymentWidgetProps) {
  // 키는 렌더 시점에 알 수 있다. effect에서 판단하면 한 번 그린 뒤에 고치게 된다
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const [failed, setFailed] = useState(false);

  // **`onReady`를 의존성에 두지 않는다.** 두면 부르는 쪽이 렌더마다 새 함수를 넘길 때
  // effect가 다시 돌고, 그때마다 새 `requestPayment`를 넘겨 부모 상태가 바뀌어
  // 렌더가 무한히 되돈다 — 브라우저가 멈춘다 (#223).
  //
  // 아이덴티티 안정을 부르는 쪽에 맡기지 않는 이유는, 그것이 React Compiler의
  // 메모이제이션에 기대게 되기 때문이다. 메모이제이션은 성능 최적화라 언제든 빠질 수 있고
  // 실제로 한 커밋 만에 빠졌다. 콜백은 늘 최신 것을 ref로 읽는다.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });
  // 띄우기는 한 번, 기다리기는 매번이다. **끝난 자리를 boolean으로 들면 안 된다** —
  // StrictMode는 effect를 두 번 돌리는데, 첫 번째가 정리되고 두 번째가 "이미 띄웠다"며
  // 그냥 돌아서면 `onReady`를 아무도 부르지 않아 결제 버튼이 잠긴 채로 남는다.
  // 약속을 들고 있으면 두 번째도 같은 위젯을 기다렸다가 제 몫을 한다.
  const widgetsRef = useRef<ReturnType<typeof renderWidgets> | null>(null);

  useEffect(() => {
    // 키가 없으면 결제창을 띄울 수 없다. 버튼은 `requestPayment`가 없어 잠긴 채로 남는다
    if (!clientKey) {
      return;
    }

    // **한 번 띄운 위젯의 customerKey는 바꿀 수 없다.** 그래서 처음 값으로만 연다 —
    // 값이 늦게 와도 다시 띄우지 않는다. 늦게 오는 경우는 부르는 쪽이 값이 온 뒤에
    // 이 컴포넌트를 그려서 막는다
    widgetsRef.current ??= renderWidgets(clientKey, amount, customerKey);

    let disposed = false;

    void widgetsRef.current
      .then(async (widgets) => {
        // 금액이 바뀌면 위젯에 다시 알린다. 처음 띄울 때 넣은 값과 같으면 그대로다
        await widgets.setAmount({ currency: "KRW", value: amount });

        if (disposed) {
          return;
        }

        onReadyRef.current(async ({ orderId, orderName }) => {
          // Redirect 방식이라 결제가 끝나면 브라우저가 아래 주소로 돌아온다.
          // 성공 주소에는 paymentKey·orderId·amount가 쿼리로 붙는다
          await widgets.requestPayment({
            orderId,
            orderName,
            successUrl: `${window.location.origin}/payment/done`,
            failUrl: `${window.location.origin}/payment`,
          });
        });
      })
      .catch(() => {
        if (disposed) {
          return;
        }
        // 토스 오류 문자열을 그대로 내보내면 사용자가 읽을 수 없다
        setFailed(true);
        onReadyRef.current(null);
      });

    return () => {
      disposed = true;
    };
  }, [amount, clientKey, customerKey]);

  if (!clientKey || failed) {
    return (
      <p role="alert" className="text-body-medium-14 text-text-body-secondary">
        {LOAD_FAILED}
      </p>
    );
  }

  // 토스가 이 자리를 선택자로 찾아 채운다. 비어 있는 동안에는 위젯이 자체 뼈대를 그린다
  return <div id={METHODS_SELECTOR} />;
}
