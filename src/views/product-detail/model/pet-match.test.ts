// 적합도가 실제 아이의 이름·프로필·알레르기로 그려지는지, 종이 다른 상품을 재지 않는지 본다.
import { expect, test } from "vitest";

import { toPetMatch } from "./pet-match";

const CHOCO = {
  id: "7",
  name: "초코",
  species: "dog" as const,
  breedName: "말티즈",
  age: 3,
  weight: 4.5,
  allergies: [] as { code: string; displayName: string }[],
};

const DOG_FOOD = { targetSpecies: ["강아지"], allergens: [] };

// 예시 아이("소리")를 그리던 동안 내 아이가 누구든 남의 이름이 근거에까지 박혀 떴다 (#481)
test("이름과 프로필 줄은 고른 아이의 것이다", () => {
  const match = toPetMatch(CHOCO, DOG_FOOD);

  expect(match.petId).toBe("7");
  expect(match.petName).toBe("초코");
  expect(match.profileLabel).toBe("말티즈 · 3세 · 4.5kg");
  expect(match.summary).toBe("초코에게 꾸준히 급여하기 좋은 상품이에요");
  expect(JSON.stringify(match)).not.toContain("소리");
});

// 고양이에게 강아지 사료 점수를 보이면 근거가 거짓이 된다
test("급여 대상이 아닌 종이면 점수를 매기지 않는다", () => {
  const match = toPetMatch({ ...CHOCO, species: "cat" }, DOG_FOOD);

  expect(match.score).toBeNull();
  expect(match.nutrients).toEqual([]);
  expect(match.reasons).toEqual([
    { tone: "caution", text: "고양이 급여 대상이 아닌 상품이라 아직 재지 못했어요" },
  ]);
});

test("급여 대상이 비어 있으면 종으로 막지 않는다", () => {
  expect(toPetMatch({ ...CHOCO, species: "cat" }, { ...DOG_FOOD, targetSpecies: [] }).score).toBe(
    92,
  );
});

test("등록한 알레르기가 상품에 없으면 없다고 알린다", () => {
  const match = toPetMatch(
    { ...CHOCO, allergies: [{ code: "CHICKEN", displayName: "닭고기" }] },
    { ...DOG_FOOD, allergens: [{ code: "EGG", displayName: "계란", severity: "CRITICAL" }] },
  );

  expect(match.reasons).toContainEqual({
    tone: "good",
    text: "초코에게 등록된 알레르기 유발 성분이 없어요",
  });
});

test("등록한 알레르기가 상품에 들어 있으면 지켜볼 점으로 알린다", () => {
  const match = toPetMatch(
    {
      ...CHOCO,
      allergies: [
        { code: "EGG", displayName: "계란" },
        { code: "BEEF", displayName: "소고기" },
      ],
    },
    {
      ...DOG_FOOD,
      allergens: [
        { code: "EGG", displayName: "계란", severity: "CRITICAL" },
        { code: "BEEF", displayName: "소고기", severity: "WARNING" },
      ],
    },
  );

  expect(match.reasons).toContainEqual({
    tone: "caution",
    text: "알레르기로 등록한 계란·소고기가 들어 있어요",
  });
  expect(match.reasons.some((reason) => reason.text.includes("유발 성분이 없어요"))).toBe(false);
});

// 견줄 것이 없었을 뿐인데 "없어요"라고 하면 확인한 것처럼 읽힌다
test("등록한 알레르기가 없으면 알레르기 근거를 말하지 않는다", () => {
  const match = toPetMatch(CHOCO, {
    ...DOG_FOOD,
    allergens: [{ code: "EGG", displayName: "계란", severity: "CRITICAL" }],
  });

  expect(match.reasons.some((reason) => reason.text.includes("알레르기"))).toBe(false);
});
