// useMutateOrder 훅 테스트. 구매 확정·주문 취소가 끝나면 어느 캐시를 낡은 것으로 두는지 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

const { confirmOrder, cancelOrder } = vi.hoisted(() => ({
  confirmOrder: vi.fn(),
  cancelOrder: vi.fn(),
}));
vi.mock("./orders", () => ({ confirmOrder, cancelOrder }));

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { useMutateOrder } from "./use-mutate-order";

/** 주문 목록과 작성할 수 있는 리뷰 목록을 받아 둔 상태 */
function setup() {
  const client = new QueryClient();
  client.setQueryData(QUERY_KEYS.order.list(), { pages: [], pageParams: [] });
  client.setQueryData(QUERY_KEYS.review.myWritable(), []);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMutateOrder(), { wrapper });

  const invalidated = (queryKey: readonly unknown[]) =>
    client.getQueryState(queryKey)?.isInvalidated;
  return { result, invalidated };
}

afterEach(() => {
  vi.clearAllMocks();
});

/**
 * **구매 확정이 리뷰를 쓸 자격을 연다.** 서버가 작성할 수 있는 리뷰 목록을 확정된 주문으로
 * 만든다. 받아 둔 목록을 두면 60초 동안 방금 확정한 상품이 빠져 보인다 (#416).
 */
test("구매를 확정하면 주문과 작성할 수 있는 리뷰 목록을 낡은 것으로 둔다", async () => {
  confirmOrder.mockResolvedValueOnce(undefined);
  const { result, invalidated } = setup();

  await result.current.confirm(77);

  expect(invalidated(QUERY_KEYS.order.list())).toBe(true);
  expect(invalidated(QUERY_KEYS.review.myWritable())).toBe(true);
});

// 취소한 주문으로는 리뷰를 쓸 수 없다. 리뷰 목록까지 다시 받을 까닭이 없다
test("주문을 취소하면 주문만 낡은 것으로 둔다", async () => {
  cancelOrder.mockResolvedValueOnce(undefined);
  const { result, invalidated } = setup();

  await result.current.cancel(77);

  expect(invalidated(QUERY_KEYS.order.list())).toBe(true);
  expect(invalidated(QUERY_KEYS.review.myWritable())).toBe(false);
});
