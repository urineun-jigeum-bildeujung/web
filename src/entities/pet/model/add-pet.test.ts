// 아이를 더 들일 수 있는지와 들이러 가는 주소를 본다.
import { expect, test } from "vitest";

import { canAddPet, MAX_PETS, toAddPetHref } from "./add-pet";

const petsOf = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `${index}` }));

// 5마리를 채운 뒤에도 추가 자리가 남아 여섯째가 등록됐다(QA No.130)
test("상한 5마리를 채우면 더 들일 수 없다", () => {
  expect(MAX_PETS).toBe(5);
  expect(canAddPet(petsOf(4))).toBe(true);
  expect(canAddPet(petsOf(5))).toBe(false);
});

// 받는 동안 지우면 추가 자리가 없다가 생긴다
test("목록을 아직 모르면 막지 않는다", () => {
  expect(canAddPet(undefined)).toBe(true);
});

test("추가 주소는 온보딩 기본 정보 단계로 가며 돌아올 곳을 싣는다", () => {
  const url = new URL(toAddPetHref("/mypage/pets"), "https://leechs.shop");

  expect(url.pathname).toBe("/onboarding");
  expect(url.searchParams.get("step")).toBe("basic");
  expect(url.searchParams.get("from")).toBe("/mypage/pets");
});
