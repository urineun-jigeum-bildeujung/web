// 여러 상품 상세 훅 테스트. 준 순서대로 돌려주고, 없어진 상품과 실패를 가르는지 본다.
import { renderHook, waitFor } from "@testing-library/react";
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
