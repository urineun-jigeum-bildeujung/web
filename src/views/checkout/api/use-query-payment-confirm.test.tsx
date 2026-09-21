// 결제 승인 훅. **같은 결제에 승인이 두 번 나가지 않는 것**이 이 테스트의 전부다.
//
// 화면 테스트는 이 훅을 목으로 바꾸므로 그 보장을 보지 못한다. 여기서는 진짜 훅을
// `QueryClientProvider`와 `StrictMode` 아래에 올려 호출 횟수를 센다 (#308 리뷰).
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const { confirmPayment } = vi.hoisted(() => ({ confirmPayment: vi.fn() }));
vi.mock("./payment", () => ({ confirmPayment }));

import { useQueryPaymentConfirm } from "./use-query-payment-confirm";

const QUERY = { paymentKey: "tviva20260919", tossOrderId: "ORD-20260919-000001", amount: 12345 };

/** 훅만 돌리는 껍데기. 화면은 이 테스트의 관심이 아니다 */
function Probe(props: Parameters<typeof useQueryPaymentConfirm>[0]) {
  useQueryPaymentConfirm(props);
  return null;
}

/**
 * 테스트마다 새 `QueryClient`를 쓴다.
 *
 * 하나를 돌려쓰면 앞 테스트의 캐시가 남아 "부르지 않았다"를 단언할 수 없다.
 * `retry: false`는 실패 케이스가 기다리지 않게 한다.
 */
function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <StrictMode>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </StrictMode>
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * **StrictMode는 effect를 두 번 돌린다.** 승인을 그대로 두 번 보내면 토스가 거절하고,
 * 사용자에게는 결제가 실패한 것으로 보인다. 같은 키의 요청을 React Query가 합쳐서 막는다.
 */
test("StrictMode에서 두 번 마운트돼도 승인은 한 번만 나간다", async () => {
  confirmPayment.mockResolvedValue({ orderNumber: "ORD-20260919-000001", amount: 12345 });

  render(<Probe {...QUERY} />, { wrapper: wrapper() });

  await waitFor(() => expect(confirmPayment).toHaveBeenCalled());
  expect(confirmPayment).toHaveBeenCalledTimes(1);
  expect(confirmPayment).toHaveBeenCalledWith({
    paymentKey: QUERY.paymentKey,
    // 승인 본문에 가는 것은 토스가 준 문자열 주문번호다
    orderId: QUERY.tossOrderId,
    amount: QUERY.amount,
  });
});

/**
 * **승인이 실패해도 저절로 다시 나가면 안 된다.**
 *
 * `retry: false`만으로는 모자라다. 실패한 쿼리는 데이터가 없어 `staleTime`이 무한이어도
 * stale로 남아, 기본값대로면 다시 마운트될 때 한 번 더 나간다. 결제 승인에서 그것은
 * 두 번 결제로 이어질 수 있는 길이다 (#308 리뷰).
 */
test("승인이 실패해도 다시 마운트될 때 또 부르지 않는다", async () => {
  confirmPayment.mockRejectedValue(new Error("승인 실패"));
  const Wrapper = wrapper();

  const first = render(<Probe {...QUERY} />, { wrapper: Wrapper });
  await waitFor(() => expect(confirmPayment).toHaveBeenCalled());
  expect(confirmPayment).toHaveBeenCalledTimes(1);

  first.unmount();
  render(<Probe {...QUERY} />, { wrapper: Wrapper });

  // 다시 나갔다면 여기서 2가 된다
  await waitFor(() => expect(confirmPayment).toHaveBeenCalledTimes(1));
});

// 결제를 마치고 온 주소가 아니다. 그 상태로 서버를 부르면 400만 받는다
test("복귀 쿼리가 없으면 아예 부르지 않는다", async () => {
  render(<Probe paymentKey={undefined} tossOrderId={undefined} amount={Number.NaN} />, {
    wrapper: wrapper(),
  });

  await waitFor(() => expect(confirmPayment).not.toHaveBeenCalled());
});

test("금액이 숫자가 아니면 부르지 않는다", async () => {
  render(<Probe {...QUERY} amount={Number.NaN} />, { wrapper: wrapper() });

  await waitFor(() => expect(confirmPayment).not.toHaveBeenCalled());
});
