// useMarkOrdersStale 훅 테스트. 켜졌을 때만 주문 캐시를 낡은 것으로 두고, 다시 받지는 않는지 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { useMarkOrdersStale } from "./use-mark-orders-stale";

/** 완료 화면이 승인과 같이 받아 둔 것. 서버가 결제 완료를 적기 전이라 결제 대기다 */
function setup(ready: boolean) {
  const client = new QueryClient();
  client.setQueryData(QUERY_KEYS.order.detail("77"), { orderId: 77, orderStatus: "PENDING" });
  client.setQueryData(QUERY_KEYS.order.list(), { pages: [], pageParams: [] });
  const refetch = vi.spyOn(client, "refetchQueries");

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  renderHook(() => useMarkOrdersStale(ready), { wrapper });

  const invalidated = (queryKey: readonly unknown[]) =>
    client.getQueryState(queryKey)?.isInvalidated;
  return { invalidated, refetch };
}

// 표시하지 않으면 60초 동안 주문 상세가 결제 전 모습을 쓰고, 목록은 방금 산 주문을 모른다 (#416)
test("켜지면 주문 상세와 목록을 낡은 것으로 둔다", () => {
  const { invalidated } = setup(true);

  expect(invalidated(QUERY_KEYS.order.detail("77"))).toBe(true);
  expect(invalidated(QUERY_KEYS.order.list())).toBe(true);
});

// 서버가 아직 결제 완료를 적기 전일 수 있다. 지금 받으면 같은 모습이 새것으로 다시 들어앉는다
test("표시만 하고 다시 받지는 않는다", () => {
  const { refetch } = setup(true);

  expect(refetch).not.toHaveBeenCalled();
});

test("꺼져 있으면 건드리지 않는다", () => {
  const { invalidated } = setup(false);

  expect(invalidated(QUERY_KEYS.order.detail("77"))).toBe(false);
});
