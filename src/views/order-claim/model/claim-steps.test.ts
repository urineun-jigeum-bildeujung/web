// 단계 보정 테스트. 새로고침으로 값이 비었을 때 값이 있는 단계까지만 당기는지 본다.
import { expect, test } from "vitest";

import { reachableStep } from "./claim-steps";

// 새로고침하면 화면 상태가 비는데 주소는 `?step=pickup`으로 남는다
test("고른 상품이 없으면 어느 단계든 첫 단계로 돌린다", () => {
  const empty = { picked: false, reasoned: false };

  expect(reachableStep("items", empty)).toBe("items");
  expect(reachableStep("reason", empty)).toBe("items");
  expect(reachableStep("pickup", empty)).toBe("items");
});

// 앞으로 가기 버튼으로 ③에 다시 들어와도 사유 없이 접수 버튼이 서면 안 된다
test("사유 없이 수거 단계면 사유 단계로 돌린다", () => {
  expect(reachableStep("pickup", { picked: true, reasoned: false })).toBe("reason");
});

test("값이 있으면 주소의 단계를 그대로 둔다", () => {
  const filled = { picked: true, reasoned: true };

  expect(reachableStep("items", filled)).toBe("items");
  expect(reachableStep("reason", filled)).toBe("reason");
  expect(reachableStep("pickup", filled)).toBe("pickup");
  // 사유는 ②에서 고르는 것이라 ②까지는 사유 없이도 간다
  expect(reachableStep("reason", { picked: true, reasoned: false })).toBe("reason");
});
