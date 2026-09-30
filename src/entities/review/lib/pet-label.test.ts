// 후기 카드의 아이 줄. 품종명·나이·몸무게를 잇고 여러 마리는 줄이지 않는다.

import { describe, expect, it } from "vitest";

import type { ReviewPet } from "../model/review";
import { formatPetProfile, formatPetProfiles } from "./pet-label";

const BORI: ReviewPet = {
  id: "101",
  name: "보리",
  age: 8,
  species: "DOG",
  breedSize: "SMALL",
  breedId: 12,
  breedName: "시츄",
  weight: 4,
};

const NABI: ReviewPet = {
  id: "102",
  name: "나비",
  age: 3,
  species: "CAT",
  breedSize: null,
  breedId: 45,
  breedName: "먼치킨",
  weight: 4.2,
};

describe("formatPetProfile", () => {
  it("품종명·나이·몸무게를 가운뎃점으로 잇는다", () => {
    expect(formatPetProfile(BORI)).toBe("시츄 · 8세 · 4kg");
  });

  // 체구가 없는 고양이도 품종명으로 적힌다
  it("고양이도 품종명으로 적는다", () => {
    expect(formatPetProfile(NABI)).toBe("먼치킨 · 3세 · 4.2kg");
  });

  // 품종명 스냅샷이 생기기 전에 쓴 후기다. 로그인 여부와 무관하게 누가 봐도 같게 보인다
  it("품종명이 없으면 체구로 적는다", () => {
    expect(formatPetProfile({ ...BORI, breedName: null })).toBe("소형견 · 8세 · 4kg");
  });

  it("품종명도 체구도 없으면 종으로 적는다", () => {
    expect(formatPetProfile({ ...NABI, breedName: null })).toBe("고양이 · 3세 · 4.2kg");
  });

  // 빈 값을 그대로 쓰면 앞이 빈 " · 8세 · 4kg"가 된다
  it.each(["", "   "])("품종명이 비어 있으면 체구로 적는다", (breedName) => {
    expect(formatPetProfile({ ...BORI, breedName })).toBe("소형견 · 8세 · 4kg");
  });

  it("몸무게의 불필요한 0을 떼고 소수 첫째 자리까지 적는다", () => {
    expect(formatPetProfile({ ...BORI, weight: 4.0 })).toContain("4kg");
    expect(formatPetProfile({ ...BORI, weight: 4.25 })).toContain("4.3kg");
    expect(formatPetProfile({ ...BORI, weight: 28 })).toContain("28kg");
  });

  it("0세도 적는다 — 태어난 해의 아이가 빠지면 안 된다", () => {
    expect(formatPetProfile({ ...BORI, age: 0 })).toBe("시츄 · 0세 · 4kg");
  });
});

describe("formatPetProfiles", () => {
  it("아이끼리는 /로 나눈다", () => {
    expect(formatPetProfiles([BORI, NABI])).toBe("시츄 · 8세 · 4kg / 먼치킨 · 3세 · 4.2kg");
  });

  it("여러 마리여도 줄이지 않는다", () => {
    const line = formatPetProfiles([BORI, NABI, { ...BORI, id: "103", name: "묭이" }]);
    expect(line.split(" / ")).toHaveLength(3);
  });
});
