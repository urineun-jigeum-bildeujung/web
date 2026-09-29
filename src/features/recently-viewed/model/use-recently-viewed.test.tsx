// 최근 본 상품 읽기·기록 훅 테스트. 서버에서는 목록을 모르고, 브라우저에서는 저장된 목록을 쓰는지 본다.
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, expect, test } from "vitest";

import { useRecentlyViewedStore } from "./recently-viewed-store";
import { useRecentlyViewed } from "./use-recently-viewed";
import { useRecordRecentlyViewed } from "./use-record-recently-viewed";

beforeEach(() => {
  useRecentlyViewedStore.setState({ productIds: [] });
  localStorage.clear();
});

function ServerProbe() {
  const { ready, productIds } = useRecentlyViewed();
  // 한 문자열로 그린다. 글자 조각을 나누면 서버 HTML에 구분 주석이 끼어든다
  return <p>{`${String(ready)}:${productIds.join(",")}`}</p>;
}

// 서버 HTML과 브라우저 첫 렌더가 어긋나지 않게, 서버에서는 준비 안 됨·빈 목록으로 그린다
test("서버에서 그리면 저장된 목록이 있어도 준비되지 않은 빈 목록이다", () => {
  useRecentlyViewedStore.setState({ productIds: [3, 1] });

  expect(renderToString(<ServerProbe />)).toBe("<p>false:</p>");
});

test("브라우저에서는 저장된 목록을 최신순으로 준다", () => {
  useRecentlyViewedStore.setState({ productIds: [3, 1] });

  const { result } = renderHook(() => useRecentlyViewed());

  expect(result.current.ready).toBe(true);
  expect(result.current.productIds).toEqual([3, 1]);
});

test("목록에서 빼면 읽는 쪽도 바로 바뀐다", () => {
  useRecentlyViewedStore.setState({ productIds: [3, 1] });
  const { result } = renderHook(() => useRecentlyViewed());

  act(() => result.current.remove(3));

  expect(result.current.productIds).toEqual([1]);
});

test("상품 상세가 부르면 그 상품을 맨 앞에 남긴다", () => {
  useRecentlyViewedStore.setState({ productIds: [1] });

  const { rerender } = renderHook(({ productId }) => useRecordRecentlyViewed(productId), {
    initialProps: { productId: 5 },
  });
  expect(useRecentlyViewedStore.getState().productIds).toEqual([5, 1]);

  rerender({ productId: 1 });
  expect(useRecentlyViewedStore.getState().productIds).toEqual([1, 5]);
});
