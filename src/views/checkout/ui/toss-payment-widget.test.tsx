// 토스 결제위젯 테스트. 위젯을 띄운 뒤 결제창을 띄울 수단을 부모에게 넘기는지 본다.
import { act, render, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { renderPaymentMethods, requestPayment, setAmount, loadTossPayments } = vi.hoisted(() => ({
  renderPaymentMethods: vi.fn(async () => ({ destroy: vi.fn() })),
  requestPayment: vi.fn(async () => {}),
  setAmount: vi.fn(async () => {}),
  loadTossPayments: vi.fn(),
}));

vi.mock("@tosspayments/tosspayments-sdk", () => ({
  ANONYMOUS: "ANONYMOUS",
  loadTossPayments,
}));

import { TossPaymentWidget } from "./toss-payment-widget";

beforeEach(() => {
  vi.clearAllMocks();
  // 키는 빌드 때 번들에 박히는 값이라 테스트 환경에는 없다. 없으면 위젯 자체를 띄우지 않는다
  vi.stubEnv("NEXT_PUBLIC_TOSS_CLIENT_KEY", "test_gck_test");
  loadTossPayments.mockResolvedValue({
    widgets: () => ({ setAmount, renderPaymentMethods, requestPayment }),
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const PROPS = { amount: 12345 };

/** 결제창을 열 때 넘기는 주문. `[2] POST /payments`가 주는 값이다 */
const ORDER = { orderId: "ORD-20260918-000123", orderName: "상품명" };

/**
 * **StrictMode가 effect를 두 번 돌린다.** 첫 번째가 정리된 뒤 두 번째가 "이미 띄웠다"며
 * 그냥 돌아서면 `onReady`를 아무도 부르지 않아 결제 버튼이 영영 잠긴 채로 남는다.
 * 개발 서버에서 실제로 그렇게 막혔다 (#212).
 */
test("effect가 두 번 돌아도 결제 수단을 부모에게 넘긴다", async () => {
  const onReady = vi.fn();

  render(
    <StrictMode>
      <TossPaymentWidget {...PROPS} onReady={onReady} />
    </StrictMode>,
  );

  await waitFor(() => expect(onReady).toHaveBeenCalledWith(expect.any(Function)));
  // 위젯은 한 번만 띄운다. 두 번 부르면 토스가 AlreadyRenderedError를 던진다
  expect(renderPaymentMethods).toHaveBeenCalledTimes(1);
});

test("넘겨받은 수단을 부르면 결제창을 띄운다", async () => {
  const onReady = vi.fn();

  render(<TossPaymentWidget {...PROPS} onReady={onReady} />);

  await waitFor(() => expect(onReady).toHaveBeenCalledWith(expect.any(Function)));
  await onReady.mock.calls[0][0](ORDER);

  expect(requestPayment).toHaveBeenCalledWith(expect.objectContaining(ORDER));
});

// 위젯을 못 띄우면 버튼이 잠긴 채로 남아야 한다. 이유는 화면에 내보내지 않는다
test("위젯을 못 띄우면 안내를 띄우고 결제 수단을 넘기지 않는다", async () => {
  loadTossPayments.mockRejectedValue(new Error("network"));
  const onReady = vi.fn();

  const { findByRole } = render(<TossPaymentWidget {...PROPS} onReady={onReady} />);

  expect((await findByRole("alert")).textContent).toContain("결제 수단을 불러오지 못했어요");
  expect(onReady).toHaveBeenCalledWith(null);
});

// 키가 없으면 결제창을 띄울 수 없다. 버튼이 잠긴 채로 남아야 한다
test("키가 없으면 위젯을 띄우지 않는다", () => {
  vi.stubEnv("NEXT_PUBLIC_TOSS_CLIENT_KEY", "");
  const onReady = vi.fn();

  const { getByRole } = render(<TossPaymentWidget {...PROPS} onReady={onReady} />);

  expect(getByRole("alert").textContent).toContain("결제 수단을 불러오지 못했어요");
  expect(loadTossPayments).not.toHaveBeenCalled();
});

/**
 * **`onReady`가 바뀌어도 effect가 다시 돌면 안 된다.** 다시 돌면 새 `requestPayment`를 넘기고,
 * 부모가 그것을 state에 담으면서 렌더가 무한히 되돈다 — 브라우저가 멈춘다 (#223).
 *
 * 부르는 쪽이 함수를 고정해 주기를 기대하지 않는다. 그 기대는 React Compiler의 메모이제이션에
 * 기대는 것이고, 메모이제이션은 성능 최적화라 언제든 빠진다. 실제로 한 커밋 만에 빠졌다.
 */
test("onReady가 렌더마다 바뀌어도 위젯을 다시 띄우지 않는다", async () => {
  const first = vi.fn();
  const { rerender } = render(<TossPaymentWidget {...PROPS} onReady={first} />);

  await waitFor(() => expect(first).toHaveBeenCalledWith(expect.any(Function)));

  const second = vi.fn();
  rerender(<TossPaymentWidget {...PROPS} onReady={second} />);

  // effect가 다시 돌았다면 캐시된 약속의 `.then`이 마이크로태스크로 이어진다. 비우고 본다
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(second).not.toHaveBeenCalled();
  expect(first).toHaveBeenCalledTimes(1);
  expect(renderPaymentMethods).toHaveBeenCalledTimes(1);
});
