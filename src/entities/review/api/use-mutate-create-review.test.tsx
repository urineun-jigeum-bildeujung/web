// useMutateCreateReview 훅 테스트. 후기를 쓰고 나면 어느 캐시를 낡은 것으로 두는지 본다.
//
// **상품 쪽은 목록만이 아니라 사진·대표 사진까지 비워야 한다(#339).** 셋이 키를 나눠 갖고
// 있어 목록만 비우면 사진을 올린 직후에도 리뷰 탭의 사진 줄과 사진 모음이 예전 그대로 남는다.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

const { createReview } = vi.hoisted(() => ({ createReview: vi.fn() }));
vi.mock("./reviews", () => ({ createReview, issueReviewImageUpload: vi.fn() }));

import { QUERY_KEYS } from "@/shared/config/query-keys";

import { useMutateCreateReview } from "./use-mutate-create-review";

/** 7번 상품의 리뷰 캐시 셋과 다른 상품(8번) 캐시, 내 후기 목록을 받아 둔 상태 */
function setup() {
  const client = new QueryClient();
  const keys = {
    list: QUERY_KEYS.review.byProduct("7", { sort: "recommend" }),
    photos: QUERY_KEYS.review.photos("7"),
    featured: QUERY_KEYS.review.featuredPhotos("7"),
    otherProduct: QUERY_KEYS.review.photos("8"),
    myList: QUERY_KEYS.review.myList(),
  };
  for (const key of Object.values(keys)) {
    client.setQueryData(key, { placeholder: true });
  }

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMutateCreateReview(), { wrapper });

  const invalidated = (queryKey: readonly unknown[]) =>
    client.getQueryState(queryKey)?.isInvalidated === true;
  return { result, keys, invalidated };
}

const REQUEST = {
  // 등록 요청은 상품을 **숫자**로 든다. 조회 화면은 문자열이라 훅이 맞춰 줘야 한다
  productId: 7,
  petIds: [1],
  starRate: 4.5,
  usagePeriod: 16,
  answerValues: [{ questionKey: "PALATABILITY", answerValue: "POSITIVE" }],
  text: "확실히 잘 먹어요",
};

afterEach(() => {
  vi.clearAllMocks();
});

test("후기를 쓰면 그 상품의 목록·사진·대표 사진을 함께 낡은 것으로 둔다", async () => {
  createReview.mockResolvedValueOnce({ reviewId: 1 });
  const { result, keys, invalidated } = setup();

  await result.current.createReview({ request: REQUEST, photos: [] });

  expect(invalidated(keys.list)).toBe(true);
  expect(invalidated(keys.photos)).toBe(true);
  expect(invalidated(keys.featured)).toBe(true);
  // 완료 화면의 "확인"이 내 후기 목록으로 간다
  expect(invalidated(keys.myList)).toBe(true);
});

test("다른 상품의 리뷰 캐시는 건드리지 않는다", async () => {
  createReview.mockResolvedValueOnce({ reviewId: 1 });
  const { result, keys, invalidated } = setup();

  await result.current.createReview({ request: REQUEST, photos: [] });

  expect(invalidated(keys.otherProduct)).toBe(false);
});
