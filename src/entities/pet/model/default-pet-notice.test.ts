// 기본 아이 변경 알림 문구 테스트. 받침에 따라 조사가 바뀌는지 본다.
import { expect, test } from "vitest";

import { defaultPetChangedMessage } from "./default-pet-notice";

test("받침이 없으면 '로', 있으면 '으로'를 붙인다", () => {
  expect(defaultPetChangedMessage("보리")).toBe("대표 아이가 보리로 바뀌었어요");
  expect(defaultPetChangedMessage("보람")).toBe("대표 아이가 보람으로 바뀌었어요");
});
