// 선택 상태 테스트. 신청이 걸렸는지 판정하는 것은 `entities/order`의 `claim-status.test.ts`가 본다.
import { expect, test } from "vitest";

import { toRequestItems, toggleSelection } from "./claim-selection";

test("켤 때 수량은 1로 시작하고 다시 누르면 목록에서 빠진다", () => {
  const picked = toggleSelection({}, 11);
  expect(picked).toEqual({ 11: 1 });
  expect(toggleSelection(picked, 11)).toEqual({});
});

// 수량을 0으로 만들 수 있으면 서버 `@Positive`에 걸린다. 스테퍼 하한이 1이라 0이 들어올 길이 없다
test("고른 것만 요청 모양으로 옮긴다", () => {
  expect(toRequestItems({ 11: 2, 12: 1 })).toEqual([
    { orderItemId: 11, quantity: 2 },
    { orderItemId: 12, quantity: 1 },
  ]);
  expect(toRequestItems({})).toEqual([]);
});
