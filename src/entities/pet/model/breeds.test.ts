// 품종으로 종을 되찾는 규칙. "기타"가 양쪽에 있어 이름만으로는 가를 수 없다.
import { describe, expect, test } from "vitest";

import { BREEDS, findSpecies } from "./breeds";

describe("findSpecies", () => {
  test("한쪽에만 있는 품종은 그 종으로 읽는다", () => {
    expect(findSpecies("말티즈")).toBe("dog");
    expect(findSpecies("코리안 숏헤어")).toBe("cat");
  });

  // 고양이로 저장한 "기타"가 강아지로 뒤집히면 추천 기준이 통째로 달라진다
  test("기타는 넘겨준 종을 따른다", () => {
    expect(findSpecies("기타", "cat")).toBe("cat");
    expect(findSpecies("기타", "dog")).toBe("dog");
  });

  test("종을 안 넘기면 먼저 찾은 쪽으로 떨어진다", () => {
    // 가를 근거가 없을 때의 기본값이다. 호출부가 종을 들고 있으면 넘겨야 한다
    expect(findSpecies("기타")).toBe("dog");
  });

  test("넘긴 종에 없는 품종이면 실제 종을 찾는다", () => {
    expect(findSpecies("말티즈", "cat")).toBe("dog");
  });

  test("목록에 없는 품종은 강아지로 둔다", () => {
    expect(findSpecies("없는품종")).toBe("dog");
  });
});

describe("BREEDS", () => {
  test("기능명세서 v0.4의 개수와 맞는다", () => {
    expect(BREEDS.dog).toHaveLength(35);
    expect(BREEDS.cat).toHaveLength(23);
  });

  test("푸들이 체구별로 셋으로 갈린다", () => {
    // 체구가 다르면 급여량과 적합도 계산이 달라진다
    expect(BREEDS.dog).toContain("토이 푸들");
    expect(BREEDS.dog).toContain("스탠다드 푸들");
    expect(BREEDS.dog).toContain("미니어처 푸들");
    expect(BREEDS.dog).not.toContain("푸들");
  });

  test("같은 이름이 두 번 들어가지 않는다", () => {
    expect(new Set(BREEDS.dog).size).toBe(BREEDS.dog.length);
    expect(new Set(BREEDS.cat).size).toBe(BREEDS.cat.length);
  });
});
