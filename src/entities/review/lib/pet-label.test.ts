// 리뷰 카드의 아이 표시 문구를 검증한다. 여러 마리를 줄이지 않는지, 고양이가 종으로 적히는지 본다.
import { describe, expect, it } from "vitest";

import type { ReviewPet } from "../model/review";

import { formatPetProfile, formatPetProfiles } from "./pet-label";

function pet(override: Partial<ReviewPet> = {}): ReviewPet {
  return {
    id: "1",
    name: "보리",
    age: 8,
    species: "DOG",
    breedSize: "SMALL",
    ...override,
  };
}

describe("formatPetProfile", () => {
  it("강아지는 체구와 나이로 적는다", () => {
    expect(formatPetProfile(pet())).toBe("소형견 · 8세");
    expect(formatPetProfile(pet({ breedSize: "MEDIUM", age: 3 }))).toBe("중형견 · 3세");
    expect(formatPetProfile(pet({ breedSize: "LARGE", age: 6 }))).toBe("대형견 · 6세");
  });

  // 고양이는 응답에 체구가 없다. 빈 자리를 두지 않고 종으로 적는다
  it("체구가 없으면 종으로 적는다", () => {
    expect(formatPetProfile(pet({ species: "CAT", breedSize: null, age: 3 }))).toBe("고양이 · 3세");
  });

  it("나이가 0세여도 자리를 지킨다", () => {
    expect(formatPetProfile(pet({ age: 0 }))).toBe("소형견 · 0세");
  });
});

describe("formatPetProfiles", () => {
  it("여러 마리를 줄이지 않고 전부 적는다", () => {
    const pets = [
      pet({ id: "1", breedSize: "SMALL", age: 8 }),
      pet({ id: "2", breedSize: "LARGE", age: 2 }),
      pet({ id: "3", species: "CAT", breedSize: null, age: 5 }),
    ];

    expect(formatPetProfiles(pets)).toBe("소형견 · 8세, 대형견 · 2세, 고양이 · 5세");
  });

  it("한 마리면 구분자가 붙지 않는다", () => {
    expect(formatPetProfiles([pet()])).toBe("소형견 · 8세");
  });
});
