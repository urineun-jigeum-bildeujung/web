// 초안이 기기에 남는지, 깨진 값에 무너지지 않는지, 사진을 빼고 저장하는지 본다.
import { beforeEach, describe, expect, it } from "vitest";

import { EMPTY_PROFILE_DRAFT } from "@/entities/pet";

import { clearDraft, getDraft, resetDraftCache, setDraft } from "./draft-storage";

const KEY = "onboarding-draft";

beforeEach(() => {
  window.localStorage.clear();
  resetDraftCache();
});

describe("저장과 복원", () => {
  it("저장한 것이 다시 읽힌다", () => {
    setDraft({ ...EMPTY_PROFILE_DRAFT, name: "코코", species: "cat", breed: "먼치킨" });
    resetDraftCache();

    const loaded = getDraft();
    expect(loaded.name).toBe("코코");
    expect(loaded.species).toBe("cat");
    expect(loaded.breed).toBe("먼치킨");
  });

  it("저장된 것이 없으면 빈 초안이다", () => {
    expect(getDraft()).toEqual(EMPTY_PROFILE_DRAFT);
  });

  // File은 직렬화되지 않는다. 저장에 끼면 통째로 실패한다
  it("사진은 빼고 저장한다", () => {
    const photo = new File(["x"], "코코.png", { type: "image/png" });
    setDraft({ ...EMPTY_PROFILE_DRAFT, name: "코코", photo });

    expect(window.localStorage.getItem(KEY)).not.toContain("photo");
    resetDraftCache();
    expect(getDraft().photo).toBeNull();
    // 사진 말고는 남는다
    expect(getDraft().name).toBe("코코");
  });

  it("등록을 마치면 지운다", () => {
    setDraft({ ...EMPTY_PROFILE_DRAFT, name: "코코" });
    clearDraft();
    resetDraftCache();

    expect(getDraft()).toEqual(EMPTY_PROFILE_DRAFT);
  });
});

describe("깨진 값", () => {
  it("JSON이 아니면 빈 초안으로 돌아간다", () => {
    window.localStorage.setItem(KEY, "{{");

    expect(getDraft()).toEqual(EMPTY_PROFILE_DRAFT);
  });

  it("객체가 아니면 빈 초안으로 돌아간다", () => {
    window.localStorage.setItem(KEY, JSON.stringify("문자열"));

    expect(getDraft()).toEqual(EMPTY_PROFILE_DRAFT);
  });

  // 손으로 고친 값이 그대로 들어오면 나중에 엉뚱한 곳에서 깨진다
  it("모양이 맞지 않는 칸은 버린다", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ name: 42, species: "새", concern: ["관절염", 7], noConcern: "yes" }),
    );

    const loaded = getDraft();
    expect(loaded.name).toBe("");
    expect(loaded.species).toBe("dog");
    expect(loaded.concern).toEqual([]);
    expect(loaded.noConcern).toBe(false);
  });

  // 체형은 배열 인덱스로 쓰인다. 범위를 벗어나면 설명이 undefined가 된다
  it.each([-1, 1.5, 5, 99, "2", null])("체형 인덱스가 %s면 기본값으로 둔다", (bodyTypeIndex) => {
    window.localStorage.setItem(KEY, JSON.stringify({ bodyTypeIndex }));

    expect(getDraft().bodyTypeIndex).toBe(EMPTY_PROFILE_DRAFT.bodyTypeIndex);
  });

  it.each([0, 2, 4])("체형 인덱스가 %s면 그대로 둔다", (bodyTypeIndex) => {
    window.localStorage.setItem(KEY, JSON.stringify({ bodyTypeIndex }));
    resetDraftCache();

    expect(getDraft().bodyTypeIndex).toBe(bodyTypeIndex);
  });

  // 보기가 정해진 칸도 아무 문자열이나 들어오면 안 된다
  it("보기에 없는 값은 안 고른 것으로 둔다", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ gender: "중성", neutered: "몰라요", size: "초대형견" }),
    );

    const loaded = getDraft();
    expect(loaded.gender).toBe("");
    expect(loaded.neutered).toBe("");
    expect(loaded.size).toBe("");
  });

  it("보기에 있는 값은 그대로 둔다", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ gender: "female", neutered: "yes", size: "small" }),
    );

    const loaded = getDraft();
    expect(loaded.gender).toBe("female");
    expect(loaded.neutered).toBe("yes");
    expect(loaded.size).toBe("small");
  });

  it("모르는 칸은 옮기지 않는다", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ name: "코코", 없는칸: "값" }));

    expect(getDraft()).not.toHaveProperty("없는칸");
    expect(getDraft().name).toBe("코코");
  });
});
