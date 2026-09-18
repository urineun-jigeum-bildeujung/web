// 고른 값을 표시명으로 되돌리는 변환. 상세 조회가 알레르기를 코드로만 주기 때문에 필요하다.
import { expect, test } from "vitest";

import { toLabels, type HealthGroup } from "./health";

const GROUPS: HealthGroup[] = [
  {
    label: "알레르기",
    items: [
      { value: "CHICKEN", label: "닭고기" },
      { value: "BEEF", label: "소고기" },
    ],
  },
];

test("코드를 표시명으로 되돌린다", () => {
  expect(toLabels(["CHICKEN", "BEEF"], GROUPS)).toEqual(["닭고기", "소고기"]);
});

// 자리를 비우면 알레르기가 없는 아이로 읽힌다. 선택지가 아직 안 왔을 때도 마찬가지다
test("선택지에 없는 값은 그대로 보인다", () => {
  expect(toLabels(["BONITO"], GROUPS)).toEqual(["BONITO"]);
  expect(toLabels(["CHICKEN"], [])).toEqual(["CHICKEN"]);
});
