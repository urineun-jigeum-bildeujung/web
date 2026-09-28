// useQueryOrderDetails 훅 테스트. 여러 주문의 상세를 모아 주는지, 하나라도 받는 중이면 기다린다고
// 알리는지, 실패를 숨기지 않는지, 상세 화면과 같은 캐시 키를 쓰는지 본다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
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
test("하나라도 실패하면 그 실패를 알리고 받은 것은 남긴다", async () => {
  getOrderDetail.mockImplementation(async (orderId: number) => {
    if (orderId === 4) {
      throw new Error("network down");
    }
    return { orderId };
  });
  const { result } = setup([2, 4]);

  await waitFor(() => expect(result.current.error).not.toBeNull());
  expect(result.current.details).toEqual([{ orderId: 2 }]);
});

// 라우트가 주문 번호를 문자열로 넘긴다. 숫자 키로 두면 상세 화면에서 같은 주문을 또 받는다
test("상세 화면과 같은 문자열 키에 담는다", async () => {
  const { client, result } = setup([2]);

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(client.getQueryData(QUERY_KEYS.order.detail("2"))).toEqual({ orderId: 2 });
});
