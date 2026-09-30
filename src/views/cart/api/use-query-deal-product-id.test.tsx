// 딜 줄의 상품 번호 조회 테스트. 딜 상세를 딜 아이템 번호로 부르는지, 일반 줄은 부르지 않는지 본다.
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const { getTimeDealDetail } = vi.hoisted(() => ({ getTimeDealDetail: vi.fn() }));
vi.mock("@/entities/product", () => ({ getTimeDealDetail }));

import { useQueryDealProductId } from "./use-query-deal-product-id";

beforeEach(() => {
  vi.clearAllMocks();
  getTimeDealDetail.mockResolvedValue({ productId: 252, name: "딜 상품" });
});

// 장바구니 응답에는 딜 아이템 번호만 온다. 상세 주소에는 상품 번호가 있어야 한다 (#563)
test("딜 아이템 번호로 딜 상세를 불러 상품 번호를 준다", async () => {
  const { result } = renderHook(() => useQueryDealProductId(7), {
    wrapper: createQueryWrapper(),
  });

  await waitFor(() => expect(result.current).toBe(252));
  expect(getTimeDealDetail).toHaveBeenCalledWith("7");
});

// 일반 줄은 줄 번호가 곧 상품 번호다. 줄마다 요청을 내보내지 않는다
test("번호를 주지 않으면 부르지 않는다", () => {
  const { result } = renderHook(() => useQueryDealProductId(null), {
    wrapper: createQueryWrapper(),
  });

  expect(result.current).toBeUndefined();
  expect(getTimeDealDetail).not.toHaveBeenCalled();
});
