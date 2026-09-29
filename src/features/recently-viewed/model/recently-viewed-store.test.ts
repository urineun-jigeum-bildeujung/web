// 최근 본 상품 스토어 테스트. 최신순·중복·상한·빼기와 브라우저 저장을 본다.
import { beforeEach, expect, test, vi } from "vitest";

import { RECENTLY_VIEWED_LIMIT, useRecentlyViewedStore } from "./recently-viewed-store";

const STORAGE_KEY = "gollaju.recentlyViewed";

beforeEach(() => {
  useRecentlyViewedStore.setState({ productIds: [] });
  localStorage.clear();
});

// PRD "정렬 기준: 최신순"
test("방금 본 상품이 맨 앞에 오고, 다시 보면 앞으로 옮긴다", () => {
  const { record } = useRecentlyViewedStore.getState();

  record(1);
  record(2);
  record(3);
  record(2);

  expect(useRecentlyViewedStore.getState().productIds).toEqual([2, 3, 1]);
});

// 와이어프레임 명세(73:2245) "최근 본 상품(최대 9개)"
test("최대 9개까지 남기고, 넘치면 가장 오래된 것부터 뺀다", () => {
  const { record } = useRecentlyViewedStore.getState();

  for (let productId = 1; productId <= RECENTLY_VIEWED_LIMIT + 2; productId += 1) {
    record(productId);
  }

  const { productIds } = useRecentlyViewedStore.getState();
  expect(productIds).toHaveLength(RECENTLY_VIEWED_LIMIT);
  expect(productIds[0]).toBe(RECENTLY_VIEWED_LIMIT + 2);
  expect(productIds).not.toContain(1);
  expect(productIds).not.toContain(2);
});

test("뺀 상품은 목록에서 사라진다", () => {
  const { record, remove } = useRecentlyViewedStore.getState();
  record(1);
  record(2);

  remove(1);

  expect(useRecentlyViewedStore.getState().productIds).toEqual([2]);
});

// 상세에 들어올 때마다 부른다. 같은 상품을 연달아 볼 때 저장을 다시 하지 않는다
test("같은 상품을 연달아 보면 상태가 바뀌지 않는다", () => {
  const { record } = useRecentlyViewedStore.getState();
  record(4);
  const listener = vi.fn();
  const unsubscribe = useRecentlyViewedStore.subscribe(listener);

  record(4);

  expect(listener).not.toHaveBeenCalled();
  unsubscribe();
});

test("목록은 번호만 브라우저에 남기고, 다시 열면 그대로 읽어 온다", async () => {
  useRecentlyViewedStore.getState().record(7);

  // 이름·가격 같은 서버 값은 남기지 않는다(AGENTS 5.1)
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
    state: { productIds: [7] },
    version: 1,
  });

  // 새로 연 탭처럼 저장소에만 있는 목록을 읽어 온다
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { productIds: [5, 4] }, version: 1 }));
  await useRecentlyViewedStore.persist.rehydrate();

  expect(useRecentlyViewedStore.getState().productIds).toEqual([5, 4]);
});
