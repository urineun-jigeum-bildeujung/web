// 바로 구매 상품 조회 테스트. 일반 상품은 상품 상세, 타임딜은 딜 상세를 부르는지 본다.
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const { getProductDetail, getTimeDealDetail } = vi.hoisted(() => ({
  getProductDetail: vi.fn(),
  getTimeDealDetail: vi.fn(),
}));
vi.mock("@/entities/product", () => ({ getProductDetail, getTimeDealDetail }));

import { useQueryBuyNowProduct } from "./use-query-buy-now-product";

beforeEach(() => {
  vi.clearAllMocks();
  getProductDetail.mockResolvedValue({ productId: 252, name: "일반 상품" });
  getTimeDealDetail.mockResolvedValue({ productId: 252, name: "딜 상품" });
});

test("일반 상품은 상품 상세를 부른다", async () => {
  const { result } = renderHook(
    () => useQueryBuyNowProduct({ itemType: "NORMAL", itemId: 252, quantity: 1 }),
    { wrapper: createQueryWrapper() },
  );

  await waitFor(() => expect(result.current.data?.name).toBe("일반 상품"));
  expect(getProductDetail).toHaveBeenCalledWith("252");
  expect(getTimeDealDetail).not.toHaveBeenCalled();
});

// 딜가는 딜 상세에만 온다. 상품 상세를 부르면 정가로 결제 금액이 보인다 (#484)
test("타임딜은 딜 아이템 번호로 딜 상세를 부른다", async () => {
  const { result } = renderHook(
    () => useQueryBuyNowProduct({ itemType: "TIME_DEAL", itemId: 7, quantity: 1 }),
    { wrapper: createQueryWrapper() },
  );

  await waitFor(() => expect(result.current.data?.name).toBe("딜 상품"));
  expect(getTimeDealDetail).toHaveBeenCalledWith("7");
  expect(getProductDetail).not.toHaveBeenCalled();
});

test("바로 구매가 아니면 부르지 않는다", () => {
  renderHook(() => useQueryBuyNowProduct(null), { wrapper: createQueryWrapper() });

  expect(getProductDetail).not.toHaveBeenCalled();
  expect(getTimeDealDetail).not.toHaveBeenCalled();
});
