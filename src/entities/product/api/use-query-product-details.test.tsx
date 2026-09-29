// 여러 상품 상세 훅 테스트. 준 순서대로 돌려주고, 없어진 상품과 실패를 가르는지 본다.
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { ApiError } from "@/shared/api/client";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const getProductDetail = vi.fn();
vi.mock("./products", () => ({
  getProductDetail: (productId: string) => getProductDetail(productId),
}));

import { useQueryProductDetails } from "./use-query-product-details";

const product = (productId: number) => ({ productId, name: `상품 ${productId}`, images: [] });

afterEach(() => getProductDetail.mockReset());

test("준 번호 순서대로 상세를 돌려준다", async () => {
  getProductDetail.mockImplementation((id: string) => Promise.resolve(product(Number(id))));

  const { result } = renderHook(() => useQueryProductDetails([3, 1]), {
    wrapper: createQueryWrapper(),
  });

  await waitFor(() => expect(result.current.entries.every((entry) => entry.product)).toBe(true));
  expect(result.current.entries.map((entry) => entry.product?.name)).toEqual(["상품 3", "상품 1"]);
  expect(getProductDetail).toHaveBeenCalledWith("3");
});

// 없어진 상품을 실패로 알리면 목록 전체가 오류처럼 보인다
test("없어진 상품(404)은 실패가 아니라 없음으로 가른다", async () => {
  getProductDetail.mockImplementation((id: string) =>
    id === "2"
      ? Promise.reject(new ApiError(404, "없음"))
      : id === "5"
        ? Promise.reject(new ApiError(503, "잠시 문제"))
        : Promise.resolve(product(Number(id))),
  );

  const { result } = renderHook(() => useQueryProductDetails([1, 2, 5]), {
    wrapper: createQueryWrapper(),
  });

  await waitFor(() => expect(result.current.entries.some((entry) => entry.isLoading)).toBe(false));
  const [found, gone, failed] = result.current.entries;
  expect(found).toMatchObject({ notFound: false, isError: false });
  expect(gone).toMatchObject({ notFound: true, isError: false });
  expect(failed).toMatchObject({ notFound: false, isError: true });
  // 화면은 이 실패로 문구를 고른다. 404는 막는 실패가 아니다
  expect(result.current.error).toMatchObject({ status: 503 });
});

// 창에 다시 들어왔다 재조회가 한 번 실패했다고 보이던 카드를 지우면 안 된다(#509 리뷰)
test("받아 둔 상품은 뒤이은 재조회가 실패해도 그대로 두고 실패로 세지 않는다", async () => {
  getProductDetail.mockImplementation((id: string) => Promise.resolve(product(Number(id))));
  const wrapper = createQueryWrapper();
  const first = renderHook(() => useQueryProductDetails([1]), { wrapper });
  await waitFor(() => expect(first.result.current.entries[0].product).toBeDefined());
  first.unmount();

  // 같은 캐시로 다시 그리면 오래된 값이라 다시 부른다. 이번에는 실패한다
  getProductDetail.mockRejectedValue(new ApiError(503, "잠시 문제"));
  const { result } = renderHook(() => useQueryProductDetails([1]), { wrapper });
  await waitFor(() => expect(getProductDetail).toHaveBeenCalledTimes(2));
  // 실패가 캐시에 반영될 때까지 기다린다. TanStack은 알림을 다음 차례로 미룬다
  await act(() => new Promise((resolve) => setTimeout(resolve, 20)));

  expect(result.current.entries[0]).toMatchObject({ product: { name: "상품 1" }, isError: false });
  expect(result.current.error).toBeNull();
});

test("다시 시도는 404가 아닌 실패만 다시 부른다", async () => {
  getProductDetail.mockImplementation((id: string) =>
    id === "2"
      ? Promise.reject(new ApiError(404, "없음"))
      : Promise.reject(new ApiError(503, "잠시 문제")),
  );
  const { result } = renderHook(() => useQueryProductDetails([2, 5]), {
    wrapper: createQueryWrapper(),
  });
  await waitFor(() => expect(result.current.entries[1].isError).toBe(true));
  getProductDetail.mockClear();

  result.current.refetchFailed();

  await waitFor(() => expect(getProductDetail).toHaveBeenCalledTimes(1));
  expect(getProductDetail).toHaveBeenCalledWith("5");
});
