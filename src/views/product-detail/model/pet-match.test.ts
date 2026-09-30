// 중앙 Nutrition Safety를 절대 안전 표현이나 가짜 점수 없이 화면 모델로 옮기는지 본다.
import { expect, test } from "vitest";

import { toPetMatch } from "./pet-match";

const CHOCO = {
  id: "7",
  name: "초코",
  breedName: "말티즈",
  age: 3,
  weight: 4.5,
};

test("아이 프로필은 유지하지만 가짜 적합도와 영양값을 만들지 않는다", () => {
  const match = toPetMatch(CHOCO, { safety_status: "NO_CONFLICT_DETECTED" });

  expect(match.petId).toBe("7");
  expect(match.petName).toBe("초코");
  expect(match.profileLabel).toBe("말티즈 · 3세 · 4.5kg");
  expect(match.score).toBeNull();
  expect(match.nutrients).toEqual([]);
  expect(match.functions).toBe("");
  expect(match.summary).toBeNull();
});

test("NO_CONFLICT_DETECTED는 제한된 근거 문구를 사용한다", () => {
  const match = toPetMatch(CHOCO, { safety_status: "NO_CONFLICT_DETECTED" });

  expect(match.reasons).toEqual([
    {
      tone: "good",
      text: "현재 등록 정보와 확인 가능한 상품 정보 기준으로 충돌이 확인되지 않았습니다.",
    },
  ]);
});

test("SAFETY_BLOCKED는 runtime의 사유 문구를 주의로 보여준다", () => {
  const match = toPetMatch(CHOCO, {
    safety_status: "SAFETY_BLOCKED",
    safety_message: "반려동물 종과 상품 대상 종이 일치하지 않습니다.",
  });

  expect(match.reasons).toEqual([
    { tone: "caution", text: "반려동물 종과 상품 대상 종이 일치하지 않습니다." },
  ]);
});

test("SAFETY_DATA_INSUFFICIENT는 위험으로 단정하지 않고 근거 부족을 알린다", () => {
  const match = toPetMatch(CHOCO, { safety_status: "SAFETY_DATA_INSUFFICIENT" });

  expect(match.reasons).toEqual([
    {
      tone: "caution",
      text: "상품 정보를 충분히 확인할 수 없어 안전 여부를 판단하기 어렵습니다.",
    },
  ]);
});
