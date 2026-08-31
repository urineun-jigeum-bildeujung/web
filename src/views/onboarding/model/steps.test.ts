// 단계 진행 계산 테스트. 입력 단계만 세는지 검증한다.
import { expect, test } from "vitest";

import { getStepProgress } from "./steps";

test("입력 단계는 순서대로 번호를 매긴다", () => {
  expect(getStepProgress("basic")).toEqual({ current: 1, total: 3 });
  expect(getStepProgress("detail")).toEqual({ current: 2, total: 3 });
  expect(getStepProgress("health")).toEqual({ current: 3, total: 3 });
});

test("도입부·품종 선택·완료는 진행 표시에서 뺀다", () => {
  // 품종 선택은 detail의 하위 화면이라 별도 단계로 세면 진행률이 틀어진다.
  expect(getStepProgress("intro")).toBeNull();
  expect(getStepProgress("breed")).toBeNull();
  expect(getStepProgress("done")).toBeNull();
});
