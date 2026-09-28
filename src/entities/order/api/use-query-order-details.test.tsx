// useQueryOrderDetails 훅 테스트. 여러 주문의 상세를 모아 주는지, 하나라도 받는 중이면 기다린다고
// 알리는지, 실패를 숨기지 않는지, 상세 화면과 같은 캐시 키를 쓰는지 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const { getOrderDetail } = vi.hoisted(() => ({ getOrderDetail: vi.fn() }));
vi.mock("./orders", () => ({ getOrderDetail }));

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { useQueryOrderDetails } from "./use-query-order-details";

function setup(orderIds: number[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useQueryOrderDetails(orderIds), { wrapper });
  return { client, result };
}

beforeEach(() => {
  vi.clearAllMocks();
  getOrderDetail.mockImplementation(async (orderId: number) => ({ orderId }));
});

test("주문마다 상세를 받아 모은다", async () => {
  const { result } = setup([2, 4]);

  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.details).toEqual([{ orderId: 2 }, { orderId: 4 }]);
  expect(result.current.error).toBeNull();
});

test("받을 주문이 없으면 기다리지 않는다", () => {
  const { result } = setup([]);

  expect(result.current.isLoading).toBe(false);
  expect(result.current.details).toEqual([]);
  expect(getOrderDetail).not.toHaveBeenCalled();
});

// 조용히 빼면 그 주문의 건이 사라진 것처럼 보인다. 부르는 쪽이 알릴 수 있게 실패를 넘긴다
test("처음 받기에 실패한 것은 세어 알리고 받은 것은 남긴다", async () => {
  getOrderDetail.mockImplementation(async (orderId: number) => {
    if (orderId === 4) {
      throw new Error("network down");
    }
    return { orderId };
  });
  const { result } = setup([2, 4]);

  await waitFor(() => expect(result.current.error).not.toBeNull());
  expect(result.current.failedCount).toBe(1);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.details).toEqual([{ orderId: 2 }]);
});

// TanStack은 다시 받기가 실패해도 받아 둔 상세를 둔 채 오류 상태가 된다. 그것까지 넘기면
// 화면이 보이던 건을 치우고 오류로 덮는다(#474)
test("다시 받다 실패한 것은 실패로 세지 않고 받아 둔 상세를 그대로 준다", async () => {
  const { client, result } = setup([2, 4]);
  await waitFor(() => expect(result.current.details).toHaveLength(2));

  getOrderDetail.mockImplementation(async (orderId: number) => {
    if (orderId === 4) {
      throw new Error("network down");
    }
    return { orderId };
  });
  await act(() => client.refetchQueries());
  // 다시 받기가 실제로 실패해 캐시가 오류 상태가 된 것을 먼저 확인한다. TanStack은 결과 알림을
  // 다음 틱에 묶어 보내므로, 틱을 넘겨 훅이 그 상태로 다시 그려진 뒤에 본다 — 바로 보면 실패 전
  // 값을 보고 통과해 아무것도 지키지 못한다
  expect(client.getQueryState(QUERY_KEYS.order.detail("4"))?.status).toBe("error");
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)));

  expect(result.current.error).toBeNull();
  expect(result.current.failedCount).toBe(0);
  expect(result.current.details).toEqual([{ orderId: 2 }, { orderId: 4 }]);
});

test("다시 시도는 처음 받기에 실패한 상세만 다시 받는다", async () => {
  getOrderDetail.mockImplementation(async (orderId: number) => {
    if (orderId === 4) {
      throw new Error("network down");
    }
    return { orderId };
  });
  const { result } = setup([2, 4]);
  await waitFor(() => expect(result.current.failedCount).toBe(1));

  getOrderDetail.mockImplementation(async (orderId: number) => ({ orderId }));
  act(() => result.current.retry());

  await waitFor(() => expect(result.current.failedCount).toBe(0));
  expect(result.current.details).toEqual([{ orderId: 2 }, { orderId: 4 }]);
  // 받아 둔 2번은 다시 부르지 않는다
  expect(getOrderDetail.mock.calls.filter(([orderId]) => orderId === 2)).toHaveLength(1);
  expect(getOrderDetail.mock.calls.filter(([orderId]) => orderId === 4)).toHaveLength(2);
});

// 라우트가 주문 번호를 문자열로 넘긴다. 숫자 키로 두면 상세 화면에서 같은 주문을 또 받는다
test("상세 화면과 같은 문자열 키에 담는다", async () => {
  const { client, result } = setup([2]);

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(client.getQueryData(QUERY_KEYS.order.detail("2"))).toEqual({ orderId: 2 });
});
